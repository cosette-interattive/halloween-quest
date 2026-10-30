import { useSession } from '../App.jsx';
import BackButton from '../components/BackButton.jsx';
import { useLeaderboard } from '../lib/useLeaderboard.js';

export default function Leaderboard() {
  const { state } = useSession();
  const { rows, error } = useLeaderboard();
  const myIndex = rows.findIndex((r) => r.username === state?.username);

  return (
    <section className="stack">
      <BackButton />
      <h1>Classifica</h1>
      <p className="muted">Ogni missione conta. Anche chi ha pochi punti è in gioco.</p>

      {myIndex >= 0 && (
        <div className="card">
          <p className="muted">La tua posizione</p>
          <h2>#{myIndex + 1} · {rows[myIndex].points} punti</h2>
        </div>
      )}

      <div className="card">
        {rows.slice(0, 10).map((r, i) => (
          <div className={`row${r.username === state?.username ? ' me' : ''}`} key={r.username}>
            <span>{i + 1}. {r.username}</span>
            <span>{r.points} pt · {r.completed_count} missioni</span>
          </div>
        ))}
        {rows.length === 0 && !error && <p className="muted">Nessun partecipante ancora.</p>}
      </div>

      {error && <p className="error">{error}</p>}
    </section>
  );
}
