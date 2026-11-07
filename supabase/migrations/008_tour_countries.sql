-- The countries each tour visits, so the site can filter on them. The scraper fills this in from the
-- title on every run (see scraper/countries.py); this migration only gets existing rows started.
alter table tours add column if not exists countries text[] not null default '{}';

-- "has any of these countries" filters use the overlap operator, which a GIN index serves
create index if not exists tours_countries_idx on tours using gin (countries);

-- Some sites store a tone mark before the vowel sign it sits on (ป ่ ุ instead of ป ุ ่). It looks the
-- same on screen but never matches a search for "ญี่ปุ่น". Put the vowel sign first, as in normal
-- Thai; the scraper does the same for everything it saves from now on. Safe to run again.
update tours
set title = regexp_replace(title, '([\u0E48-\u0E4B])([\u0E31\u0E34-\u0E3A\u0E47])', '\2\1', 'g')
where title ~ '[\u0E48-\u0E4B][\u0E31\u0E34-\u0E3A\u0E47]';

-- Starting point for tours that already exist: every country name found in the title, in the order the
-- title mentions them. The next scrape replaces this with the fuller detection (city names, English
-- spellings, the Europe region), so a few tours gain countries then.
update tours
set countries = coalesce(
  (
    select array_agg(c order by position(c in cleaned))
    from (select replace(replace(tours.title, 'สถาปัตยกรรมยุโรป', ' '), 'ฟิลยุโรป', ' ') as cleaned) t,
         unnest(array['จีน', 'ญี่ปุ่น', 'เกาหลี', 'ไต้หวัน', 'เวียดนาม', 'สิงคโปร์', 'มาเลเซีย', 'ฮ่องกง', 'พม่า', 'กัมพูชา', 'อินโดนีเซีย', 'ฟิลิปปินส์', 'อินเดีย', 'ยุโรป', 'อังกฤษ', 'ฝรั่งเศส', 'อิตาลี', 'สวิตเซอร์แลนด์', 'ตุรกี', 'ออสเตรเลีย', 'นิวซีแลนด์', 'รัสเซีย', 'อียิปต์', 'จอร์เจีย', 'คาซัคสถาน', 'คีร์กีซสถาน', 'มองโกเลีย', 'จอร์แดน', 'โมร็อกโก', 'เนเธอร์แลนด์', 'เบลเยียม', 'เยอรมนี', 'ออสเตรีย', 'สเปน', 'โปแลนด์', 'ไอซ์แลนด์', 'เดนมาร์ก', 'นอร์เวย์', 'สวีเดน', 'ฟินแลนด์', 'กรีซ', 'โปรตุเกส', 'ฮังการี', 'เนปาล', 'ภูฏาน', 'ศรีลังกา', 'มัลดีฟส์']) as c
    where position(c in cleaned) > 0
  ),
  '{}'
)
where countries = '{}';
