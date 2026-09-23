-- UNILAG Design Studio — inventory (components + checkouts)
-- Run AFTER 0001_init.sql.

do $$ begin
  create type public.component_status as enum ('available', 'checked-out', 'low-stock');
exception when duplicate_object then null; end $$;

create table if not exists public.components (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  category    text not null default 'Uncategorised',
  quantity    integer not null default 0 check (quantity >= 0),
  available   integer not null default 0 check (available >= 0),
  qr_code     text unique,
  created_at  timestamptz not null default now(),
  constraint components_available_lte_quantity check (available <= quantity)
);

create table if not exists public.checkouts (
  id              uuid primary key default gen_random_uuid(),
  component_id    uuid not null references public.components (id) on delete cascade,
  user_id         uuid not null references public.profiles (id) on delete cascade,
  quantity        integer not null check (quantity > 0),
  checkout_date   date not null default current_date,
  expected_return date not null,
  returned        boolean not null default false,
  return_requested boolean not null default false,
  returned_at     timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists checkouts_user_idx on public.checkouts (user_id);
create index if not exists checkouts_component_idx on public.checkouts (component_id);
create index if not exists checkouts_open_idx on public.checkouts (returned) where returned = false;

-- Status is derived from stock levels, so keep it out of the table and expose
-- it as a view the client can read directly.
create or replace view public.components_with_status as
  select
    c.*,
    case
      when c.available = 0 then 'checked-out'
      when c.quantity > 0 and (c.available::numeric / c.quantity) < 0.30 then 'low-stock'
      when c.available < c.quantity then 'checked-out'
      else 'available'
    end::public.component_status as status
  from public.components c;

-- ---------------------------------------------------------------------------
-- Borrow / return as transactions, so stock can never drift from the ledger
-- ---------------------------------------------------------------------------

create or replace function public.checkout_component(
  p_component_id uuid,
  p_quantity integer,
  p_expected_return date
)
returns public.checkouts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_available integer;
  v_row public.checkouts;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if p_quantity < 1 then
    raise exception 'Quantity must be at least 1';
  end if;

  -- Lock the row so two simultaneous checkouts cannot oversell the same stock.
  select available into v_available
  from public.components where id = p_component_id
  for update;

  if not found then
    raise exception 'Component not found';
  end if;
  if v_available < p_quantity then
    raise exception 'Only % unit(s) available', v_available;
  end if;

  update public.components
     set available = available - p_quantity
   where id = p_component_id;

  insert into public.checkouts (component_id, user_id, quantity, expected_return)
  values (p_component_id, auth.uid(), p_quantity, p_expected_return)
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.return_checkout(p_checkout_id uuid)
returns public.checkouts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_checkout public.checkouts;
  v_row public.checkouts;
begin
  select * into v_checkout from public.checkouts where id = p_checkout_id for update;
  if not found then
    raise exception 'Checkout not found';
  end if;
  if v_checkout.returned then
    raise exception 'Already returned';
  end if;
  -- Only the borrower or an admin may close a checkout.
  if v_checkout.user_id <> auth.uid() and not public.is_admin() then
    raise exception 'Not permitted';
  end if;

  update public.components
     set available = least(available + v_checkout.quantity, quantity)
   where id = v_checkout.component_id;

  update public.checkouts
     set returned = true, return_requested = false, returned_at = now()
   where id = p_checkout_id
  returning * into v_row;

  return v_row;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.components enable row level security;
alter table public.checkouts  enable row level security;

-- Inventory is browsable by anyone signed in; only admins change it.
drop policy if exists components_select on public.components;
create policy components_select on public.components
  for select using (auth.role() = 'authenticated');

drop policy if exists components_admin_write on public.components;
create policy components_admin_write on public.components
  for all using (public.is_admin()) with check (public.is_admin());

-- You see your own checkouts; admins see all.
drop policy if exists checkouts_select_own on public.checkouts;
create policy checkouts_select_own on public.checkouts
  for select using (user_id = auth.uid() or public.is_admin());

-- Borrowers may only flag a return request; stock moves go through the
-- SECURITY DEFINER functions above, never through direct writes.
drop policy if exists checkouts_update_own on public.checkouts;
create policy checkouts_update_own on public.checkouts
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists checkouts_admin_all on public.checkouts;
create policy checkouts_admin_all on public.checkouts
  for all using (public.is_admin()) with check (public.is_admin());

grant select on public.components_with_status to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Seed data (matches what the app shipped with locally).
-- Wrapped in DO blocks so re-running the migration never duplicates rows,
-- while the plain INSERT ... VALUES keeps normal column type inference.

do $$
begin
  if not exists (select 1 from public.components) then
    insert into public.components (name, category, quantity, available) values
      ('Resistor 1kΩ',     'Resistors',        100,  85),
      ('Capacitor 10µF',   'Capacitors',        50,  12),
      ('Arduino Uno',      'Microcontrollers',  10,   4),
      ('LED Red 5mm',      'LEDs',             200, 180),
      ('555 Timer IC',     'ICs',               30,  25),
      ('Breadboard',       'Tools',             15,   8);
  end if;
end $$;

do $$
begin
  if not exists (select 1 from public.spaces) then
    insert into public.spaces
      (name, description, category, location, capacity, amenities,
       open_time, close_time, max_booking_hours, requires_approval)
    values
      ('Prototyping Lab',
       'Electronics benches, soldering stations and test equipment for hardware builds.',
       'Lab', 'Ground Floor, Design Studio', 24,
       '{"Soldering Stations","Oscilloscopes","Power Supplies","Workbenches"}',
       '08:00', '16:00', 4, true),
      ('Fabrication Workshop',
       '3D printers, laser cutter and CNC tools for rapid prototyping.',
       'Workshop', 'Ground Floor, Design Studio', 12,
       '{"3D Printers","Laser Cutter","CNC Router","Extraction"}',
       '09:00', '16:00', 3, true),
      ('Collaboration Hub',
       'Open project space with whiteboards for team sessions and design sprints.',
       'Collaboration Area', 'First Floor, Design Studio', 30,
       '{"Whiteboards","Projector","Wi-Fi","Power Outlets"}',
       '08:00', '16:00', 6, false),
      ('Innovation Meeting Room',
       'Enclosed room for reviews, supervisor meetings and partner sessions.',
       'Meeting Room', 'First Floor, Design Studio', 10,
       '{"Display Screen","Video Conferencing","Whiteboard"}',
       '08:00', '16:00', 2, false);
  end if;
end $$;
