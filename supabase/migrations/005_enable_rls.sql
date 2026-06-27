-- Enable RLS on both tables
alter table tours   enable row level security;
alter table sources enable row level security;

-- Public can only SELECT (anon key used by frontend)
create policy "public read tours"
  on tours for select
  to anon
  using (true);

create policy "public read sources"
  on sources for select
  to anon
  using (true);

-- Service role (scraper) bypasses RLS automatically — no policy needed
