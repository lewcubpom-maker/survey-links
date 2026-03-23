-- =====================================================
-- รัน SQL นี้ใน Supabase → SQL Editor → New query
-- =====================================================

-- 1. ตาราง links (แทน Sheet1)
create table if not exists links (
  id      serial primary key,
  name    text not null default '',
  link    text not null default '',
  status  text not null default ''
);

-- 2. ตาราง config (แทน Config sheet)
create table if not exists config (
  key    text primary key,
  value  text not null default ''
);

-- 3. ใส่ค่า SYSTEM เริ่มต้น
insert into config (key, value)
values ('SYSTEM', 'ON')
on conflict (key) do nothing;

-- 4. เปิด Row Level Security (RLS)
--    ให้ anon key อ่านได้ แต่เขียนได้ผ่าน API routes เท่านั้น
alter table links  enable row level security;
alter table config enable row level security;

-- อ่านได้ทุกคน (anon)
create policy "read links"  on links  for select using (true);
create policy "read config" on config for select using (true);

-- เขียนได้เฉพาะ service_role (API routes ใช้ anon key ก็ได้ในตอนนี้)
create policy "update links" on links for update using (true);
