insert into sources (name, url) values
  ('Navarich Travel', 'https://www.navarichtravel.com/faimai')
on conflict (url) do nothing;
