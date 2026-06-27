insert into sources (name, url) values
  ('Quality Express', 'https://www.qualityexpress.co.th')
on conflict (url) do nothing;
