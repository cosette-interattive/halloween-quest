import { useState } from 'react';
import { useSession } from '../App.jsx';
import CodeInput from '../components/CodeInput.jsx';
import { api } from '../lib/api.js';
import { getMission } from '../lib/missions.js';
import BackButton from '../components/BackButton.jsx';

export default function Validate() {
  const { session, refresh } = useSession();
  const [code, setCode] = useState('');
  const [found, setFound] = useState(null);
  const [done, setDone] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function search(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setFound(null);
    try {
      setFound(await api.findRequest(session.token, code));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    setBusy(true);
    setError('');
    try {
      const r = await api.confirmRequest(session.token, found.request_id);
      setDone(r);
      setFound(null);
      setCode('');
      refresh().catch(() => {});
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <section className="stack center">
        <h1>Missione confermata!</h1>
        <p>{done.requester} ha completato la missione:</p>
        <h2>{getMission(done.mission_id)?.title}</h2>
        <button className="btn ghost" onClick={() => setDone(null)}>Valida un'altra</button>
        <BackButton />
      </section>
    );
  }

  return (
    <section className="stack">
      <BackButton />
      <h1>Valida missione</h1>
      <p className="muted">Inserisci il codice che ti mostra l'altra persona.</p>

      <form className="stack" onSubmit={search}>
        <CodeInput value={code} onChange={setCode} disabled={busy} />
        <button className="btn big" disabled={busy || code.length !== 6}>CERCA</button>
      </form>

      {found && (
        <div className="card stack">
          <p><strong>{found.requester}</strong> vuole completare la missione:</p>
          <h2>{getMission(found.mission_id)?.title}</h2>
          <button className="btn big" disabled={busy} onClick={confirm}>CONFERMO, MISSIONE COMPLETATA</button>
        </div>
      )}

      {error && <p className="error">{error}</p>}
    </section>
  );
}
