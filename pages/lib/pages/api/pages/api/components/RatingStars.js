import { useState } from 'react'

export default function RatingStars({ value = 0, onChange, size = 20, readOnly = false }) {
const [hover, setHover] = useState(0)
const stars = [1,2,3,4,5]
return (
<div className="flex items-center gap-1">
{stars.map((s) => (
<button
key={s}
type="button"
aria-label={`Rate ${s} star`}
onMouseEnter={() => !readOnly && setHover(s)}
onMouseLeave={() => !readOnly && setHover(0)}
onClick={() => !readOnly && onChange?.(s)}
className="p-0.5"
>
<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={(hover || value) >= s ? 'currentColor' : 'none'} stroke="currentColor">
<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
</svg>
</button>
))}
</div>
)
}
