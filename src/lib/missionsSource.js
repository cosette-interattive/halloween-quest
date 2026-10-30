import missions10 from '../data/missions-10.json';
import missions20 from '../data/missions-20.json';
import missions40 from '../data/missions-40.json';

const FILES = ['missions-10.json', 'missions-20.json', 'missions-40.json'];
const bundled = [...missions10, ...missions20, ...missions40];

// Se VITE_MISSIONS_URL è vuoto, usa i JSON inclusi nel build.
// Altrimenti è la cartella base da cui leggere i tre file.
const SOURCE_URL = import.meta.env.VITE_MISSIONS_URL;

export async function loadMissionCatalog() {
  if (!SOURCE_URL) return bundled;
  try {
    const base = SOURCE_URL.endsWith('/') ? SOURCE_URL : `${SOURCE_URL}/`;
    const parts = await Promise.all(
      FILES.map(async (file) => {
        const res = await fetch(base + file, { cache: 'no-cache' });
        if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error(`${file} deve contenere una lista di missioni`);
        return data;
      })
    );
    return parts.flat();
  } catch (e) {
    console.warn('Catalogo missioni remoto non disponibile, uso quello incluso:', e.message);
    return bundled;
  }
}
