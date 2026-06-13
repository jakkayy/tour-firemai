-- Sources: เว็บทัวร์ที่ scrape มา
create table if not exists sources (
  id         serial primary key,
  name       text not null,
  url        text not null unique,
  created_at timestamptz not null default now()
);

-- Tours: ทัวร์ไฟไหม้ที่ดึงมาจากแต่ละเว็บ
create table if not exists tours (
  id                serial primary key,
  source_id         integer not null references sources(id) on delete cascade,
  title             text not null,
  destination       text,
  original_price    numeric(10, 2),
  discounted_price  numeric(10, 2),
  discount_percent  numeric(5, 2),
  departure_date    date,
  seats_left        integer,
  image_url         text,
  tour_url          text not null,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Index สำหรับ query ที่ใช้บ่อย
create index if not exists tours_departure_date_idx on tours(departure_date);
create index if not exists tours_discount_percent_idx on tours(discount_percent desc);
create index if not exists tours_source_id_idx on tours(source_id);
create index if not exists tours_is_active_idx on tours(is_active);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tours_updated_at
  before update on tours
  for each row execute function update_updated_at();

-- Seed: เว็บทัวร์เป้าหมาย
insert into sources (name, url) values
  ('Thaitravelcenter', 'https://www.thaitravelcenter.com'),
  ('Traveloka',        'https://www.traveloka.com'),
  ('Nidnoi Travel',   'https://www.nidnoitravel.com'),
  ('TravelZeed Fire', 'https://www.travelzeed.com/fire'),
  ('Uni Thai Travel', 'https://www.unithaitravel.com/th/trip2.php'),
  ('Mushroom Travel', 'https://www.mushroomtravel.com/tour/promotion'),
  ('Thai Fly',        'https://thaifly.com/service/hot-deal')
on conflict (url) do nothing;
