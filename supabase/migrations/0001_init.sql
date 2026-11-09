-- Fase 1: esdeveniments, assistència, avisos i tasques.
-- Les taules tenen RLS sense polítiques: el client només hi accedeix
-- a través de les funcions de sota, que comproven els tokens.

create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  admin_token uuid not null unique default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  starts_at timestamptz not null,
  location text check (char_length(location) <= 200),
  description text check (char_length(description) <= 2000),
  organizer_name text not null check (char_length(organizer_name) between 1 and 60),
  surprise boolean not null default false,
  reminder boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  guest_token uuid not null unique default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  status text not null check (status in ('si', 'potser', 'no')),
  companions int not null default 0 check (companions between 0 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.rsvps(event_id);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index on public.announcements(event_id);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  assignee text check (char_length(assignee) <= 60),
  created_at timestamptz not null default now()
);
create index on public.tasks(event_id);

alter table public.events enable row level security;
alter table public.rsvps enable row level security;
alter table public.announcements enable row level security;
alter table public.tasks enable row level security;

-- Dades compartides d'un esdeveniment (sense el token d'administració)
create or replace function public._event_payload(e public.events)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'slug', e.slug,
    'title', e.title,
    'starts_at', e.starts_at,
    'location', e.location,
    'description', e.description,
    'organizer_name', e.organizer_name,
    'surprise', e.surprise,
    'reminder', e.reminder,
    'counts', (select jsonb_build_object(
        'si', count(*) filter (where status = 'si'),
        'potser', count(*) filter (where status = 'potser'),
        'no', count(*) filter (where status = 'no'),
        'persones', coalesce(sum(1 + companions) filter (where status = 'si'), 0))
      from rsvps r where r.event_id = e.id),
    'announcements', coalesce((select jsonb_agg(jsonb_build_object('id', a.id, 'body', a.body, 'created_at', a.created_at) order by a.created_at desc)
      from announcements a where a.event_id = e.id), '[]'::jsonb),
    'tasks', coalesce((select jsonb_agg(jsonb_build_object('id', t.id, 'title', t.title, 'assignee', t.assignee) order by t.created_at)
      from tasks t where t.event_id = e.id), '[]'::jsonb)
  );
$$;

create or replace function public.create_event(
  p_title text, p_starts_at timestamptz, p_location text, p_description text,
  p_organizer_name text, p_surprise boolean, p_reminder boolean)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare e public.events; s text;
begin
  loop
    s := substr(translate(encode(extensions.gen_random_bytes(9), 'base64'), '+/=', 'abc'), 1, 8);
    exit when not exists (select 1 from events where slug = s);
  end loop;
  insert into events(slug, title, starts_at, location, description, organizer_name, surprise, reminder)
  values (s, trim(p_title), p_starts_at, nullif(trim(p_location), ''), nullif(trim(p_description), ''),
          trim(p_organizer_name), coalesce(p_surprise, false), coalesce(p_reminder, true))
  returning * into e;
  return jsonb_build_object('slug', e.slug, 'admin_token', e.admin_token);
end $$;

create or replace function public.get_event(p_slug text, p_guest_token uuid default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare e public.events; me jsonb;
begin
  select * into e from events where slug = p_slug;
  if not found then return null; end if;
  select jsonb_build_object('name', r.name, 'status', r.status, 'companions', r.companions)
    into me from rsvps r where r.event_id = e.id and r.guest_token = p_guest_token;
  return _event_payload(e) || jsonb_build_object('me', me);
end $$;

create or replace function public.get_event_admin(p_admin_token uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare e public.events;
begin
  select * into e from events where admin_token = p_admin_token;
  if not found then return null; end if;
  return _event_payload(e) || jsonb_build_object(
    'guests', coalesce((select jsonb_agg(jsonb_build_object('name', r.name, 'status', r.status, 'companions', r.companions) order by r.updated_at desc)
      from rsvps r where r.event_id = e.id), '[]'::jsonb));
end $$;

create or replace function public.upsert_rsvp(
  p_slug text, p_guest_token uuid, p_name text, p_status text, p_companions int)
returns uuid language plpgsql volatile security definer set search_path = public as $$
declare e_id uuid; tok uuid;
begin
  select id into e_id from events where slug = p_slug;
  if e_id is null then raise exception 'event_not_found'; end if;
  if p_guest_token is not null then
    update rsvps set name = trim(p_name), status = p_status,
      companions = case when p_status = 'si' then coalesce(p_companions, 0) else 0 end, updated_at = now()
    where guest_token = p_guest_token and event_id = e_id returning guest_token into tok;
  end if;
  if tok is null then
    insert into rsvps(event_id, name, status, companions)
    values (e_id, trim(p_name), p_status, case when p_status = 'si' then coalesce(p_companions, 0) else 0 end)
    returning guest_token into tok;
  end if;
  return tok;
end $$;

create or replace function public.add_announcement(p_admin_token uuid, p_body text)
returns void language plpgsql volatile security definer set search_path = public as $$
declare e_id uuid;
begin
  select id into e_id from events where admin_token = p_admin_token;
  if e_id is null then raise exception 'not_allowed'; end if;
  insert into announcements(event_id, body) values (e_id, trim(p_body));
end $$;

create or replace function public.add_task(p_admin_token uuid, p_title text)
returns void language plpgsql volatile security definer set search_path = public as $$
declare e_id uuid;
begin
  select id into e_id from events where admin_token = p_admin_token;
  if e_id is null then raise exception 'not_allowed'; end if;
  insert into tasks(event_id, title) values (e_id, trim(p_title));
end $$;

create or replace function public.claim_task(p_slug text, p_task_id uuid, p_name text)
returns boolean language plpgsql volatile security definer set search_path = public as $$
declare n int;
begin
  update tasks t set assignee = trim(p_name)
  from events e
  where t.id = p_task_id and t.event_id = e.id and e.slug = p_slug and t.assignee is null;
  get diagnostics n = row_count;
  return n = 1;
end $$;

revoke all on function public._event_payload(public.events) from public, anon, authenticated;
grant execute on function public.create_event, public.get_event, public.get_event_admin,
  public.upsert_rsvp, public.add_announcement, public.add_task, public.claim_task to anon, authenticated;
