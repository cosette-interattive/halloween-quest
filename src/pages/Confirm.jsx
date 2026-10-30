import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '../App.jsx';
import CodeInput from '../components/CodeInput.jsx';
import { api } from '../lib/api.js';
import { getMission } from '../lib/missions.js';

export default function Confirm() {
  const { session, refresh } = useSession();
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const r = await api.completeRequest(session.token, code);
      setResult(r);
      refresh().catch(() => {});
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <section className="celebrate">
        <div className="pop">+{result.points}</div>
        <h1>Missione completata!</h1>
        <p className="muted">{getMission(result.mission_id)?.title}</p>
        <Link className="btn big" to="/dashboard">TORNA ALLA HOME</Link>
      </section>
    );
  }

  return (
    <section className="stack">
      <h1>Conferma missione</h1>
      <p className="muted">Inserisci il codice che ti ha comunicato la persona che ti ha validato.</p>
      <form className="stack" onSubmit={submit}>
        <CodeInput value={code} onChange={setCode} disabled={busy} />
        <button className="btn big" disabled={busy || code.length !== 6}>CONFERMA</button>
      </form>
      {error && <p className="error">{error}</p>}
    </section>
  );
}
