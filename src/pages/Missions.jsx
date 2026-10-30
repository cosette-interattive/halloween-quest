import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '../App.jsx';
import { CATEGORY_LABEL, summarize } from '../lib/missions.js';
import BackButton from '../components/BackButton.jsx';
import PointsBadge from '../components/PointsBadge.jsx';

const BATCH = 6;

export default function Missions() {
  const { state, refresh } = useSession();
  const [batch, setBatch] = useState(1);
  const randomKeys = useMemo(() => {
    const keys = {};
    for (const m of summarize(null).available) keys[m.id] = Math.random();
    return keys;
  }, []);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  const s = summarize(state);
  const available = [...s.available].sort((a, b) => (randomKeys[a.id] ?? 0) - (randomKeys[b.id] ?? 0));
  const shown = available.slice(0, BATCH * batch);

  return (
    <section className="stack">
      <BackButton />
      <h1>Missioni</h1>

      <h2>Disponibili</h2>
      <div className="list">
        {shown.map((m) => <MissionCard key={m.id} mission={m} />)}
        {shown.length === 0 && <p className="muted">Nessuna missione disponibile in questo momento.</p>}
      </div>
      {shown.length < available.length && (
        <button className="btn ghost" onClick={() => setBatch((b) => b + 1)}>Altre missioni</button>
      )}

      {s.inProgress.length > 0 && (
        <>
          <h2>In attesa</h2>
          <div className="list">
            {s.inProgress.map(({ request, mission }) => (
              <MissionCard
                key={request.id}
                mission={mission}
                badge="In attesa del partner"
              />
            ))}
          </div>
        </>
      )}

      {s.expired.length > 0 && (
        <>
          <h2>Scadute</h2>
          <div className="list">
            {s.expired.map(({ mission }) => (
              <MissionCard key={mission.id} mission={mission} badge="Scaduta, puoi riprovare" />
            ))}
          </div>
        </>
      )}

      {s.completed.length > 0 && (
        <>
          <h2>Completate</h2>
          <div className="list">
            {s.completed.map((m) => <MissionCard key={m.id} mission={m} badge="Completata" />)}
          </div>
        </>
      )}
    </section>
  );
}

function MissionCard({ mission, badge }) {
  return (
    <Link className="mission-card" to={`/missioni/${mission.id}`}>
      <span className="badge">{CATEGORY_LABEL[mission.category]}</span>
      <PointsBadge points={mission.points} />
      {badge && <span className="badge">{badge}</span>}
      <h3>{mission.title}</h3>
      <p className="muted">{mission.description}</p>
    </Link>
  );
}
