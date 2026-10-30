-- Halloween Quest: schema, funzioni e policy. Eseguire una volta nel SQL Editor di Supabase.

create extension if not exists pgcrypto with schema extensions;

-- Tabelle

create table participants (
  id uuid primary key default gen_random_uuid(),
  username text not null check (char_length(username) between 3 and 20),
  token_hash text not null unique,
  failed_code_attempts int not null default 0,
  last_failed_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index participants_username_key on participants (lower(username));

create table missions (
  id text primary key,
  points int not null check (points > 0),
  active boolean not null default true
);

create table requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references participants(id) on delete cascade,
  validator_id uuid references participants(id) on delete cascade,
  mission_id text not null references missions(id),
  request_code_hash text not null,
  completion_code_hash text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'completed')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint requests_no_self check (validator_id is null or validator_id <> requester_id)
);
create unique index requests_one_completed on requests (requester_id, mission_id) where status = 'completed';

create table scores (
  participant_id uuid primary key references participants(id) on delete cascade,
  username text not null,
  points int not null default 0,
  completed_count int not null default 0
);

-- Sicurezza: nessun accesso diretto alle tabelle interne, solo lettura di missioni e classifica

alter table participants enable row level security;
alter table requests enable row level security;
alter table missions enable row level security;
alter table scores enable row level security;

revoke all on participants, requests from anon, authenticated;

create policy missions_read on missions for select to anon using (true);
create policy scores_read on scores for select to anon using (true);

alter publication supabase_realtime add table scores;

-- Helper interno: risolve il partecipante dal token (non esposto)

create or replace function hq_participant(p_token text)
returns participants language plpgsql security definer set search_path = public, extensions as $$
declare
  p participants;
begin
  select * into p from participants where token_hash = encode(digest(upper(btrim(p_token)), 'sha256'), 'hex');
  if not found then raise exception 'SESSIONE_NON_VALIDA'; end if;
  return p;
end $$;

-- Funzioni pubbliche (chiamate dal client con supabase.rpc)

create or replace function register_participant(p_username text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare
  v_name text := btrim(p_username);
  v_token text := upper(encode(gen_random_bytes(6), 'hex'));
  v_id uuid;
begin
  if char_length(v_name) < 3 or char_length(v_name) > 20 then raise exception 'USERNAME_NON_VALIDO'; end if;
  if exists (select 1 from participants where lower(username) = lower(v_name)) then raise exception 'USERNAME_GIA_USATO'; end if;
  insert into participants (username, token_hash)
    values (v_name, encode(digest(v_token, 'sha256'), 'hex'))
    returning id into v_id;
  insert into scores (participant_id, username) values (v_id, v_name);
  return json_build_object('id', v_id, 'username', v_name, 'token', v_token);
end $$;

create or replace function recover_session(p_username text, p_token text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare
  p participants;
begin
  select * into p from participants
    where lower(username) = lower(btrim(p_username))
      and token_hash = encode(digest(upper(btrim(p_token)), 'sha256'), 'hex');
  if not found then raise exception 'CREDENZIALI_NON_VALIDE'; end if;
  return json_build_object('id', p.id, 'username', p.username);
end $$;

create or replace function my_state(p_token text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare
  p participants := hq_participant(p_token);
begin
  return json_build_object(
    'username', p.username,
    'points', (select points from scores where participant_id = p.id),
    'completed_count', (select completed_count from scores where participant_id = p.id),
    'requests', (
      select coalesce(json_agg(json_build_object(
          'id', r.id,
          'mission_id', r.mission_id,
          'status', r.status,
          'role', case when r.requester_id = p.id then 'requester' else 'validator' end,
          'expires_at', r.expires_at) order by r.created_at), '[]'::json)
      from requests r
      where r.requester_id = p.id or r.validator_id = p.id
    )
  );
end $$;

create or replace function create_request(p_token text, p_mission_id text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare
  p participants := hq_participant(p_token);
  v_id uuid := gen_random_uuid();
  v_code text;
  v_expires timestamptz := now() + interval '3 minutes';
begin
  -- Serializza le richieste dello stesso partecipante
  perform 1 from participants where id = p.id for update;

  if not exists (select 1 from missions where id = p_mission_id and active) then
    raise exception 'MISSIONE_NON_VALIDA';
  end if;
  if exists (
    select 1 from requests r
    where r.requester_id = p.id and r.mission_id = p_mission_id
      and (r.status = 'completed' or (r.status in ('pending', 'confirmed') and r.expires_at > now()))
  ) then
    raise exception 'MISSIONE_GIA_IN_CORSO_O_COMPLETATA';
  end if;
  if (select count(*) from requests r
      where r.requester_id = p.id and r.status = 'pending' and r.expires_at > now()) >= 3 then
    raise exception 'TROPPE_RICHIESTE_IN_CORSO';
  end if;

  v_code := lpad(((('x' || encode(gen_random_bytes(4), 'hex'))::bit(32)::int & 2147483647) % 1000000)::text, 6, '0');

  insert into requests (id, requester_id, mission_id, request_code_hash, status, expires_at)
    values (v_id, p.id, p_mission_id, encode(digest(v_id::text || v_code, 'sha256'), 'hex'), 'pending', v_expires);

  return json_build_object('request_id', v_id, 'code', v_code, 'expires_at', v_expires);
end $$;

create or replace function find_request(p_token text, p_code text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare
  p participants := hq_participant(p_token);
  q record;
begin
  if p_code !~ '^[0-9]{6}$' then raise exception 'CODICE_NON_VALIDO'; end if;
  if p.failed_code_attempts >= 5 and p.last_failed_at > now() - interval '5 minutes' then
    raise exception 'TROPPI_TENTATIVI_RIPROVA_PIU_TARDI';
  end if;

  select r.id, r.mission_id, pa.username as requester_name into q
  from requests r join participants pa on pa.id = r.requester_id
  where r.status = 'pending' and r.expires_at > now() and r.requester_id <> p.id
    and r.request_code_hash = encode(digest(r.id::text || p_code, 'sha256'), 'hex');

  if not found then
    update participants
       set failed_code_attempts = case when last_failed_at > now() - interval '5 minutes' then failed_code_attempts + 1 else 1 end,
           last_failed_at = now()
     where id = p.id;
    return json_build_object('ok', false, 'error', 'CODICE_NON_VALIDO_O_SCADUTO');
  end if;

  return json_build_object('ok', true, 'request_id', q.id, 'mission_id', q.mission_id, 'requester', q.requester_name);
end $$;

create or replace function confirm_request(p_token text, p_request_id uuid)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare
  p participants := hq_participant(p_token);
  q requests;
  v_code text;
  v_expires timestamptz := now() + interval '3 minutes';
begin
  select * into q from requests where id = p_request_id for update;
  if not found or q.status <> 'pending' or q.expires_at <= now() then
    raise exception 'RICHIESTA_NON_VALIDA_O_SCADUTA';
  end if;
  if q.requester_id = p.id then raise exception 'AUTOVALIDAZIONE_NON_CONSENTITA'; end if;
  if (select count(*) from requests r
      where r.requester_id = q.requester_id and r.validator_id = p.id
        and r.status in ('confirmed', 'completed')) >= 2 then
    raise exception 'LIMITE_VALIDAZIONI_RAGGIUNTO';
  end if;

  v_code := lpad(((('x' || encode(gen_random_bytes(4), 'hex'))::bit(32)::int & 2147483647) % 1000000)::text, 6, '0');

  update requests
     set validator_id = p.id,
         status = 'confirmed',
         expires_at = v_expires,
         completion_code_hash = encode(digest(p_request_id::text || v_code, 'sha256'), 'hex')
   where id = p_request_id;

  return json_build_object('completion_code', v_code, 'expires_at', v_expires);
end $$;

create or replace function complete_request(p_token text, p_code text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare
  p participants := hq_participant(p_token);
  q record;
begin
  if p_code !~ '^[0-9]{6}$' then raise exception 'CODICE_NON_VALIDO'; end if;
  if p.failed_code_attempts >= 5 and p.last_failed_at > now() - interval '5 minutes' then
    raise exception 'TROPPI_TENTATIVI_RIPROVA_PIU_TARDI';
  end if;

  select r.id, r.mission_id, m.points into q
  from requests r join missions m on m.id = r.mission_id
  where r.requester_id = p.id and r.status = 'confirmed' and r.expires_at > now()
    and r.completion_code_hash = encode(digest(r.id::text || p_code, 'sha256'), 'hex')
  for update of r;

  if not found then
    update participants
       set failed_code_attempts = case when last_failed_at > now() - interval '5 minutes' then failed_code_attempts + 1 else 1 end,
           last_failed_at = now()
     where id = p.id;
    return json_build_object('ok', false, 'error', 'CODICE_NON_VALIDO_O_SCADUTO');
  end if;

  update requests set status = 'completed' where id = q.id;
  update scores
     set points = points + q.points,
         completed_count = completed_count + 1
   where participant_id = p.id;

  return json_build_object('ok', true, 'mission_id', q.mission_id, 'points', q.points);
end $$;

-- Permessi: solo le funzioni pubbliche sono eseguibili dal client

revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function register_participant(text) to anon;
grant execute on function recover_session(text, text) to anon;
grant execute on function my_state(text) to anon;
grant execute on function create_request(text, text) to anon;
grant execute on function find_request(text, text) to anon;
grant execute on function confirm_request(text, uuid) to anon;
grant execute on function complete_request(text, text) to anon;

-- Missioni (punti assegnati lato server). Mantenere allineato con src/data/missions.json

insert into missions (id, points) values
  ('M001', 10), ('M002', 10), ('M003', 15), ('M004', 20), ('M005', 15),
  ('M006', 15), ('M007', 15), ('M008', 15), ('M009', 10), ('M010', 15),
  ('M011', 20), ('M012', 10), ('M013', 20), ('M014', 15), ('M015', 20),
  ('M016', 20), ('M017', 15), ('M018', 20), ('M026', 20), ('M027', 20),
  ('M029', 15), ('M030', 25)
on conflict (id) do update set points = excluded.points;
