-- UNILAG Design Studio — guest-by-default signup + role-change protection
-- Run AFTER 0002_inventory.sql. Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. New signups land as 'guest' (previously 'intern')
-- ---------------------------------------------------------------------------

alter table public.profiles alter column role set default 'guest';

-- Set the role explicitly as well as relying on the column default, so the
-- intent survives someone changing one without the other.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name, email, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    new.email,
    new.raw_user_meta_data ->> 'phone',
    'guest'
  );
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Only a super admin may change anyone's role
-- ---------------------------------------------------------------------------

create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role() = 'superadmin', false);
$$;

/*
  RLS alone cannot express "you may edit your row, but not this column".
  profiles_update_self permits a user to update their own row, which without
  this guard would let any signed-in user PATCH their own role to superadmin
  straight through the REST API. A BEFORE UPDATE trigger closes that off for
  every write path — REST, RPC or SQL — regardless of policy.
*/
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_superadmin() then
    raise exception 'Only a super admin can change a role';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- Writing to other people's profiles is super-admin only. Plain admins keep
-- read access (via profiles_select_self) for the name lookups their panels do.
drop policy if exists profiles_admin_all on public.profiles;
drop policy if exists profiles_superadmin_all on public.profiles;
create policy profiles_superadmin_all on public.profiles
  for all using (public.is_superadmin()) with check (public.is_superadmin());

-- ---------------------------------------------------------------------------
-- 3. Guests may browse, but not borrow or book
-- ---------------------------------------------------------------------------

create or replace function public.can_transact()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role() in ('intern', 'admin', 'superadmin'), false);
$$;

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
  if not public.can_transact() then
    raise exception 'Your account is pending approval and cannot borrow equipment yet';
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

-- Booking requires the same standing as borrowing.
drop policy if exists bookings_insert_own on public.bookings;
create policy bookings_insert_own on public.bookings
  for insert with check (user_id = auth.uid() and public.can_transact());
