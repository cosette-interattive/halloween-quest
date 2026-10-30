import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, AppError } from '../lib/api.js';
import { loadMissionCatalog } from '../lib/missionsSource.js';
import BackButton from '../components/BackButton.jsx';

export default function Admin() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function run(action) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await action();
    } catch (e) {
      if (e instanceof AppError && e.code === 'PASSWORD_ADMIN_NON_VALIDA') {
        setAuthed(false);
        setPassword('');
      }
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function reload() {
    setParticipants(await api.adminList(password));
  }

  function login(e) {
    e.preventDefault();
    run(async () => {
      await reload();
      setAuthed(true);
    });
  }

  function logout() {
    setAuthed(false);
    setPassword('');
    setParticipants([]);
    setMessage('');
    setError('');
  }

  function removeOne(p) {
    if (!window.confirm(`Rimuovere ${p.username} e tutti i suoi punti?`)) return;
    run(async () => {
      await api.adminRemove(password, p.id);
      setMessage(`${p.username} rimosso.`);
      await reload();
    });
  }

  function resetAll() {
    if (!window.confirm('Cancellare TUTTI i partecipanti, punti e missioni in corso? Operazione irreversibile.')) return;
    run(async () => {
      const count = await api.adminReset(password);
      setMessage(`Gioco resettato: ${count} partecipanti rimossi.`);
      await reload();
    });
  }

  function syncMissions() {
    run(async () => {
      const catalog = await loadMissionCatalog();
      const active = await api.adminSyncMissions(password, catalog);
      setMessage(`Missioni sincronizzate: ${active} attive.`);
    });
  }

  if (!authed) {
    return (
      <section className="stack center">
        <h1>Area host</h1>
        <form className="stack" style={{ width: '100%' }} onSubmit={login}>
          <input
            type="password"
            placeholder="Password host"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="btn big" disabled={busy || !password}>ENTRA</button>
        </form>
        {error && <p className="error">{error}</p>}
        <Link to="/">Torna all'app</Link>
      </section>
    );
  }

  return (
    <section className="stack">
      <BackButton />
      <h1>Area host</h1>
      <div className="list">
        <button className="btn ghost" disabled={busy} onClick={() => run(reload)}>Aggiorna lista</button>
        <button className="btn ghost" disabled={busy} onClick={syncMissions}>Sincronizza missioni dal JSON</button>
        <button className="btn" disabled={busy} onClick={resetAll}>RESET GIOCO</button>
      </div>

      {message && <p className="card">{message}</p>}
      {error && <p className="error">{error}</p>}

      <h2>Partecipanti ({participants.length})</h2>
      <div className="card">
        {participants.map((p) => (
          <div className="row" key={p.id}>
            <span>{p.username} · {p.points} pt</span>
            <button className="link-btn" disabled={busy} onClick={() => removeOne(p)}>Rimuovi</button>
          </div>
        ))}
        {participants.length === 0 && <p className="muted">Nessun partecipante.</p>}
      </div>

      <button className="link-btn" onClick={logout}>Esci dall'area host</button>
    </section>
  );
}
