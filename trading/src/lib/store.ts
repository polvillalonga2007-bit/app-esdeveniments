// La cartera es guarda al navegador (localStorage). Més endavant es podrà passar a Supabase
// (vegeu supabase/migrations/0001_trading.sql, encara no aplicat) per tenir rànquings entre amics.

export const START_CASH = 10000;

export type Position = { symbol: string; asset_name: string; qty: number; cost: number };
export type Trade = {
  id: string;
  symbol: string;
  asset_name: string;
  side: "compra" | "venda";
  qty: number;
  price: number;
  total: number;
  realized: number | null;
  note: string | null;
  created_at: string;
};
export type State = {
  user: { nickname: string; cash: number; started_at: string; resets: number };
  positions: Position[];
  trades: Trade[];
};

const KEY = "parquet:cartera";

export function loadState(): State | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as State) : null;
  } catch {
    return null;
  }
}

export function saveState(s: State): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}

export function clearState() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

export function newState(nickname: string): State {
  return {
    user: { nickname: nickname.trim().slice(0, 24), cash: START_CASH, started_at: new Date().toISOString(), resets: 0 },
    positions: [],
    trades: [],
  };
}

export function resetState(s: State): State {
  return { ...newState(s.user.nickname), user: { ...newState(s.user.nickname).user, resets: s.user.resets + 1 } };
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const round8 = (n: number) => Math.floor(n * 1e8) / 1e8;

export class TradeError extends Error {}

const messages: Record<string, string> = {
  SALDO_INSUFICIENT: "No tens prou diners disponibles per a aquesta compra.",
  MINIM_1_EURO: "L'import mínim és d'1 €.",
  NO_EN_TENS: "No en tens cap per vendre.",
  MERCAT_TANCAT: "El mercat està tancat ara mateix. Podràs operar quan torni a obrir.",
  PREU_NO_DISPONIBLE: "Ara mateix no podem obtenir el preu. Torna-ho a provar d'aquí a un moment.",
};

export function errorText(e: unknown): string {
  const msg = (e as { message?: string })?.message ?? String(e);
  return messages[msg] ?? "Alguna cosa no ha anat bé. Torna-ho a provar.";
}

// Aplica una operació. amount = euros (compra o venda); all = vendre-ho tot.
export function applyTrade(
  s: State,
  o: { symbol: string; name: string; side: "compra" | "venda"; price: number; amount?: number; all?: boolean; note?: string },
): State {
  const pos = s.positions.find((p) => p.symbol === o.symbol);
  const note = o.note?.trim().slice(0, 300) || null;
  const base = { id: crypto.randomUUID(), symbol: o.symbol, asset_name: o.name, side: o.side, price: o.price, note, created_at: new Date().toISOString() };

  if (o.side === "compra") {
    const amount = Number(o.amount);
    if (!Number.isFinite(amount) || amount < 1) throw new TradeError("MINIM_1_EURO");
    const q = round8(amount / o.price);
    const total = round2(q * o.price);
    if (total > s.user.cash + 0.001) throw new TradeError("SALDO_INSUFICIENT");
    const positions = pos
      ? s.positions.map((p) => (p.symbol === o.symbol ? { ...p, qty: p.qty + q, cost: round2(p.cost + total) } : p))
      : [...s.positions, { symbol: o.symbol, asset_name: o.name, qty: q, cost: total }];
    return {
      user: { ...s.user, cash: round2(s.user.cash - total) },
      positions,
      trades: [{ ...base, qty: q, total, realized: null }, ...s.trades],
    };
  }

  if (!pos) throw new TradeError("NO_EN_TENS");
  let q: number;
  if (o.all) q = pos.qty;
  else {
    const amount = Number(o.amount);
    if (!Number.isFinite(amount) || amount < 1) throw new TradeError("MINIM_1_EURO");
    q = Math.min(pos.qty, round8(amount / o.price));
    if (pos.qty - q < 1e-8 || (pos.qty - q) * o.price < 0.01) q = pos.qty; // si queda una engruna, ho venem tot
  }
  const total = round2(q * o.price);
  const sellingAll = q >= pos.qty;
  const costPart = sellingAll ? pos.cost : round2((pos.cost * q) / pos.qty);
  const positions = sellingAll
    ? s.positions.filter((p) => p.symbol !== o.symbol)
    : s.positions.map((p) => (p.symbol === o.symbol ? { ...p, qty: p.qty - q, cost: round2(p.cost - costPart) } : p));
  return {
    user: { ...s.user, cash: round2(s.user.cash + total) },
    positions,
    trades: [{ ...base, qty: q, total, realized: round2(total - costPart) }, ...s.trades],
  };
}
