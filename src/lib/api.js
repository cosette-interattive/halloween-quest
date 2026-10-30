import { supabase } from './supabase.js';

const MESSAGES = {
  USERNAME_NON_VALIDO: 'Lo username deve avere tra 3 e 20 caratteri.',
  USERNAME_GIA_USATO: 'Questo username è già in uso. Scegline un altro.',
  CREDENZIALI_NON_VALIDE: 'Username o codice di recupero non corretti.',
  SESSIONE_NON_VALIDA: 'Sessione non valida. Entra di nuovo.',
  MISSIONE_NON_VALIDA: 'Questa missione non è disponibile.',
  MISSIONE_GIA_IN_CORSO_O_COMPLETATA: 'Hai già questa missione in corso o completata.',
  TROPPE_RICHIESTE_IN_CORSO: 'Hai già 3 richieste in corso. Completane una prima.',
  RICHIESTA_NON_VALIDA_O_SCADUTA: 'Richiesta non più valida o scaduta.',
  AUTOVALIDAZIONE_NON_CONSENTITA: 'Non puoi validare una tua missione.',
  LIMITE_VALIDAZIONI_RAGGIUNTO: 'Hai già validato 2 missioni di questa persona.',
  TROPPI_TENTATIVI_RIPROVA_PIU_TARDI: 'Troppi tentativi. Riprova tra 5 minuti.',
  CODICE_NON_VALIDO: 'Inserisci un codice di 6 cifre.',
  CODICE_NON_VALIDO_O_SCADUTO: 'Codice non valido o scaduto.',
  PASSWORD_ADMIN_NON_VALIDA: 'Password host non corretta.',
  PARTECIPANTE_NON_TROVATO: 'Partecipante non trovato.',
};

export class AppError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function toError(message) {
  const code = (message || '').trim();
  return new AppError(code, MESSAGES[code] || 'Connessione assente o errore del server. Riprova.');
}

async function call(fn, params) {
  if (!supabase) throw new AppError('CONFIG', 'Applicazione non configurata.');
  const { data, error } = await supabase.rpc(fn, params);
  if (error) {
    console.error(`[rpc ${fn}]`, error);
    throw toError(error.message);
  }
  return data;
}

// Le funzioni che restituiscono { ok: false } vengono convertite in errore.
function unwrap(data) {
  if (data && data.ok === false) throw toError(data.error);
  return data;
}

export const api = {
  register: (username) => call('register_participant', { p_username: username }),
  recover: (username, token) => call('recover_session', { p_username: username, p_token: token }),
  myState: (token) => call('my_state', { p_token: token }),
  createRequest: (token, missionId) => call('create_request', { p_token: token, p_mission_id: missionId }),
  findRequest: async (token, code) => unwrap(await call('find_request', { p_token: token, p_code: code })),
  confirmRequest: (token, requestId) => call('confirm_request', { p_token: token, p_request_id: requestId }),
  adminList: (password) => call('admin_list_participants', { p_password: password }),
  adminRemove: (password, id) => call('admin_remove_participant', { p_password: password, p_id: id }),
  adminReset: (password) => call('admin_reset_game', { p_password: password }),
  adminSyncMissions: (password, missions) => call('admin_sync_missions', { p_password: password, p_missions: missions }),
  leaderboard: async () => {
    if (!supabase) throw new AppError('CONFIG', 'Applicazione non configurata.');
    const { data, error } = await supabase
      .from('scores')
      .select('username, points, completed_count')
      .order('points', { ascending: false })
      .limit(400);
    if (error) throw toError(error.message);
    return data;
  },
};
