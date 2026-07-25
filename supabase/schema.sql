-- ============================================================
-- HAYK Loyalty Club — Supabase schema
-- Run this once in Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1) customers table -------------------------------------------------
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  drink_count int not null default 0,          -- progress toward the next free drink (resets after DRINKS_FOR_FREE)
  total_drinks int not null default 0,          -- lifetime drinks (for stats)
  free_drinks_redeemed int not null default 0,  -- how many free drinks they've received
  created_at timestamptz not null default now()
);

create index if not exists customers_phone_idx on customers (phone);

-- 2) app_settings table (staff password + admin credentials) --------
create table if not exists app_settings (
  key text primary key,
  value text not null
);

insert into app_settings (key, value) values
  ('staff_password', 'staff123'),
  ('admin_username', 'admin'),
  ('admin_password', 'admin123')
on conflict (key) do nothing;

-- 3) Row Level Security ----------------------------------------------
-- The site has no real per-user auth — access to the staff / admin
-- areas is gated in the app UI by the values in app_settings.
-- We allow the public "anon" key to read/write both tables so the
-- static site (hosted on Vercel) can talk to Supabase directly.
--
-- NOTE / caveat: because RLS is fully open here, anyone with your
-- anon key (visible in your site's JS) could in theory call the
-- Supabase REST API directly and bypass the staff/admin password
-- screens. For a small coffee shop MVP this is a reasonable
-- trade-off, but if you want stronger protection later, replace
-- this with Supabase Auth + policies scoped to authenticated roles.

alter table customers enable row level security;
alter table app_settings enable row level security;

drop policy if exists "public read customers" on customers;
create policy "public read customers" on customers
  for select using (true);

drop policy if exists "public insert customers" on customers;
create policy "public insert customers" on customers
  for insert with check (true);

drop policy if exists "public update customers" on customers;
create policy "public update customers" on customers
  for update using (true);

drop policy if exists "public delete customers" on customers;
create policy "public delete customers" on customers
  for delete using (true);

drop policy if exists "public read settings" on app_settings;
create policy "public read settings" on app_settings
  for select using (true);

drop policy if exists "public update settings" on app_settings;
create policy "public update settings" on app_settings
  for update using (true);
