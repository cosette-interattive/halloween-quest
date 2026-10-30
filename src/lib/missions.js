let catalog = [];

export function setMissionCatalog(list) {
  catalog = list;
}

export const getActiveMissions = () => catalog.filter((m) => m.active);
export const getMission = (id) => catalog.find((m) => m.id === id);

export const CATEGORY_LABEL = {
  icebreaker: 'Rompighiaccio',
  social: 'Social',
  group: 'Gruppo',
  funny: 'Divertente',
  photo: 'Foto',
  special: 'Speciale',
};

// Raggruppa le missioni in base allo stato del partecipante.
export function summarize(state, now = Date.now()) {
  const result = { available: [], inProgress: [], completed: [], expired: [] };
  const latestByMission = new Map();

  // my_state restituisce le richieste in ordine cronologico: l'ultima vince.
  for (const r of state?.requests ?? []) {
    if (r.role === 'requester') latestByMission.set(r.mission_id, r);
  }

  for (const m of getActiveMissions()) {
    const r = latestByMission.get(m.id);
    if (!r) {
      result.available.push(m);
    } else if (r.status === 'completed') {
      result.completed.push(m);
    } else if (new Date(r.expires_at).getTime() > now) {
      result.inProgress.push({ request: r, mission: m });
    } else {
      result.expired.push({ request: r, mission: m });
    }
  }
  return result;
}
