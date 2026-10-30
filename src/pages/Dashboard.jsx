import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '../App.jsx';
import { summarize } from '../lib/missions.js';
import { useLeaderboard } from '../lib/useLeaderboard.js';

export default function Dashboard() {
  const { state, refresh } = useSession();
  const { rows } = useLeaderboard();

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  const s = summarize(state);
  const myIndex = rows.findIndex((r) => r.username === state?.username);

  return (
    <section className="stack">
      <div className="card">
        <p className="muted">Ciao</p>
        <h1>{state?.username ?? '...'}</h1>
        <div className="stats">
          <Stat label="Punti" value={state?.points ?? 0} />
          <Stat label="Completate" value={state?.completed_count ?? 0} />
          <Stat label="Disponibili" value={s.available.length} />
        </div>
        <p className="muted" style={{ marginTop: 10 }}>
          In attesa: {s.inProgress.length} · Scadute: {s.expired.length}
        </p>
      </div>

      <div className="actions">
        <Link className="btn tile" to="/valida"><span className="icon">🗣️</span>Valida una missione</Link>
        <Link className="btn tile acid" to="/missioni"><span className="icon">🗺️</span>Vedi le missioni</Link>
      </div>

      <div className="card">
        <h2>Classifica</h2>
        {rows.slice(0, 3).map((r, i) => (
          <div className="row" key={r.username}>
            <span>{i + 1}. {r.username}</span>
            <span>{r.points} pt</span>
          </div>
        ))}
        {myIndex >= 0 && (
          <p className="muted" style={{ marginTop: 10 }}>
            Tu sei al posto {myIndex + 1} con {rows[myIndex].points} punti.
          </p>
        )}
        <Link to="/classifica">Classifica completa</Link>
      </div>

      <Link to="/premi">Premi e soglie</Link>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
