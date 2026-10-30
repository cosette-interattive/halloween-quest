-- Assegna a ogni partecipante 10 missioni casuali (4 da 10 pt, 2 da 20 pt, 2 da 40 pt).
-- Eseguire nel SQL Editor di Supabase dopo schema.sql, admin.sql e v2_instant_confirm.sql.

create table if not exists assignments (
  participant_id uuid not null references participants(id) on delete cascade,
  mission_id text not null references missions(id),
  primary key (participant_id, mission_id)
);
alter table assignments enable row level security;
revoke all on assignments from anon, authenticated;

create or replace function my_missions(p_token text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare
  p participants := hq_participant(p_token);
begin
  perform pg_advisory_xact_lock(hashtext(p.id::text));
  if not exists (select 1 from assignments where participant_id = p.id) then
    insert into assignments (participant_id, mission_id)
    select p.id, picked.id from (
      (select id from missions where active and points = 10 order by random() limit 4)
      union all
      (select id from missions where active and points = 20 order by random() limit 2)
      union all
      (select id from missions where active and points = 40 order by random() limit 2)
    ) picked;
  end if;
  return (
    select coalesce(json_agg(mission_id order by mission_id), '[]'::json)
    from assignments where participant_id = p.id
  );
end $$;

revoke execute on function my_missions(text) from public, anon, authenticated;
grant execute on function my_missions(text) to anon;
