/**
* Kullanıcı puanı + izlenme + beğeni + yenilik (recency) karmasıyla skor üretir.
*/
export function computeScore({ avgRating = 0, ratingCount = 0, viewCount = 0, likeCount = 0, publishedAt }) {
const ratingWeight = Math.min(1, ratingCount / 10); // 10+ oyda tam ağırlık
const ratingScore = (avgRating / 5) * (0.55 + 0.35 * ratingWeight); // 0..0.9

const viewsScore = Math.log10((viewCount || 0) + 1) / 6; // 0..~1
const likesScore = Math.log10((likeCount || 0) + 1) / 6;

const now = new Date();
const pub = new Date(publishedAt);
const days = Math.max(1, (now - pub) / (1000 * 60 * 60 * 24));
const recencyScore = 1 / Math.log2(days + 1.5);
const recencyNorm = Math.min(1, recencyScore / 2);

return 0.5 * ratingScore + 0.25 * viewsScore + 0.15 * likesScore + 0.10 * recencyNorm;
}
