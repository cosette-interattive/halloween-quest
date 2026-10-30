// 10 = rame, 20 = bronzo, 40 = oro
const TONES = { 10: 'pts-copper', 20: 'pts-bronze', 40: 'pts-gold' };

export default function PointsBadge({ points }) {
  return <span className={`pts ${TONES[points] ?? 'pts-other'}`}>{points} pt</span>;
}
