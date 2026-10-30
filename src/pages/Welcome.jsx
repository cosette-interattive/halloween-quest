import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSession } from '../App.jsx';
import { api } from '../lib/api.js';

export default function Welcome() {
  const { session, login } = useSession();
  const [mode, setMode] = useState('enter');
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const [newToken, setNewToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (session && !newToken) return <Navigate to="/dashboard" replace />;

  async function handleEnter(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const r = await api.register(username.trim());
      await login({ id: r.id, username: r.username, token: r.token });
      setNewToken(r.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRecover(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const code = token.trim().toUpperCase();
      const r = await api.recover(username.trim(), code);
      await login({ id: r.id, username: r.username, token: code });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (newToken) {
    return (
      <div className="stack center">
        <h1>Benvenuto!</h1>
        <p>Questo è il tuo codice di recupero:</p>
        <div className="code-display">{newToken}</div>
        <p className="muted">
          Salvalo o fanne uno screenshot. Serve se il browser perde i dati e vuoi tornare nel tuo profilo.
          Non usare la navigazione in incognito e non cancellare i dati del browser.
        </p>
        <button className="btn big" onClick={() => setNewToken('')}>HO SALVATO IL CODICE, ENTRA</button>
      </div>
    );
  }

  return (
    <div className="stack center">
      <div className="float" style={{ fontSize: '4rem' }}>🎃</div>
      <h1>Halloween Quest</h1>

      {mode === 'enter' && (
        <form className="stack" style={{ width: '100%' }} onSubmit={handleEnter}>
          <p className="muted">Scegli uno username per entrare. Nessuna email, nessuna password.</p>
          <input
            placeholder="Il tuo username"
            maxLength={20}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <button className="btn big" disabled={busy || username.trim().length < 3}>ENTRA</button>
          <button type="button" className="link-btn" onClick={() => { setMode('recover'); setError(''); }}>
            Hai già giocato? Ripristina la sessione
          </button>
        </form>
      )}

      {mode === 'recover' && (
        <form className="stack" style={{ width: '100%' }} onSubmit={handleRecover}>
          <input
            placeholder="Il tuo username"
            maxLength={20}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            placeholder="Codice di recupero"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />
          <button className="btn big" disabled={busy}>RIPRISTINA</button>
          <button type="button" className="link-btn" onClick={() => { setMode('enter'); setError(''); }}>
            Torna indietro
          </button>
        </form>
      )}

      {error && <p className="error">{error}</p>}
    </div>
  );
}
