-- Tracks which tours were already announced on LINE, so each tour is announced once.
--
-- Existing tours were never announced, so they are marked as announced here:
-- turning alerts on must not blast the whole catalogue at every follower.
-- The backfill only runs when the column is first added, so re-running this file
-- later cannot swallow tours that are still waiting to be announced.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tours' and column_name = 'notified_at'
  ) then
    alter table tours add column notified_at timestamptz;
    update tours set notified_at = now();
  end if;
end $$;

-- The alert job looks for "active and not yet announced"
create index if not exists tours_unnotified_idx on tours(id)
  where notified_at is null and is_active;
