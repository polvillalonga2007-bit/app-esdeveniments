-- Parquet: simulador de trading amb diners ficticis.
-- Totes les taules porten el prefix tr_ (comparteixen base de dades amb altres apps però són independents).
-- RLS activat sense polítiques: el navegador només hi entra a través de les funcions tr_*.
-- Les operacions (tr_trade) només les pot fer el servidor de l'app, que coneix el secret guardat a tr_secret
-- i hi passa el preu real del moment; així ningú pot inventar-se un preu des del navegador.

create extension if not exists pgcrypto with schema extensions;

create table public.tr_users (
  id uuid primary key default gen_random_uuid(),
  nickname text not null check (char_length(nickname) between 2 and 24),
  password_hash text not null,
  cash numeric(16,2) not null default 10000 check (cash >= 0),
  resets int not null default 0,
  started_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create unique index tr_users_nickname_key on public.tr_users (lower(nickname));

create table public.tr_sessions (
  token uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.tr_users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index on public.tr_sessions(user_id);

create table public.tr_positions (
  user_id uuid not null references public.tr_users(id) on delete cascade,
  symbol text not null,
  asset_name text not null,
  qty numeric(28,8) not null check (qty > 0),
  cost numeric(16,2) not null check (cost >= 0), -- cost total en € de les unitats que encara tens
  primary key (user_id, symbol)
);

create table public.tr_trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.tr_users(id) on delete cascade,
  symbol text not null,
  asset_name text not null,
  side text not null check (side in ('compra', 'venda')),
  qty numeric(28,8) not null check (qty > 0),
  price numeric(20,6) not null check (price > 0), -- preu per unitat en €
  total numeric(16,2) not null,
  realized numeric(16,2), -- guany o pèrdua (només a les vendes)
  note text check (char_length(note) <= 300),
  created_at timestamptz not null default now()
);
create index on public.tr_trades(user_id, created_at desc);

create table public.tr_secret (
  id int primary key default 1 check (id = 1),
  secret text not null
);

alter table public.tr_users enable row level security;
alter table public.tr_sessions enable row level security;
alter table public.tr_positions enable row level security;
alter table public.tr_trades enable row level security;
alter table public.tr_secret enable row level security;

-- ---------- Ajudes internes ----------

create or replace function public._tr_auth(p_token uuid)
returns uuid language plpgsql stable security definer set search_path = public as $$
declare v uuid;
begin
  select user_id into v from tr_sessions where token = p_token;
  if v is null then raise exception 'SESSIO_INVALIDA'; end if;
  return v;
end $$;

create or replace function public._tr_state(p_user uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'user', (select jsonb_build_object('nickname', nickname, 'cash', cash, 'started_at', started_at, 'resets', resets)
             from tr_users where id = p_user),
    'positions', coalesce((select jsonb_agg(jsonb_build_object('symbol', symbol, 'asset_name', asset_name, 'qty', qty, 'cost', cost) order by cost desc)
             from tr_positions where user_id = p_user), '[]'::jsonb),
    'trades', coalesce((select jsonb_agg(t order by t.created_at desc) from (
             select id, symbol, asset_name, side, qty, price, total, realized, note, created_at
             from tr_trades where user_id = p_user order by created_at desc limit 500) t), '[]'::jsonb)
  );
$$;

-- ---------- Comptes ----------

create or replace function public.tr_register(p_nickname text, p_password text)
returns uuid language plpgsql volatile security definer set search_path = public, extensions as $$
declare v_id uuid; v_token uuid; v_nick text := trim(p_nickname);
begin
  if char_length(v_nick) < 2 or char_length(v_nick) > 24 then raise exception 'NOM_INVALID'; end if;
  if char_length(coalesce(p_password, '')) < 6 then raise exception 'CONTRASENYA_CURTA'; end if;
  if exists (select 1 from tr_users where lower(nickname) = lower(v_nick)) then raise exception 'NOM_JA_EXISTEIX'; end if;
  insert into tr_users (nickname, password_hash) values (v_nick, crypt(p_password, gen_salt('bf'))) returning id into v_id;
  insert into tr_sessions (user_id) values (v_id) returning token into v_token;
  return v_token;
end $$;

create or replace function public.tr_login(p_nickname text, p_password text)
returns uuid language plpgsql volatile security definer set search_path = public, extensions as $$
declare u tr_users; v_token uuid;
begin
  select * into u from tr_users where lower(nickname) = lower(trim(p_nickname));
  if u.id is null or u.password_hash <> crypt(p_password, u.password_hash) then raise exception 'LOGIN_INCORRECTE'; end if;
  insert into tr_sessions (user_id) values (u.id) returning token into v_token;
  return v_token;
end $$;

create or replace function public.tr_logout(p_token uuid)
returns void language sql volatile security definer set search_path = public as $$
  delete from tr_sessions where token = p_token;
$$;

create or replace function public.tr_state(p_token uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  return _tr_state(_tr_auth(p_token));
end $$;

create or replace function public.tr_reset(p_token uuid)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare v_user uuid := _tr_auth(p_token);
begin
  delete from tr_positions where user_id = v_user;
  delete from tr_trades where user_id = v_user;
  update tr_users set cash = 10000, resets = resets + 1, started_at = now() where id = v_user;
  return _tr_state(v_user);
end $$;

-- ---------- Operar (només el servidor, amb el secret) ----------

create or replace function public.tr_trade(
  p_secret text, p_token uuid, p_symbol text, p_name text, p_side text,
  p_qty numeric, p_price numeric, p_note text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  v_user uuid;
  v_cash numeric;
  v_pos tr_positions;
  v_qty numeric := round(p_qty, 8);
  v_total numeric;
  v_cost_part numeric;
  v_note text := nullif(left(trim(coalesce(p_note, '')), 300), '');
begin
  if not exists (select 1 from tr_secret where secret = p_secret) then raise exception 'NO_AUTORITZAT'; end if;
  v_user := _tr_auth(p_token);
  if v_qty is null or v_qty <= 0 or p_price is null or p_price <= 0 then raise exception 'QUANTITAT_INVALIDA'; end if;

  select cash into v_cash from tr_users where id = v_user for update;
  select * into v_pos from tr_positions where user_id = v_user and symbol = p_symbol for update;

  if p_side = 'compra' then
    v_total := round(v_qty * p_price, 2);
    if v_total < 1 then raise exception 'MINIM_1_EURO'; end if;
    if v_total > v_cash then raise exception 'SALDO_INSUFICIENT'; end if;
    update tr_users set cash = cash - v_total where id = v_user;
    insert into tr_positions (user_id, symbol, asset_name, qty, cost) values (v_user, p_symbol, p_name, v_qty, v_total)
      on conflict (user_id, symbol) do update set qty = tr_positions.qty + excluded.qty, cost = tr_positions.cost + excluded.cost;
    insert into tr_trades (user_id, symbol, asset_name, side, qty, price, total, note)
      values (v_user, p_symbol, p_name, 'compra', v_qty, p_price, v_total, v_note);
  elsif p_side = 'venda' then
    if v_pos.symbol is null then raise exception 'NO_EN_TENS'; end if;
    if v_qty > v_pos.qty then v_qty := v_pos.qty; end if;
    v_total := round(v_qty * p_price, 2);
    v_cost_part := case when v_qty = v_pos.qty then v_pos.cost else round(v_pos.cost * v_qty / v_pos.qty, 2) end;
    update tr_users set cash = cash + v_total where id = v_user;
    if v_qty = v_pos.qty then
      delete from tr_positions where user_id = v_user and symbol = p_symbol;
    else
      update tr_positions set qty = qty - v_qty, cost = cost - v_cost_part where user_id = v_user and symbol = p_symbol;
    end if;
    insert into tr_trades (user_id, symbol, asset_name, side, qty, price, total, realized, note)
      values (v_user, p_symbol, p_name, 'venda', v_qty, p_price, v_total, v_total - v_cost_part, v_note);
  else
    raise exception 'OPERACIO_INVALIDA';
  end if;

  return _tr_state(v_user);
end $$;

-- Permisos: les funcions internes no es poden cridar des de fora.
revoke all on function public._tr_auth(uuid) from public, anon, authenticated;
revoke all on function public._tr_state(uuid) from public, anon, authenticated;
grant execute on function public.tr_register(text, text) to anon, authenticated;
grant execute on function public.tr_login(text, text) to anon, authenticated;
grant execute on function public.tr_logout(uuid) to anon, authenticated;
grant execute on function public.tr_state(uuid) to anon, authenticated;
grant execute on function public.tr_reset(uuid) to anon, authenticated;
grant execute on function public.tr_trade(text, uuid, text, text, text, numeric, numeric, text) to anon, authenticated;
