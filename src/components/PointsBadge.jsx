const TONES = { 10: 'pts-10', 15: 'pts-15', 20: 'pts-20', 25: 'pts-25' };

export default function PointsBadge({ points }) {
  return <span className={`pts ${TONES[points] ?? 'pts-other'}`}>{points} pt</span>;
}
