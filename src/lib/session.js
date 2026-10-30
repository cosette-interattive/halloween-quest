const SESSION_KEY = 'hq_session';
const OUTGOING_KEY = 'hq_outgoing';

function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  if (value === null) localStorage.removeItem(key);
  else localStorage.setItem(key, JSON.stringify(value));
}

export const loadSession = () => read(SESSION_KEY, null);
export const saveSession = (session) => write(SESSION_KEY, session);

// Codici generati da me come richiedente: [{ requestId, missionId, code, expiresAt }]
export const loadOutgoing = () => read(OUTGOING_KEY, []);
export const saveOutgoing = (list) => write(OUTGOING_KEY, list);

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(OUTGOING_KEY);
}
