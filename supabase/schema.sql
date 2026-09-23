-- CotizaRapido: esquema inicial para Supabase/PostgreSQL
-- Ejecutar completo en Supabase SQL Editor.
-- No expone claves ni depende de Stripe: la monetizacion se registra por anuncios.

create extension if not exists pgcrypto;

do $$
begin
  create type public.member_role as enum ('owner', 'admin', 'advisor');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.quote_status as enum ('draft', 'sent', 'viewed', 'approved', 'rejected', 'expired');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.ad_event_type as enum ('impression', 'click', 'conversion');
exception
  when duplicate_object then null;
end $$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Administradores de toda la plataforma, separados de los usuarios de un taller.
create table public.platform_admins (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  admin_email text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Solo guarda la identidad y el estado de OAuth. Los tokens se deben manejar en
-- una Edge Function o en Supabase Vault, nunca en el navegador.
create table public.gmail_connections (
  id uuid primary key default gen_random_uuid(),
  platform_admin_id uuid not null references public.platform_admins(profile_id) on delete cascade,
  gmail_email text not null,
  google_account_id text,
  scopes text[] not null default '{}',
  status text not null default 'connected' check (status in ('connected', 'expired', 'revoked')),
  token_expires_at timestamptz,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (platform_admin_id, gmail_email)
);

create table public.workshops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  name text not null,
  city text,
  country_code char(2) not null default 'CO',
  currency char(3) not null default 'COP',
  whatsapp_number text,
  tax_rate numeric(5,2) not null default 0 check (tax_rate >= 0 and tax_rate <= 100),
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workshop_members (
  workshop_id uuid not null references public.workshops(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.member_role not null default 'advisor',
  created_at timestamptz not null default now(),
  primary key (workshop_id, profile_id)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops(id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  brand text,
  model text,
  model_year smallint check (model_year between 1886 and 2200),
  plate text,
  mileage integer check (mileage is null or mileage >= 0),
  created_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops(id) on delete cascade,
  name text not null,
  category text,
  description text,
  default_price numeric(12,2) not null default 0 check (default_price >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workshop_id, name)
);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  quote_number text not null,
  status public.quote_status not null default 'draft',
  client_budget_min numeric(12,2) check (client_budget_min is null or client_budget_min >= 0),
  client_budget_max numeric(12,2) check (client_budget_max is null or client_budget_max >= 0),
  client_budget_notes text,
  currency char(3) not null default 'COP',
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  discount numeric(12,2) not null default 0 check (discount >= 0),
  tax numeric(12,2) not null default 0 check (tax >= 0),
  total numeric(12,2) not null default 0 check (total >= 0),
  public_token text not null unique default encode(gen_random_bytes(16), 'hex'),
  expires_at timestamptz,
  sent_at timestamptz,
  viewed_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workshop_id, quote_number),
  check (client_budget_min is null or client_budget_max is null or client_budget_min <= client_budget_max)
);

create table public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  description text not null,
  quantity numeric(10,2) not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  total numeric(12,2) generated always as (quantity * unit_price) stored
);

-- Publicaciones anonimizadas para el feed: nunca guardan el nombre del cliente.
create table public.community_feed_posts (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops(id) on delete cascade,
  quote_id uuid unique references public.quotes(id) on delete cascade,
  vehicle_label text not null,
  quote_status public.quote_status not null,
  total numeric(12,2) not null default 0 check (total >= 0),
  visible boolean not null default true,
  created_at timestamptz not null default now()
);

-- Campanas/espacios publicitarios aprobados para monetizar la plataforma.
create table public.ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  advertiser_name text not null,
  title text not null,
  creative_url text,
  target_url text,
  active boolean not null default true,
  payout_per_impression numeric(12,4) not null default 0 check (payout_per_impression >= 0),
  payout_per_click numeric(12,4) not null default 0 check (payout_per_click >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.ad_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.ad_campaigns(id) on delete cascade,
  workshop_id uuid references public.workshops(id) on delete set null,
  event_type public.ad_event_type not null,
  payout_amount numeric(12,4) not null default 0 check (payout_amount >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index customers_workshop_idx on public.customers(workshop_id);
create index vehicles_customer_idx on public.vehicles(customer_id);
create index services_workshop_active_idx on public.services(workshop_id, active);
create index quotes_workshop_status_idx on public.quotes(workshop_id, status);
create index quotes_created_at_idx on public.quotes(created_at desc);
create index quote_items_quote_idx on public.quote_items(quote_id);
create index community_feed_visible_idx on public.community_feed_posts(visible, created_at desc);
create index ad_events_campaign_idx on public.ad_events(campaign_id, created_at desc);
create index ad_events_workshop_idx on public.ad_events(workshop_id, created_at desc);
create index gmail_connections_admin_idx on public.gmail_connections(platform_admin_id);

create or replace function public.is_workshop_member(target_workshop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workshops
    where id = target_workshop_id and owner_id = auth.uid()
    union all
    select 1 from public.workshop_members
    where workshop_id = target_workshop_id and profile_id = auth.uid()
  );
$$;

create or replace function public.is_workshop_manager(target_workshop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workshops
    where id = target_workshop_id and owner_id = auth.uid()
    union all
    select 1 from public.workshop_members
    where workshop_id = target_workshop_id
      and profile_id = auth.uid()
      and role in ('owner', 'admin')
  );
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_admins
    where profile_id = auth.uid()
      and active = true
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.platform_admins enable row level security;
alter table public.gmail_connections enable row level security;
alter table public.workshops enable row level security;
alter table public.workshop_members enable row level security;
alter table public.customers enable row level security;
alter table public.vehicles enable row level security;
alter table public.services enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.community_feed_posts enable row level security;
alter table public.ad_campaigns enable row level security;
alter table public.ad_events enable row level security;

create policy "Users manage their own profile"
on public.profiles for all
using (id = auth.uid())
with check (id = auth.uid());

create policy "Platform admins can view profiles"
on public.profiles for select
using (public.is_platform_admin());

create policy "Admins can view their platform role"
on public.platform_admins for select
using (profile_id = auth.uid() or public.is_platform_admin());

create policy "Admins manage their Gmail connections"
on public.gmail_connections for all
using (platform_admin_id = auth.uid() and public.is_platform_admin())
with check (platform_admin_id = auth.uid() and public.is_platform_admin());

create policy "Members can view workshops"
on public.workshops for select
using (public.is_workshop_member(id) or owner_id = auth.uid());

create policy "Owners manage workshops"
on public.workshops for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Platform admins can view workshops"
on public.workshops for select
using (public.is_platform_admin());

create policy "Members can view membership"
on public.workshop_members for select
using (profile_id = auth.uid() or public.is_workshop_member(workshop_id));

create policy "Owners manage membership"
on public.workshop_members for all
using (exists (select 1 from public.workshops where id = workshop_id and owner_id = auth.uid()))
with check (exists (select 1 from public.workshops where id = workshop_id and owner_id = auth.uid()));

drop policy if exists "Members manage customers" on public.customers;
create policy "Members view customers"
on public.customers for select
using (public.is_workshop_member(workshop_id));
create policy "Managers manage customers"
on public.customers for insert
with check (public.is_workshop_manager(workshop_id));
create policy "Managers update customers"
on public.customers for update
using (public.is_workshop_manager(workshop_id))
with check (public.is_workshop_manager(workshop_id));
create policy "Managers delete customers"
on public.customers for delete
using (public.is_workshop_manager(workshop_id));

create policy "Platform admins can view customers"
on public.customers for select
using (public.is_platform_admin());

drop policy if exists "Members manage vehicles" on public.vehicles;
create policy "Members view vehicles"
on public.vehicles for select
using (exists (select 1 from public.customers c where c.id = customer_id and public.is_workshop_member(c.workshop_id)));
create policy "Managers manage vehicles"
on public.vehicles for all
using (exists (select 1 from public.customers c where c.id = customer_id and public.is_workshop_manager(c.workshop_id)))
with check (exists (select 1 from public.customers c where c.id = customer_id and public.is_workshop_manager(c.workshop_id)));

drop policy if exists "Members manage services" on public.services;
create policy "Members view services"
on public.services for select
using (public.is_workshop_member(workshop_id));
create policy "Managers manage services"
on public.services for all
using (public.is_workshop_manager(workshop_id))
with check (public.is_workshop_manager(workshop_id));

create policy "Members create quotes"
on public.quotes for insert
with check (public.is_workshop_member(workshop_id));
create policy "Members update quotes"
on public.quotes for update
using (public.is_workshop_member(workshop_id))
with check (public.is_workshop_member(workshop_id));
create policy "Managers delete quotes"
on public.quotes for delete
using (public.is_workshop_manager(workshop_id));

create policy "Platform admins can view quotes"
on public.quotes for select
using (public.is_platform_admin());

create policy "Members view quote items"
on public.quote_items for select
using (exists (select 1 from public.quotes q where q.id = quote_id and public.is_workshop_member(q.workshop_id)));
create policy "Members create quote items"
on public.quote_items for insert
with check (exists (select 1 from public.quotes q where q.id = quote_id and public.is_workshop_member(q.workshop_id)));
create policy "Members update quote items"
on public.quote_items for update
using (exists (select 1 from public.quotes q where q.id = quote_id and public.is_workshop_member(q.workshop_id)))
with check (exists (select 1 from public.quotes q where q.id = quote_id and public.is_workshop_member(q.workshop_id)));
create policy "Managers delete quote items"
on public.quote_items for delete
using (exists (select 1 from public.quotes q where q.id = quote_id and public.is_workshop_manager(q.workshop_id)));

create policy "Authenticated users view visible feed"
on public.community_feed_posts for select
to authenticated
using (visible = true or public.is_workshop_member(workshop_id));

create policy "Members create feed posts"
on public.community_feed_posts for insert
to authenticated
with check (public.is_workshop_member(workshop_id));

create policy "Managers manage feed posts"
on public.community_feed_posts for update
using (public.is_workshop_manager(workshop_id))
with check (public.is_workshop_manager(workshop_id));

create policy "Managers delete feed posts"
on public.community_feed_posts for delete
using (public.is_workshop_manager(workshop_id));

create policy "Authenticated users view active ads"
on public.ad_campaigns for select
to authenticated
using (active = true and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now()));

create policy "Members record ad events"
on public.ad_events for insert
to authenticated
with check (workshop_id is null or public.is_workshop_member(workshop_id));

create policy "Members view their ad revenue events"
on public.ad_events for select
to authenticated
using (workshop_id is null or public.is_workshop_member(workshop_id));

create policy "Platform admins manage ad campaigns"
on public.ad_campaigns for all
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

create policy "Platform admins view all ad events"
on public.ad_events for select
to authenticated
using (public.is_platform_admin());

-- Crear el primer taller despues del registro:
-- insert into public.workshops (owner_id, name, city) values (auth.uid(), 'Mi taller', 'Bogota') returning id;
-- insert into public.workshop_members (workshop_id, profile_id, role) values ('ID_DEL_TALLER', auth.uid(), 'owner');
