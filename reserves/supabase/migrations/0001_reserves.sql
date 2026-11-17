-- App de reserves per a negocis locals.
-- Totes les taules porten el prefix rs_ (comparteixen base de dades amb Quedem però són independents).
-- RLS activat sense polítiques: el navegador només hi entra a través de les funcions rs_*,
-- que comproven el token de sessió del negoci o el token de la reserva.

create extension if not exists pgcrypto with schema extensions;

create table public.rs_businesses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null check (char_length(name) between 1 and 80),
  email text not null unique check (email = lower(email) and email like '%_@_%'),
  password_hash text not null,
  phone text check (char_length(phone) <= 30),
  address text check (char_length(address) <= 200),
  description text check (char_length(description) <= 500),
  capacity int not null default 1 check (capacity between 1 and 20),
  slot_step int not null default 15 check (slot_step in (5, 10, 15, 20, 30, 60)),
  created_at timestamptz not null default now()
);

create table public.rs_sessions (
  token uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.rs_businesses(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index on public.rs_sessions(business_id);

create table public.rs_services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.rs_businesses(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  duration_min int not null check (duration_min between 5 and 480),
  price_cents int check (price_cents between 0 and 1000000),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index on public.rs_services(business_id);

create table public.rs_hours (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.rs_businesses(id) on delete cascade,
  weekday int not null check (weekday between 1 and 7), -- 1 = dilluns ... 7 = diumenge
  opens time not null,
  closes time not null,
  check (closes > opens)
);
create index on public.rs_hours(business_id);

create table public.rs_bookings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.rs_businesses(id) on delete cascade,
  service_id uuid references public.rs_services(id) on delete set null,
  service_name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  customer_name text not null check (char_length(customer_name) between 1 and 80),
  customer_phone text not null check (char_length(customer_phone) between 6 and 30),
  customer_email text check (char_length(customer_email) <= 120),
  note text check (char_length(note) <= 300),
  status text not null default 'confirmada' check (status in ('confirmada', 'cancelada')),
  cancelled_by text check (cancelled_by in ('negoci', 'client')),
  customer_token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now()
);
create index on public.rs_bookings(business_id, starts_at);

alter table public.rs_businesses enable row level security;
alter table public.rs_sessions enable row level security;
alter table public.rs_services enable row level security;
alter table public.rs_hours enable row level security;
alter table public.rs_bookings enable row level security;

-- ---------- Ajudes internes ----------

create or replace function public._rs_slugify(p text)
returns text language sql immutable set search_path = public as $$
  select trim(both '-' from regexp_replace(
    translate(lower(p), 'àáèéíìïòóúùüçñ·', 'aaeeiiioouuucn-'),
    '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function public._rs_auth(p_token uuid)
returns uuid language plpgsql stable security definer set search_path = public as $$
declare v uuid;
begin
  select business_id into v from rs_sessions where token = p_token;
  if v is null then raise exception 'SESSIO_INVALIDA'; end if;
  return v;
end $$;

-- ---------- Comptes del negoci ----------

create or replace function public.rs_register(p_name text, p_email text, p_password text, p_phone text)
returns jsonb language plpgsql volatile security definer set search_path = public, extensions as $$
declare v_slug text; v_base text; v_id uuid; v_token uuid; v_email text := lower(trim(p_email));
begin
  if char_length(coalesce(p_password, '')) < 6 then raise exception 'CONTRASENYA_CURTA'; end if;
  if exists (select 1 from rs_businesses where email = v_email) then raise exception 'EMAIL_JA_EXISTEIX'; end if;
  v_base := left(nullif(_rs_slugify(p_name), ''), 40);
  if v_base is null then v_base := 'negoci'; end if;
  v_slug := v_base;
  while exists (select 1 from rs_businesses where slug = v_slug) loop
    v_slug := v_base || '-' || substr(md5(random()::text), 1, 4);
  end loop;
  insert into rs_businesses (slug, name, email, password_hash, phone)
    values (v_slug, trim(p_name), v_email, crypt(p_password, gen_salt('bf')), nullif(trim(p_phone), ''))
    returning id into v_id;
  -- Horari per defecte: dilluns a divendres 9-13 i 16-20, dissabte 9-13
  insert into rs_hours (business_id, weekday, opens, closes)
    select v_id, d, '09:00', '13:00' from generate_series(1, 6) d
    union all
    select v_id, d, '16:00', '20:00' from generate_series(1, 5) d;
  insert into rs_sessions (business_id) values (v_id) returning token into v_token;
  return jsonb_build_object('token', v_token, 'slug', v_slug);
end $$;

create or replace function public.rs_login(p_email text, p_password text)
returns jsonb language plpgsql volatile security definer set search_path = public, extensions as $$
declare b rs_businesses; v_token uuid;
begin
  select * into b from rs_businesses where email = lower(trim(p_email));
  if b.id is null or b.password_hash <> crypt(p_password, b.password_hash) then
    raise exception 'LOGIN_INCORRECTE';
  end if;
  insert into rs_sessions (business_id) values (b.id) returning token into v_token;
  return jsonb_build_object('token', v_token, 'slug', b.slug);
end $$;

create or replace function public.rs_logout(p_token uuid)
returns void language sql volatile security definer set search_path = public as $$
  delete from rs_sessions where token = p_token;
$$;

-- ---------- Panell del negoci ----------

create or replace function public.rs_dashboard(p_token uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_id uuid := _rs_auth(p_token); b rs_businesses;
begin
  select * into b from rs_businesses where id = v_id;
  return jsonb_build_object(
    'business', jsonb_build_object('slug', b.slug, 'name', b.name, 'email', b.email, 'phone', b.phone,
       'address', b.address, 'description', b.description, 'capacity', b.capacity, 'slot_step', b.slot_step),
    'services', coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'duration_min', s.duration_min,
       'price_cents', s.price_cents, 'active', s.active) order by s.created_at)
       from rs_services s where s.business_id = v_id), '[]'::jsonb),
    'hours', coalesce((select jsonb_agg(jsonb_build_object('weekday', h.weekday, 'opens', to_char(h.opens, 'HH24:MI'),
       'closes', to_char(h.closes, 'HH24:MI')) order by h.weekday, h.opens)
       from rs_hours h where h.business_id = v_id), '[]'::jsonb),
    'bookings', coalesce((select jsonb_agg(jsonb_build_object('id', k.id, 'service_name', k.service_name,
       'starts_at', k.starts_at, 'ends_at', k.ends_at, 'customer_name', k.customer_name, 'customer_phone', k.customer_phone,
       'customer_email', k.customer_email, 'note', k.note, 'status', k.status, 'cancelled_by', k.cancelled_by) order by k.starts_at)
       from rs_bookings k where k.business_id = v_id
         and k.starts_at >= date_trunc('day', now() at time zone 'Europe/Madrid') at time zone 'Europe/Madrid'
         and k.starts_at < now() + interval '90 days'), '[]'::jsonb)
  );
end $$;

create or replace function public.rs_update_business(p_token uuid, p_name text, p_phone text, p_address text,
  p_description text, p_capacity int, p_slot_step int)
returns void language plpgsql volatile security definer set search_path = public as $$
declare v_id uuid := _rs_auth(p_token);
begin
  update rs_businesses set name = trim(p_name), phone = nullif(trim(p_phone), ''), address = nullif(trim(p_address), ''),
    description = nullif(trim(p_description), ''), capacity = p_capacity, slot_step = p_slot_step
  where id = v_id;
end $$;

create or replace function public.rs_save_service(p_token uuid, p_id uuid, p_name text, p_duration_min int,
  p_price_cents int, p_active boolean)
returns uuid language plpgsql volatile security definer set search_path = public as $$
declare v_id uuid := _rs_auth(p_token); v_sid uuid;
begin
  if p_id is null then
    insert into rs_services (business_id, name, duration_min, price_cents, active)
      values (v_id, trim(p_name), p_duration_min, p_price_cents, coalesce(p_active, true)) returning id into v_sid;
  else
    update rs_services set name = trim(p_name), duration_min = p_duration_min, price_cents = p_price_cents,
      active = coalesce(p_active, true)
      where id = p_id and business_id = v_id returning id into v_sid;
    if v_sid is null then raise exception 'NO_TROBAT'; end if;
  end if;
  return v_sid;
end $$;

create or replace function public.rs_delete_service(p_token uuid, p_id uuid)
returns void language plpgsql volatile security definer set search_path = public as $$
declare v_id uuid := _rs_auth(p_token);
begin
  delete from rs_services where id = p_id and business_id = v_id;
end $$;

-- p_hours: [{"weekday":1,"opens":"09:00","closes":"13:00"}, ...]
create or replace function public.rs_set_hours(p_token uuid, p_hours jsonb)
returns void language plpgsql volatile security definer set search_path = public as $$
declare v_id uuid := _rs_auth(p_token);
begin
  if jsonb_array_length(p_hours) > 50 then raise exception 'MASSES_FRANGES'; end if;
  delete from rs_hours where business_id = v_id;
  insert into rs_hours (business_id, weekday, opens, closes)
    select v_id, (x->>'weekday')::int, (x->>'opens')::time, (x->>'closes')::time
    from jsonb_array_elements(p_hours) x;
end $$;

create or replace function public.rs_cancel_booking(p_token uuid, p_id uuid)
returns void language plpgsql volatile security definer set search_path = public as $$
declare v_id uuid := _rs_auth(p_token);
begin
  update rs_bookings set status = 'cancelada', cancelled_by = 'negoci'
    where id = p_id and business_id = v_id and status = 'confirmada';
end $$;

-- ---------- Pàgina pública ----------

create or replace function public.rs_public_business(p_slug text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('slug', b.slug, 'name', b.name, 'phone', b.phone, 'address', b.address,
    'description', b.description,
    'services', coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'duration_min', s.duration_min,
       'price_cents', s.price_cents) order by s.created_at)
       from rs_services s where s.business_id = b.id and s.active), '[]'::jsonb),
    'hours', coalesce((select jsonb_agg(jsonb_build_object('weekday', h.weekday, 'opens', to_char(h.opens, 'HH24:MI'),
       'closes', to_char(h.closes, 'HH24:MI')) order by h.weekday, h.opens)
       from rs_hours h where h.business_id = b.id), '[]'::jsonb))
  from rs_businesses b where b.slug = p_slug;
$$;

-- Hores lliures d'un dia per a un servei (llista de timestamptz)
create or replace function public._rs_free_slots(p_business uuid, p_duration int, p_date date)
returns setof timestamptz language sql stable security definer set search_path = public as $$
  with b as (select capacity, slot_step from rs_businesses where id = p_business),
  cand as (
    select ((p_date + h.opens)::timestamp + make_interval(mins => n * b.slot_step)) at time zone 'Europe/Madrid' as st,
           h.closes
    from rs_hours h, b,
      generate_series(0, (extract(epoch from (h.closes - h.opens)) / 60 / b.slot_step)::int) n
    where h.business_id = p_business
      and h.weekday = extract(isodow from p_date)::int
      and (p_date + h.opens)::timestamp + make_interval(mins => n * b.slot_step + p_duration) <= (p_date + h.closes)::timestamp
  )
  select distinct c.st from cand c, b
  where c.st > now() + interval '15 minutes'
    and p_date <= (now() at time zone 'Europe/Madrid')::date + 60
    and (select count(*) from rs_bookings k
         where k.business_id = p_business and k.status = 'confirmada'
           and k.starts_at < c.st + make_interval(mins => p_duration) and k.ends_at > c.st) < b.capacity
  order by 1;
$$;

create or replace function public.rs_slots(p_slug text, p_service_id uuid, p_date date)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(t order by t), '[]'::jsonb)
  from rs_businesses b
  join rs_services s on s.business_id = b.id and s.id = p_service_id and s.active,
  lateral _rs_free_slots(b.id, s.duration_min, p_date) t
  where b.slug = p_slug;
$$;

create or replace function public.rs_book(p_slug text, p_service_id uuid, p_starts_at timestamptz,
  p_name text, p_phone text, p_email text, p_note text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare b rs_businesses; s rs_services; v_token uuid;
begin
  select * into b from rs_businesses where slug = p_slug for update; -- evita dues reserves alhora
  if b.id is null then raise exception 'NO_TROBAT'; end if;
  select * into s from rs_services where id = p_service_id and business_id = b.id and active;
  if s.id is null then raise exception 'NO_TROBAT'; end if;
  if not exists (select 1 from _rs_free_slots(b.id, s.duration_min, (p_starts_at at time zone 'Europe/Madrid')::date) t
                 where t = p_starts_at) then
    raise exception 'HORA_OCUPADA';
  end if;
  insert into rs_bookings (business_id, service_id, service_name, starts_at, ends_at,
      customer_name, customer_phone, customer_email, note)
    values (b.id, s.id, s.name, p_starts_at, p_starts_at + make_interval(mins => s.duration_min),
      trim(p_name), trim(p_phone), nullif(lower(trim(p_email)), ''), nullif(trim(p_note), ''))
    returning customer_token into v_token;
  return jsonb_build_object('token', v_token);
end $$;

-- ---------- Reserva vista pel client ----------

create or replace function public.rs_my_booking(p_token uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('service_name', k.service_name, 'starts_at', k.starts_at, 'ends_at', k.ends_at,
    'customer_name', k.customer_name, 'status', k.status, 'cancelled_by', k.cancelled_by,
    'business', jsonb_build_object('slug', b.slug, 'name', b.name, 'phone', b.phone, 'address', b.address))
  from rs_bookings k join rs_businesses b on b.id = k.business_id
  where k.customer_token = p_token;
$$;

create or replace function public.rs_customer_cancel(p_token uuid)
returns void language sql volatile security definer set search_path = public as $$
  update rs_bookings set status = 'cancelada', cancelled_by = 'client'
  where customer_token = p_token and status = 'confirmada' and starts_at > now();
$$;

-- ---------- Permisos ----------

revoke all on function public._rs_slugify(text), public._rs_auth(uuid), public._rs_free_slots(uuid, int, date) from public, anon, authenticated;
grant execute on function
  public.rs_register(text, text, text, text), public.rs_login(text, text), public.rs_logout(uuid),
  public.rs_dashboard(uuid), public.rs_update_business(uuid, text, text, text, text, int, int),
  public.rs_save_service(uuid, uuid, text, int, int, boolean), public.rs_delete_service(uuid, uuid),
  public.rs_set_hours(uuid, jsonb), public.rs_cancel_booking(uuid, uuid),
  public.rs_public_business(text), public.rs_slots(text, uuid, date),
  public.rs_book(text, uuid, timestamptz, text, text, text, text),
  public.rs_my_booking(uuid), public.rs_customer_cancel(uuid)
to anon, authenticated;
