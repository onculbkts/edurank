import { useEffect, useMemo, useState } from 'react'
import VideoCard from '../components/VideoCard'

const SUBJECTS = {
YKS: ['Matematik','Geometri','Fizik','Kimya','Biyoloji','Türkçe','Edebiyat','Tarih','Coğrafya','Felsefe','Din Kültürü'],
LGS: ['Matematik','Fen Bilimleri','Türkçe','İnkılap Tarihi','Din Kültürü','İngilizce']
}

export default function Home() {
const [exam, setExam] = useState('YKS')
const [subject, setSubject] = useState('Matematik')
const [topic, setTopic] = useState('')
const [query, setQuery] = useState('')
const [videos, setVideos] = useState([])
const [loading, setLoading] = useState(false)
const [sort, setSort] = useState('best')

const subjects = useMemo(() => SUBJECTS[exam] || [], [exam])

const runSearch = async () => {
setLoading(true)
try {
const url = new URL('/api/videos/search', window.location.origin)
if (exam) url.searchParams.set('exam', exam)
if (subject) url.searchParams.set('subject', subject)
if (topic) url.searchParams.set('topic', topic)
if (query) url.searchParams.set('q', query)
url.searchParams.set('sort', sort)
const res = await fetch(url.toString())
const data = await res.json()
setVideos(data)
} finally {
setLoading(false)
}
}

useEffect(() => {
runSearch()
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [])

return (
<div>
<header className="border-b bg-white">
<div className="container py-4 flex items-center gap-4">
<div className="text-xl font-bold">EduRank</div>
<div className="hidden sm:block text-sm text-gray-600">YouTube ders videoları için tarafsız sıralama</div>
</div>
</header>

<main className="container py-6 space-y-4">
<div className="card p-4">
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
<div>
<label className="text-sm text-gray-600">Sınav</label>
<select className="select mt-1" value={exam} onChange={e => { setExam(e.target.value); setSubject(SUBJECTS[e.target.value][0] || '') }}>
<option>YKS</option>
<option>LGS</option>
</select>
</div>
<div>
<label className="text-sm text-gray-600">Ders</label>
<select className="select mt-1" value={subject} onChange={e => setSubject(e.target.value)}>
{subjects.map(s => <option key={s} value={s}>{s}</option>)}
</select>
</div>
<div>
<label className="text-sm text-gray-600">Konu (isteğe bağlı)</label>
<input className="input mt-1" placeholder="Örn: Paragraf, Trigonometri..." value={topic} onChange={e => setTopic(e.target.value)} />
</div>
<div>
<label className="text-sm text-gray-600">Ek anahtar kelime</label>
<input className="input mt-1" placeholder="Örn: soru çözümü" value={query} onChange={e => setQuery(e.target.value)} />
</div>
<div>
<label className="text-sm text-gray-600">Sırala</label>
<select className="select mt-1" value={sort} onChange={e => setSort(e.target.value)}>
<option value="best">En iyiler</option>
<option value="views">İzlenme</option>
<option value="recent">En yeni</option>
<option value="length">Kısa (süre)</option>
</select>
</div>
</div>
<div className="mt-3 flex gap-2">
<button onClick={runSearch} className="btn">Ara / Güncelle</button>
</div>
</div>

{loading && <div className="text-center py-10 text-gray-500">Yükleniyor...</div>}

{!loading && videos.length === 0 && (
<div className="text-center py-10 text-gray-500">Sonuç bulunamadı.</div>
)}

<div className="space-y-3">
{videos.map(v => (
<VideoCard key={v.id} video={v} onRated={runSearch} />
))}
</div>
</main>

<footer className="container py-10 text-sm text-gray-500">
<div>© {new Date().getFullYear()} EduRank — Topluluk destekli YouTube ders video sıralayıcı</div>
</footer>
</div>
)
}
