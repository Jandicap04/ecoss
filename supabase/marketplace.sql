-- Marketplace: debe ejecutarse después de schema.sql.
-- Reutiliza las tablas españolas existentes. quote_requests y featured_businesses
-- son vistas de compatibilidad creadas por schema.sql, no tablas para indexar.

create or replace function public.get_open_quote_requests()
returns table (
  id uuid,
  title text,
  description text,
  location text,
  budget_amount numeric(12,2),
  category text,
  tags text[],
  image_urls text[],
  status text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    q.id,
    q.titulo as title,
    q.descripcion as description,
    q.ciudad as location,
    q.presupuesto as budget_amount,
    q.categoria as category,
    q.etiquetas as tags,
    q.imagenes as image_urls,
    q.estado as status,
    q.created_at
  from public.solicitudes_cotizacion q
  where q.estado = 'open'
  order by q.created_at desc
  limit 50;
$$;

revoke all on function public.get_open_quote_requests() from public;
grant execute on function public.get_open_quote_requests() to anon, authenticated;

create or replace function public.get_my_quote_requests()
returns table (
  id uuid,
  title text,
  description text,
  location text,
  budget_amount numeric(12,2),
  category text,
  tags text[],
  image_urls text[],
  status text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    q.id,
    q.titulo as title,
    q.descripcion as description,
    q.ciudad as location,
    q.presupuesto as budget_amount,
    q.categoria as category,
    q.etiquetas as tags,
    q.imagenes as image_urls,
    q.estado as status,
    q.created_at
  from public.solicitudes_cotizacion q
  where q.solicitante_id = auth.uid()
  order by q.created_at desc;
$$;

revoke all on function public.get_my_quote_requests() from public, anon;
grant execute on function public.get_my_quote_requests() to authenticated;

create or replace function public.owns_quote_request(p_request_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.solicitudes_cotizacion q
    where q.id = p_request_id
      and q.solicitante_id = auth.uid()
  );
$$;

revoke all on function public.owns_quote_request(uuid) from public, anon;
grant execute on function public.owns_quote_request(uuid) to authenticated;

create table if not exists public.request_offers (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.solicitudes_cotizacion(id) on delete cascade,
  provider_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  message text not null check (char_length(trim(message)) between 10 and 1000),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  unique (request_id, provider_id)
);

create index if not exists request_offers_request_idx
  on public.request_offers(request_id, created_at desc);

alter table public.request_offers enable row level security;

drop policy if exists "Proveedores y solicitantes pueden ver propuestas autorizadas" on public.request_offers;
create policy "Proveedores y solicitantes pueden ver propuestas autorizadas"
on public.request_offers for select
to authenticated
using (provider_id = auth.uid() or public.owns_quote_request(request_id));

drop policy if exists "Proveedores pueden proponer en solicitudes abiertas" on public.request_offers;
create policy "Proveedores pueden proponer en solicitudes abiertas"
on public.request_offers for insert
to authenticated
with check (
  provider_id = auth.uid()
  and not public.owns_quote_request(request_id)
  and exists (
    select 1
    from public.solicitudes_cotizacion q
    where q.id = request_id and q.estado = 'open'
  )
);

drop policy if exists "Proveedores pueden actualizar su propuesta pendiente" on public.request_offers;
create policy "Proveedores pueden actualizar su propuesta pendiente"
on public.request_offers for update
to authenticated
using (
  provider_id = auth.uid()
  and status = 'pending'
  and not public.owns_quote_request(request_id)
)
with check (
  provider_id = auth.uid()
  and status = 'pending'
  and not public.owns_quote_request(request_id)
  and exists (
    select 1
    from public.solicitudes_cotizacion q
    where q.id = request_id and q.estado = 'open'
  )
);

revoke all on table public.request_offers from anon, authenticated;
grant select (id, request_id, amount, message, status, created_at)
  on public.request_offers to authenticated;
grant insert (request_id, provider_id, amount, message)
  on public.request_offers to authenticated;
grant update (request_id, provider_id, amount, message)
  on public.request_offers to authenticated;

create or replace function public.set_quote_request_status(p_request_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión.';
  end if;
  if p_status not in ('open', 'closed') then
    raise exception 'Estado de solicitud no válido.';
  end if;

  update public.solicitudes_cotizacion
  set estado = p_status, updated_at = now()
  where id = p_request_id
    and solicitante_id = auth.uid();

  if not found then
    raise exception 'No puedes cambiar esta solicitud.';
  end if;
end;
$$;

revoke all on function public.set_quote_request_status(uuid, text) from public, anon;
grant execute on function public.set_quote_request_status(uuid, text) to authenticated;

create or replace function public.respond_to_request_offer(p_offer_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión.';
  end if;
  if p_status not in ('accepted', 'declined') then
    raise exception 'Respuesta a la propuesta no válida.';
  end if;

  select o.request_id
  into v_request_id
  from public.request_offers o
  join public.solicitudes_cotizacion q on q.id = o.request_id
  where o.id = p_offer_id
    and q.solicitante_id = auth.uid()
    and q.estado = 'open'
  for update of q;

  if not found then
    raise exception 'La propuesta no existe o la solicitud ya no está abierta.';
  end if;

  update public.request_offers
  set status = p_status
  where id = p_offer_id
    and request_id = v_request_id
    and status = 'pending';

  if not found then
    raise exception 'La propuesta ya fue respondida.';
  end if;

  if p_status = 'accepted' then
    update public.request_offers
    set status = 'declined'
    where request_id = v_request_id
      and id <> p_offer_id
      and status = 'pending';

    update public.solicitudes_cotizacion
    set estado = 'closed', updated_at = now()
    where id = v_request_id;
  end if;
end;
$$;

revoke all on function public.respond_to_request_offer(uuid, text) from public, anon;
grant execute on function public.respond_to_request_offer(uuid, text) to authenticated;
