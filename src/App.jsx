import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Welcome from './pages/Welcome.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Missions from './pages/Missions.jsx';
import MissionDetail from './pages/MissionDetail.jsx';
import Validate from './pages/Validate.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import Prizes from './pages/Prizes.jsx';
import Profile from './pages/Profile.jsx';
import Qr from './pages/Qr.jsx';
import Admin from './pages/Admin.jsx';
import { api } from './lib/api.js';
import { supabase } from './lib/supabase.js';
import { clearSession, loadSession, saveSession } from './lib/session.js';
import { loadMissionCatalog } from './lib/missionsSource.js';
import { getMission, setMissionCatalog } from './lib/missions.js';

const SessionContext = createContext(null);
export const useSession = () => useContext(SessionContext);

export default function App() {
  const [session, setSession] = useState(loadSession);
  const [state, setState] = useState(null);
  const [booting, setBooting] = useState(() => Boolean(loadSession()));
  const [catalogReady, setCatalogReady] = useState(false);
  const [celebration, setCelebration] = useState(null);
  const pendingRef = useRef(new Map());

  const refresh = useCallback(async () => {
    const current = loadSession();
    if (!current) {
      setState(null);
      return null;
    }
    try {
      const data = await api.myState(current.token);
      setState(data);
      return data;
    } catch (e) {
      if (e.code === 'SESSIONE_NON_VALIDA') {
        clearSession();
        setSession(null);
        setState(null);
      }
      throw e;
    }
  }, []);

  const requests = state?.requests ?? [];
  const hasLivePending = requests.some(
    (r) => r.role === 'requester' && r.status === 'pending' && new Date(r.expires_at) > new Date()
  );

  useEffect(() => {
    if (!session || !hasLivePending) return undefined;
    const timer = setInterval(() => refresh().catch(() => {}), 5000);
    return () => clearInterval(timer);
  }, [session, hasLivePending, refresh]);

  useEffect(() => {
    const previous = pendingRef.current;
    pendingRef.current = new Map(
      requests
        .filter((r) => r.role === 'requester' && r.status === 'pending')
        .map((r) => [r.id, r.mission_id])
    );
    const completed = requests.find(
      (r) => r.role === 'requester' && r.status === 'completed' && previous.has(r.id)
    );
    if (completed) setCelebration({ missionId: completed.mission_id });
  }, [state]);

  useEffect(() => {
    loadMissionCatalog()
      .then(setMissionCatalog)
      .finally(() => setCatalogReady(true));
  }, []);

  useEffect(() => {
    refresh().catch(() => {}).finally(() => setBooting(false));
  }, [refresh]);

  const login = useCallback(
    async (next) => {
      saveSession(next);
      setSession(next);
      await refresh();
    },
    [refresh]
  );

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
    setState(null);
  }, []);

  if (!supabase) {
    return (
      <div className="app center">
        <h1>Configurazione mancante</h1>
        <p className="muted">Imposta VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.</p>
      </div>
    );
  }

  if (booting || !catalogReady) return <div className="center">Caricamento...</div>;

  const ctx = { session, state, refresh, login, logout };

  return (
    <SessionContext.Provider value={ctx}>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/qr" element={<Qr />} />
        <Route path="/admin" element={<Admin />} />
        <Route element={session ? <Layout /> : <Navigate to="/" replace />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/missioni" element={<Missions />} />
          <Route path="/missioni/:id" element={<MissionDetail />} />
          <Route path="/valida" element={<Validate />} />
          <Route path="/classifica" element={<Leaderboard />} />
          <Route path="/premi" element={<Prizes />} />
          <Route path="/profilo" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {celebration && (
        <div className="overlay">
          <div className="card stack" style={{ textAlign: 'center' }}>
            <div className="pop">+{getMission(celebration.missionId)?.points ?? 0}</div>
            <h1>Missione completata!</h1>
            <p className="muted">{getMission(celebration.missionId)?.title}</p>
            <button className="btn big" onClick={() => setCelebration(null)}>OK</button>
          </div>
        </div>
      )}
    </SessionContext.Provider>
  );
}
