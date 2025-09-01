import prisma from '../../lib/prisma'

export default async function handler(req, res) {
try {
if (req.method === 'POST') {
const { videoId, stars } = req.body || {}
if (!videoId || !stars || stars < 1 || stars > 5) return res.status(400).json({ error: 'Geçersiz veri' })

// Cookie'den anonim session id al
const cookie = req.headers.cookie || ''
const sid = (cookie.split('; ').find((r) => r.startsWith('sid=')) || '').split('=')[1]
if (!sid) return res.status(400).json({ error: 'Oturum bulunamadı (cookie). Siteyi yeniden yükleyin.' })

await prisma.rating.upsert({
where: { videoId_userSessionId: { videoId: Number(videoId), userSessionId: sid } },
update: { stars: Number(stars) },
create: { videoId: Number(videoId), userSessionId: sid, stars: Number(stars) },
})

const agg = await prisma.rating.aggregate({
where: { videoId: Number(videoId) },
_avg: { stars: true },
_count: { _all: true }
})
return res.json({ avg: agg._avg.stars || 0, count: agg._count._all || 0 })
}

if (req.method === 'GET') {
const { videoId } = req.query
if (!videoId) return res.status(400).json({ error: 'videoId gerekli' })
const agg = await prisma.rating.aggregate({
where: { videoId: Number(videoId) },
_avg: { stars: true },
_count: { _all: true }
})
return res.json({ avg: agg._avg.stars || 0, count: agg._count._all || 0 })
}

res.status(405).json({ error: 'Method not allowed' })
} catch (e) {
console.error(e)
res.status(500).json({ error: 'Server error' })
}
}
