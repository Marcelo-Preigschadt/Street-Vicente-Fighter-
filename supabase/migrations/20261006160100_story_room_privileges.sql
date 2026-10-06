-- Public room clients can read and create the new non-sensitive matchmaking metadata.
-- Do not grant SELECT on owner_hash or table-wide privileges.
grant select (game_mode, protocol), insert (game_mode, protocol)
  on public.svf_rooms to anon;
notify pgrst, 'reload schema';
