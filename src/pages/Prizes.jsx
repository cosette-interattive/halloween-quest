import { PRIZE_NOTES, PRIZE_TIERS } from '../data/prizes.js';
import { useSession } from '../App.jsx';
import BackButton from '../components/BackButton.jsx';

export default function Prizes() {
  const { state } = useSession();
  const points = state?.points ?? 0;

  return (
    <section className="stack">
      <BackButton />
      <h1>Premi</h1>
      <p className="muted">Hai {points} punti.</p>

      {PRIZE_TIERS.map((t) => (
        <div className="card" key={t.points} style={{ opacity: points >= t.points ? 1 : 0.6 }}>
          <span className="badge">{t.points} punti</span>
          <h2>{t.title} {points >= t.points && '✓'}</h2>
          <p className="muted">{t.description}</p>
        </div>
      ))}

      <div className="card">
        {PRIZE_NOTES.map((note) => <p key={note}>{note}</p>)}
      </div>
    </section>
  );
}
