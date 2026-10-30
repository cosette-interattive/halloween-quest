import { PRIZES, PRIZE_NOTES } from '../data/prizes.js';
import BackButton from '../components/BackButton.jsx';

export default function Prizes() {
  return (
    <section className="stack">
      <BackButton />
      <h1>Premi</h1>

      {PRIZES.map((p) => (
        <div className="card prize-card" key={p.title}>
          <h2>{p.title}</h2>
          <p className="muted">{p.description}</p>
        </div>
      ))}

      <div className="card">
        {PRIZE_NOTES.map((note) => <p key={note}>{note}</p>)}
      </div>
    </section>
  );
}
