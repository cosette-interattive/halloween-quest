import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../App.jsx';
import BackButton from '../components/BackButton.jsx';

export default function Profile() {
  const { session, state, logout } = useSession();
  const navigate = useNavigate();
  const [showCode, setShowCode] = useState(false);

  function handleLogout() {
    if (!window.confirm('Uscire? Senza il codice di recupero non potrai riprendere la sessione su questo browser.')) return;
    logout();
    navigate('/', { replace: true });
  }

  return (
    <section className="stack">
      <BackButton />
      <h1>Profilo</h1>
      <div className="card">
        <p className="muted">Username</p>
        <h2>{state?.username ?? session?.username}</h2>
        <p>Punti: <strong>{state?.points ?? 0}</strong></p>
        <p>Missioni completate: <strong>{state?.completed_count ?? 0}</strong></p>
      </div>

      <div className="card stack">
        <h2>Codice di recupero</h2>
        {showCode ? (
          <div className="code-display">{session?.token}</div>
        ) : (
          <button className="btn ghost" onClick={() => setShowCode(true)}>Mostra codice</button>
        )}
      </div>

      <button className="btn ghost" onClick={handleLogout}>Esci da questo dispositivo</button>
    </section>
  );
}
