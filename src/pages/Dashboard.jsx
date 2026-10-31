import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '../App.jsx';
import { summarize, assignedMissions } from '../lib/missions.js';
import { useLeaderboard } from '../lib/useLeaderboard.js';

export default function Dashboard() {
  const { state, assignedIds, refresh } = useSession();
  const { rows } = useLeaderboard();

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  const s = summarize(state, assignedMissions(assignedIds));
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
        <Link className="btn tile outline outline-acid" to="/missioni"><span className="icon">🗺️</span>Le tue missioni</Link>
        <Link className="btn tile outline" to="/valida"><span className="icon">🗣️</span>Valida una missione</Link>
      </div>

      <div className="card">
        <h2>Regolamento</h2>
        <ol className="rules">
          <li>
            <span className="num">1</span>
            <div>
              <strong>Scegli la tua missione</strong>
              <span className="desc">Apri le tue missioni e seleziona quella che vuoi completare.</span>
            </div>
          </li>
          <li>
            <span className="num">2</span>
            <div>
              <strong>Trova qualcuno e realizzala</strong>
              <span className="desc">Fai la missione insieme a un'altra persona.</span>
            </div>
          </li>
          <li>
            <span className="num">3</span>
            <div>
              <strong>Fatti validare</strong>
              <span className="desc">Chiedi alla persona di confermare la buona riuscita: mostra il codice e lei lo inserisce in Valida una missione.</span>
            </div>
          </li>
          <li>
            <span className="num">4</span>
            <div>
              <strong>Procedi e guarda la classifica</strong>
              <span className="desc">I punti arrivano subito. Controlla la tua posizione e continua a giocare.</span>
            </div>
          </li>
        </ol>
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

      <Link to="/premi">Premi</Link>
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
