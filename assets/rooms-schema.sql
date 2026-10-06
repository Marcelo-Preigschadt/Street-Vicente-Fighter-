create table public.svf_rooms (
 code text primary key check (code ~ '^[A-HJ-NP-Z2-9]{8}$'),
 owner_hash text not null check (owner_hash ~ '^[a-f0-9]{64}$'),
 status text not null default 'waiting' check (status in ('waiting','playing')),
 character text not null check (character in ('marcelo','rafael','gustavo','gelton','marcelino','marcos','joao','ruan')),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default now() + interval '3 minutes'
);
alter table public.svf_rooms enable row level security;
revoke all on public.svf_rooms from anon, authenticated;
grant select(code,status,character,created_at,expires_at) on public.svf_rooms to anon;
grant insert(code,owner_hash,status,character) on public.svf_rooms to anon;
grant update(status,character) on public.svf_rooms to anon;
grant delete on public.svf_rooms to anon;
create function public.svf_room_owner_hash() returns text language sql stable security invoker set search_path = '' as $$
 select case when length(coalesce(nullif(current_setting('request.headers',true),'')::json->>'x-room-token','')) >= 64
 then encode(sha256(convert_to(nullif(current_setting('request.headers',true),'')::json->>'x-room-token','UTF8')),'hex') else null end
$$;
revoke all on function public.svf_room_owner_hash() from public;
grant execute on function public.svf_room_owner_hash() to anon;
create policy rooms_read on public.svf_rooms for select to anon using (expires_at > now());
create policy rooms_create on public.svf_rooms for insert to anon with check (owner_hash = (select public.svf_room_owner_hash()));
create policy rooms_update on public.svf_rooms for update to anon using (owner_hash = (select public.svf_room_owner_hash())) with check (owner_hash = (select public.svf_room_owner_hash()));
create policy rooms_delete on public.svf_rooms for delete to anon using (owner_hash = (select public.svf_room_owner_hash()));
create function public.svf_room_heartbeat() returns trigger language plpgsql security invoker set search_path = '' as $$
 begin new.expires_at := now() + interval '3 minutes'; return new; end
$$;
revoke all on function public.svf_room_heartbeat() from public;
create trigger svf_room_heartbeat before insert or update on public.svf_rooms for each row execute function public.svf_room_heartbeat();
create index svf_rooms_expires_idx on public.svf_rooms (expires_at);
