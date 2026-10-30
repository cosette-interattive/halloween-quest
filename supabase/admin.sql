-- Funzioni host: reset gioco, rimozione partecipanti, sincronizzazione missioni.
-- Eseguire una volta nel SQL Editor di Supabase DOPO schema.sql.
-- Sostituire ADMINPW con la password scelta prima di eseguire. Non committare la password.

create table if not exists admin_config (
  id int primary key check (id = 1),
  password_hash text not null
);
alter table admin_config enable row level security;
revoke all on admin_config from anon, authenticated;

insert into admin_config (id, password_hash)
  values (1, extensions.crypt('ADMINPW', extensions.gen_salt('bf')))
  on conflict (id) do update set password_hash = excluded.password_hash;

-- Se rimuovo un validatore, la richiesta resta valida (validator_id diventa null)
alter table requests drop constraint if exists requests_validator_id_fkey;
alter table requests add constraint requests_validator_id_fkey
  foreign key (validator_id) references participants(id) on delete set null;

create or replace function hq_check_admin(p_password text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if not exists (
    select 1 from admin_config where password_hash = extensions.crypt(p_password, password_hash)
  ) then
    raise exception 'PASSWORD_ADMIN_NON_VALIDA';
  end if;
end $$;

create or replace function admin_list_participants(p_password text)
returns json language plpgsql security definer set search_path = public, extensions as $$
begin
  perform hq_check_admin(p_password);
  return (
    select coalesce(json_agg(json_build_object(
        'id', s.participant_id,
        'username', s.username,
        'points', s.points,
        'completed_count', s.completed_count) order by s.points desc, s.username), '[]'::json)
    from scores s
  );
end $$;

create or replace function admin_remove_participant(p_password text, p_id uuid)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  perform hq_check_admin(p_password);
  delete from participants where id = p_id;
  if not found then raise exception 'PARTECIPANTE_NON_TROVATO'; end if;
end $$;

create or replace function admin_reset_game(p_password text)
returns int language plpgsql security definer set search_path = public, extensions as $$
declare
  v_count int;
begin
  perform hq_check_admin(p_password);
  select count(*) into v_count from participants;
  delete from participants where id is not null;
  return v_count;
end $$;

-- Sincronizza missioni e punti dal JSON del catalogo. Le missioni assenti dal JSON vengono disattivate.
create or replace function admin_sync_missions(p_password text, p_missions json)
returns int language plpgsql security definer set search_path = public, extensions as $$
begin
  perform hq_check_admin(p_password);

  insert into missions (id, points, active)
    select m->>'id', (m->>'points')::int, coalesce((m->>'active')::boolean, true)
    from json_array_elements(p_missions) m
  on conflict (id) do update set points = excluded.points, active = excluded.active;

  update missions set active = false
    where id not in (select m->>'id' from json_array_elements(p_missions) m);

  return (select count(*) from missions where active);
end $$;

-- Permessi: solo le funzioni host sono eseguibili dal client, e richiedono la password

revoke execute on function hq_check_admin(text) from public, anon, authenticated;
revoke execute on function admin_list_participants(text) from public, anon, authenticated;
revoke execute on function admin_remove_participant(text, uuid) from public, anon, authenticated;
revoke execute on function admin_reset_game(text) from public, anon, authenticated;
revoke execute on function admin_sync_missions(text, json) from public, anon, authenticated;

grant execute on function admin_list_participants(text) to anon;
grant execute on function admin_remove_participant(text, uuid) to anon;
grant execute on function admin_reset_game(text) to anon;
grant execute on function admin_sync_missions(text, json) to anon;
