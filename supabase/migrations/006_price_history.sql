-- Price history: one row each time a tour's price is first seen or changes
create table if not exists price_history (
  id               bigserial primary key,
  tour_id          integer not null references tours(id) on delete cascade,
  discounted_price numeric(10, 2),
  original_price   numeric(10, 2),
  recorded_at      timestamptz not null default now()
);

create index if not exists price_history_tour_id_recorded_at_idx
  on price_history(tour_id, recorded_at);

-- Record on insert, and on update only when the price actually changed.
-- The scraper upserts every run, so unchanged prices must not add rows.
create or replace function record_price_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT'
     or new.discounted_price is distinct from old.discounted_price
     or new.original_price is distinct from old.original_price then
    insert into price_history (tour_id, discounted_price, original_price)
    values (new.id, new.discounted_price, new.original_price);
  end if;
  return new;
end;
$$;

create trigger tours_price_history
  after insert or update of discounted_price, original_price on tours
  for each row execute function record_price_history();

-- Backfill: tours that already exist get their current price as the first point
insert into price_history (tour_id, discounted_price, original_price)
select t.id, t.discounted_price, t.original_price
from tours t
where not exists (select 1 from price_history h where h.tour_id = t.id);

-- Same access model as 005: public read, writes only via service role / trigger
alter table price_history enable row level security;

do $$ begin
  create policy "public read price_history"
    on price_history for select to anon using (true);
exception when duplicate_object then null;
end $$;

grant select on price_history to anon;
