import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import BackButton from '../components/BackButton.jsx';
import PointsBadge from '../components/PointsBadge.jsx';
import { useSession } from '../App.jsx';
import Countdown from '../components/Countdown.jsx';
import { api } from '../lib/api.js';
import { CATEGORY_LABEL, getMission, summarize } from '../lib/missions.js';
import { loadOutgoing, saveOutgoing } from '../lib/session.js';

export default function MissionDetail() {
  const { id } = useParams();
  const { session, state, refresh } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [outgoing, setOutgoing] = useState(loadOutgoing);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  const mission = getMission(id);
  if (!mission) return <Navigate to="/missioni" replace />;

  const s = summarize(state);
  const isAvailable = s.available.some((m) => m.id === id);
  const current = s.inProgress.find((x) => x.mission.id === id)?.request;
  const isExpired = s.expired.some((x) => x.mission.id === id);
  const isCompleted = s.completed.some((m) => m.id === id);
  const myCode = current?.status === 'pending' ? outgoing.find((o) => o.requestId === current.id) : null;

  async function start() {
    setBusy(true);
    setError('');
    try {
      const r = await api.createRequest(session.token, id);
      const list = [
        ...loadOutgoing().filter((o) => o.missionId !== id),
        { requestId: r.request_id, missionId: id, code: r.code, expiresAt: r.expires_at },
      ];
      saveOutgoing(list);
      setOutgoing(list);
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="stack">
      <BackButton />
      <div className="card">
        <span className="badge">{CATEGORY_LABEL[mission.category]}</span>
        <PointsBadge points={mission.points} />
        <h1>{mission.title}</h1>
        <p>{mission.description}</p>
        {mission.instructions && <p className="muted">{mission.instructions}</p>}
        {mission.conversationStarter && <p><em>"{mission.conversationStarter}"</em></p>}
      </div>

      {isCompleted && <p className="card">Missione completata.</p>}

      {isAvailable && (
        <>
          <p className="muted">Trova una persona, fate la missione insieme, poi genera il codice.</p>
          <button className="btn big" disabled={busy} onClick={start}>COMPLETA MISSIONE</button>
        </>
      )}

      {isExpired && !isAvailable && (
        <button className="btn big" disabled={busy} onClick={start}>RIPROVA</button>
      )}

      {current?.status === 'pending' && (
        <div className="card">
          {myCode ? (
            <>
              <p>Mostra questo codice alla persona con cui hai fatto la missione:</p>
              <div className="code-display">{myCode.code}</div>
              <Countdown until={current.expires_at} onEnd={() => refresh().catch(() => {})} />
              <p className="muted">La missione si completa appena l'altra persona inserisce il codice.</p>
            </>
          ) : (
            <p className="muted">Codice non disponibile su questo dispositivo. Attendi la scadenza e riprova.</p>
          )}
        </div>
      )}

      {error && <p className="error">{error}</p>}
    </section>
  );
}
