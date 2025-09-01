import prisma from '../../../lib/prisma'
import { computeScore } from '../../../lib/ranking'

const YT_ENDPOINT = 'https://www.googleapis.com/youtube/v3'

function parseISODurationToSeconds(iso) {
// e.g., PT1H2M30S
const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/
const match = iso.match(regex)
if (!match) return 0
const hours = parseInt(match[1] || '0', 10)
const minutes = parseInt(match[2] || '0', 10)
const seconds = parseInt(match[3] || '0', 10)
return hours * 3600 + minutes * 60 + seconds
}

export default async function handler(req, res) {
try {
const { exam = 'YKS', subject = '', topic = '', q = '', sort = 'best' } = req.query
const apiKey = process.env.YOUTUBE_API_KEY
if (!apiKey) {
return res.status(500).json({ error: 'Server misconfig: Missing YOUTUBE_API_KEY' })
}

const searchQ = [exam, subject, topic, q].filter(Boolean).join(' ')
const searchUrl = new URL(YT_ENDPOINT + '/search')
searchUrl.searchParams.set('key', apiKey)
searchUrl.searchParams.set('part', 'snippet')
searchUrl.searchParams.set('q', searchQ)
searchUrl.searchParams.set('type', 'video')
searchUrl.searchParams.set('maxResults', '25')
searchUrl.searchParams.set('relevanceLanguage', 'tr')
searchUrl.searchParams.set('regionCode', 'TR')

const searchResp = await fetch(searchUrl.toString())
const searchData = await searchResp.json()
if (!searchResp.ok) {
console.error('YT search error', searchData)
return res.status(500).json({ error: 'YouTube search failed' })
}
const items = searchData.items || []
const ids = items.map(i => i.id.videoId).filter(Boolean)
if (ids.length === 0) return res.json([])

const videosUrl = new URL(YT_ENDPOINT + '/videos')
videosUrl.searchParams.set('key', apiKey)
videosUrl.searchParams.set('part', 'snippet,statistics,contentDetails')
videosUrl.searchParams.set('id', ids.join(','))

const vidsResp = await fetch(videosUrl.toString())
const vidsData = await vidsResp.json()
if (!vidsResp.ok) {
console.error('YT videos error', vidsData)
return res.status(500).json({ error: 'YouTube details failed' })
}

const results = []
for (const v of vidsData.items || []) {
const youtubeId = v.id
const title = v.snippet?.title || ''
const channelTitle = v.snippet?.channelTitle || ''
const description = v.snippet?.description || ''
const thumbnail = v.snippet?.thumbnails?.medium?.url || v.snippet?.thumbnails?.default?.url || ''
const publishedAt = v.snippet?.publishedAt ? new Date(v.snippet.publishedAt) : new Date()
const durationSec = parseISODurationToSeconds(v.contentDetails?.duration || 'PT0S')
const viewCount = parseInt(v.statistics?.viewCount || '0', 10)
const likeCount = parseInt(v.statistics?.likeCount || '0', 10)

// DB'ye upsert
const saved = await prisma.video.upsert({
where: { youtubeId },
update: {
title, channelTitle, description, thumbnail,
exam, subject, topic,
durationSec, viewCount, likeCount, publishedAt,
},
create: {
youtubeId, title, channelTitle, description, thumbnail,
exam, subject, topic,
durationSec, viewCount, likeCount, publishedAt,
}
})

// Puan ortalaması
const agg = await prisma.rating.aggregate({
where: { videoId: saved.id },
_avg: { stars: true },
_count: { _all: true }
})
const avgRating = agg._avg.stars || 0
const ratingCount = agg._count._all || 0
const score = computeScore({
avgRating,
ratingCount,
viewCount: saved.viewCount,
likeCount: saved.likeCount,
publishedAt: saved.publishedAt
})

results.push({
...saved,
avgRating,
ratingCount,
score
})
}

// sıralama
const sorted = results.sort((a, b) => {
if (sort === 'views') return (b.viewCount||0) - (a.viewCount||0)
if (sort === 'recent') return new Date(b.publishedAt) - new Date(a.publishedAt)
if (sort === 'length') return (a.durationSec||0) - (b.durationSec||0)
return (b.score || 0) - (a.score || 0) // best
})

res.setHeader('Cache-Control', 'no-store')
return res.json(sorted)
} catch (e) {
console.error(e)
return res.status(500).json({ error: 'Server error' })
}
}
