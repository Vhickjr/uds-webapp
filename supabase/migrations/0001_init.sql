-- UNILAG Design Studio — initial schema
-- Run in the Supabase SQL editor, or via `supabase db push`.

-- ---------------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.user_role as enum ('superadmin', 'admin', 'intern', 'guest');
exception when duplicate_object then null; end $$;

-- Mirrors auth.users with the app-level profile fields.
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  first_name  text not null default '',
  last_name   text not null default '',
  email       text not null,
  phone       text,
  role        public.user_role not null default 'intern',
  created_at  timestamptz not null default now()
);

-- Reads the caller's role without re-entering RLS on profiles (avoids recursion).
create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role() in ('admin', 'superadmin'), false);
$$;

-- New signups land as 'intern'. Elevating a role is a deliberate DB action.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    new.email,
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Spaces + bookings
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.booking_status as enum ('pending', 'approved', 'rejected', 'cancelled');
exception when duplicate_object then null; end $$;

create table if not exists public.spaces (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  description        text not null default '',
  category           text not null default 'Lab',
  location           text not null default '',
  capacity           integer not null default 1 check (capacity > 0),
  amenities          text[] not null default '{}',
  open_time          time not null default '08:00',
  close_time         time not null default '16:00',
  open_days          smallint[] not null default '{1,2,3,4,5}',
  max_booking_hours  integer not null default 4 check (max_booking_hours > 0),
  requires_approval  boolean not null default true,
  active             boolean not null default true,
  created_at         timestamptz not null default now(),
  constraint spaces_hours_valid check (close_time > open_time)
);

create table if not exists public.bookings (
  id            uuid primary key default gen_random_uuid(),
  space_id      uuid not null references public.spaces (id) on delete cascade,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  date          date not null,
  start_time    time not null,
  end_time      time not null,
  purpose       text not null default '',
  attendees     integer not null default 1 check (attendees > 0),
  status        public.booking_status not null default 'pending',
  decided_by    uuid references public.profiles (id),
  decision_note text,
  created_at    timestamptz not null default now(),
  constraint bookings_time_valid check (end_time > start_time)
);

create index if not exists bookings_space_date_idx on public.bookings (space_id, date);
create index if not exists bookings_user_idx on public.bookings (user_id);

-- Enforce no double-booking in the database, not just in the UI.
-- Only pending/approved rows hold a slot, so cancelled/rejected are excluded.
create extension if not exists btree_gist;

alter table public.bookings drop constraint if exists bookings_no_overlap;
alter table public.bookings
  add constraint bookings_no_overlap
  exclude using gist (
    space_id with =,
    date with =,
    tsrange(('2000-01-01'::date + start_time), ('2000-01-01'::date + end_time)) with &&
  )
  where (status in ('pending', 'approved'));

-- ---------------------------------------------------------------------------
-- Website CMS
-- ---------------------------------------------------------------------------

-- One row per website section; `data` holds that section's editable payload.
create table if not exists public.site_content (
  section     text primary key,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.profiles (id)
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists site_content_touch on public.site_content;
create trigger site_content_touch
  before update on public.site_content
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles     enable row level security;
alter table public.spaces       enable row level security;
alter table public.bookings     enable row level security;
alter table public.site_content enable row level security;

-- Profiles: you see yourself; admins see everyone. Only admins change roles.
drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- Spaces: anyone signed in can browse; only admins manage them.
drop policy if exists spaces_select on public.spaces;
create policy spaces_select on public.spaces
  for select using (auth.role() = 'authenticated');

drop policy if exists spaces_admin_write on public.spaces;
create policy spaces_admin_write on public.spaces
  for all using (public.is_admin()) with check (public.is_admin());

-- Bookings: you see and create your own; admins see and decide on all.
drop policy if exists bookings_select_own on public.bookings;
create policy bookings_select_own on public.bookings
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists bookings_insert_own on public.bookings;
create policy bookings_insert_own on public.bookings
  for insert with check (user_id = auth.uid());

drop policy if exists bookings_update_own on public.bookings;
create policy bookings_update_own on public.bookings
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists bookings_admin_all on public.bookings;
create policy bookings_admin_all on public.bookings
  for all using (public.is_admin()) with check (public.is_admin());

-- Site content: world-readable (it is the public website); admins write.
drop policy if exists site_content_public_read on public.site_content;
create policy site_content_public_read on public.site_content
  for select using (true);

drop policy if exists site_content_admin_write on public.site_content;
create policy site_content_admin_write on public.site_content
  for all using (public.is_admin()) with check (public.is_admin());
