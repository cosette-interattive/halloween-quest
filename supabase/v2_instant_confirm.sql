-- Conferma istantanea: la validazione di B completa subito la missione di A, senza codice di completamento.
-- Eseguire nel SQL Editor di Supabase dopo schema.sql e admin.sql.

drop function if exists complete_request(text, text);

create or replace function confirm_request(p_token text, p_request_id uuid)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare
  p participants := hq_participant(p_token);
  q requests;
  v_points int;
  v_requester text;
begin
  select * into q from requests where id = p_request_id for update;
  if not found or q.status <> 'pending' or q.expires_at <= now() then
    raise exception 'RICHIESTA_NON_VALIDA_O_SCADUTA';
  end if;
  if q.requester_id = p.id then raise exception 'AUTOVALIDAZIONE_NON_CONSENTITA'; end if;
  if exists (
    select 1 from requests r
    where r.requester_id = q.requester_id and r.mission_id = q.mission_id and r.status = 'completed'
  ) then
    raise exception 'MISSIONE_GIA_IN_CORSO_O_COMPLETATA';
  end if;
  if (select count(*) from requests r
      where r.requester_id = q.requester_id and r.validator_id = p.id
        and r.status = 'completed') >= 2 then
    raise exception 'LIMITE_VALIDAZIONI_RAGGIUNTO';
  end if;

  select points into v_points from missions where id = q.mission_id;
  select username into v_requester from participants where id = q.requester_id;

  update requests set validator_id = p.id, status = 'completed' where id = p_request_id;
  update scores
     set points = points + v_points,
         completed_count = completed_count + 1
   where participant_id = q.requester_id;

  return json_build_object('mission_id', q.mission_id, 'points', v_points, 'requester', v_requester);
end $$;
