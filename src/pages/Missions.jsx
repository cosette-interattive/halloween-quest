import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '../App.jsx';
import { CATEGORY_LABEL, assignedMissions, summarize } from '../lib/missions.js';
import BackButton from '../components/BackButton.jsx';
import PointsBadge from '../components/PointsBadge.jsx';

export default function Missions() {
  const { state, assignedIds, refresh } = useSession();

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  const assigned = assignedMissions(assignedIds);
  const s = summarize(state, assigned);

  return (
    <section className="stack">
      <BackButton />
      <h1>Le tue missioni</h1>
      <p className="muted">Hai {assigned.length} missioni assegnate: ordinate dalla più preziosa.</p>

      <h2>Disponibili</h2>
      <div className="list">
        {s.available.map((m) => <MissionCard key={m.id} mission={m} />)}
        {s.available.length === 0 && <p className="muted">Nessuna missione disponibile in questo momento.</p>}
      </div>

      {s.inProgress.length > 0 && (
        <>
          <h2>In attesa</h2>
          <div className="list">
            {s.inProgress.map(({ request, mission }) => (
              <MissionCard key={request.id} mission={mission} badge="In attesa del partner" />
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
    <Link className={`mission-card tier-${mission.points}`} to={`/missioni/${mission.id}`}>
      <div className="mission-top">
        <span className="mission-icon">{mission.icon}</span>
        <PointsBadge points={mission.points} />
      </div>
      <span className="badge">{CATEGORY_LABEL[mission.category]}</span>
      {badge && <span className="badge">{badge}</span>}
      <h3>{mission.title}</h3>
      <p className="muted">{mission.description}</p>
    </Link>
  );
}
