import bundled from '../data/missions.json';

// Se VITE_MISSIONS_URL è vuoto, usa il JSON incluso nel build.
const SOURCE_URL = import.meta.env.VITE_MISSIONS_URL;

export async function loadMissionCatalog() {
  if (!SOURCE_URL) return bundled;
  try {
    const res = await fetch(SOURCE_URL, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('Il JSON deve essere una lista di missioni');
    return data;
  } catch (e) {
    console.warn('Catalogo missioni remoto non disponibile, uso quello incluso:', e.message);
    return bundled;
  }
}
