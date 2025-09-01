import prisma from '../../lib/prisma'

export default async function handler(req, res) {
try {
if (req.method === 'GET') {
const { videoId } = req.query
if (!videoId) return res.status(400).json({ error: 'videoId gerekli' })
const comments = await prisma.comment.findMany({
where: { videoId: Number(videoId) },
orderBy: { createdAt: 'desc' },
take: 50
})
return res.json(comments)
}

if (req.method === 'POST') {
const { videoId, body } = req.body || {}
if (!videoId || !body || !String(body).trim()) return res.status(400).json({ error: 'Geçersiz veri' })
const cookie = req.headers.cookie || ''
const sid = (cookie.split('; ').find((r) => r.startsWith('sid=')) || '').split('=')[1]
if (!sid) return res.status(400).json({ error: 'Oturum bulunamadı (cookie). Siteyi yeniden yükleyin.' })
// Basit hız limiti: 10 sn
const last = await prisma.comment.findFirst({ where: { userSessionId: sid }, orderBy: { createdAt: 'desc' } })
if (last && (Date.now() - new Date(last.createdAt).getTime()) < 10_000) {
return res.status(429).json({ error: 'Lütfen biraz sonra tekrar deneyin.' })
}
const created = await prisma.comment.create({
data: { videoId: Number(videoId), userSessionId: sid, body: String(body).slice(0, 1000) }
})
return res.status(201).json(created)
}

res.status(405).json({ error: 'Method not allowed' })
} catch (e) {
console.error(e)
res.status(500).json({ error: 'Server error' })
}
}
