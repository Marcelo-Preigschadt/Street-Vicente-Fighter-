-- Separate cooperative campaign seats from versus, and exclude incompatible clients.
-- Existing token-based ownership, RLS and heartbeat remain in place.
alter table public.svf_rooms
  add column if not exists game_mode text not null default 'versus'
    check (game_mode in ('versus','story')),
  add column if not exists protocol text not null default 'svf-online-3-6-2'
    check (length(protocol) between 1 and 64);
notify pgrst, 'reload schema';
