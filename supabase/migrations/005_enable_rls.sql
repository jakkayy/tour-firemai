-- Enable RLS on both tables (idempotent)
alter table tours   enable row level security;
alter table sources enable row level security;

-- Public SELECT policy — skip if already exists
do $$ begin
  create policy "public read tours"
    on tours for select to anon using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "public read sources"
    on sources for select to anon using (true);
exception when duplicate_object then null;
end $$;

-- Service role (scraper) bypasses RLS automatically — no policy needed
