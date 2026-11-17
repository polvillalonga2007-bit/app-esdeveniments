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
  // Només a les operacions ràpides (llargues/curtes)
  dir?: Dir;
  action?: "obrir" | "tancar";
  reason?: CloseReason;
};

// Operació ràpida, com a les plataformes de trading: llarga (guanyes si puja) o curta (guanyes si baixa).
// Es reserva l'import com a garantia; en tancar es torna la garantia més el guany (o menys la pèrdua).
export type Dir = "llarg" | "curt";
export type CloseReason = "manual" | "sl" | "tp" | "liquidacio";
export type Op = {
  id: string;
  symbol: string;
  asset_name: string;
  dir: Dir;
  qty: number;
  entry: number; // preu d'entrada en €
  margin: number; // € reservats
  sl: number | null; // stop (€)
  tp: number | null; // objectiu (€)
  opened_at: string;
};
export type State = {
  user: { nickname: string; cash: number; started_at: string; resets: number };
  positions: Position[];
  trades: Trade[];
  ops?: Op[];
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
    ops: [],
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
  MINIM_1_EURO: "L'import mínim és d'1 € (uns 1,2 $).",
  NO_EN_TENS: "No en tens cap per vendre.",
  MERCAT_TANCAT: "El mercat està tancat ara mateix. Podràs operar quan torni a obrir.",
  SL_INVALID: "L'stop ha d'estar per sota del preu actual en una compra, i per sobre en una venda.",
  TP_INVALID: "L'objectiu ha d'estar per sobre del preu actual en una compra, i per sota en una venda.",
  OP_NO_EXISTEIX: "Aquesta operació ja està tancada.",
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
      ...s,
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
    ...s,
    user: { ...s.user, cash: round2(s.user.cash + total) },
    positions,
    trades: [{ ...base, qty: q, total, realized: round2(total - costPart) }, ...s.trades],
  };
}

// ---------- Operacions ràpides (llargues i curtes) ----------

const sign = (d: Dir) => (d === "llarg" ? 1 : -1);

// Guany o pèrdua d'una operació a un preu donat (mai pots perdre més del que has reservat)
export function opPnl(o: Op, price: number): number {
  return Math.max(-o.margin, sign(o.dir) * (price - o.entry) * o.qty);
}
export const opValue = (o: Op, price: number) => o.margin + opPnl(o, price);

export function checkLevels(dir: Dir, price: number, sl: number | null, tp: number | null) {
  const k = sign(dir);
  if (sl != null && !(k * (price - sl) > 0)) throw new TradeError("SL_INVALID");
  if (tp != null && !(k * (tp - price) > 0)) throw new TradeError("TP_INVALID");
}

export function openOp(
  s: State,
  o: { symbol: string; name: string; dir: Dir; price: number; amount: number; sl?: number | null; tp?: number | null },
): State {
  const amount = Number(o.amount);
  if (!Number.isFinite(amount) || amount < 1) throw new TradeError("MINIM_1_EURO");
  const sl = o.sl ?? null;
  const tp = o.tp ?? null;
  checkLevels(o.dir, o.price, sl, tp);
  const q = round8(amount / o.price);
  const margin = round2(q * o.price);
  if (margin > s.user.cash + 0.001) throw new TradeError("SALDO_INSUFICIENT");
  const now = new Date().toISOString();
  const op: Op = { id: crypto.randomUUID(), symbol: o.symbol, asset_name: o.name, dir: o.dir, qty: q, entry: o.price, margin, sl, tp, opened_at: now };
  const trade: Trade = {
    id: crypto.randomUUID(), symbol: o.symbol, asset_name: o.name, side: o.dir === "llarg" ? "compra" : "venda",
    qty: q, price: o.price, total: margin, realized: null, note: null, created_at: now, dir: o.dir, action: "obrir",
  };
  return { ...s, user: { ...s.user, cash: round2(s.user.cash - margin) }, ops: [op, ...(s.ops ?? [])], trades: [trade, ...s.trades] };
}

export function closeOp(s: State, id: string, price: number, reason: CloseReason = "manual"): State {
  const o = (s.ops ?? []).find((x) => x.id === id);
  if (!o) throw new TradeError("OP_NO_EXISTEIX");
  const pnl = round2(opPnl(o, price));
  const trade: Trade = {
    id: crypto.randomUUID(), symbol: o.symbol, asset_name: o.asset_name, side: o.dir === "llarg" ? "venda" : "compra",
    qty: o.qty, price, total: round2(o.qty * price), realized: pnl, note: null, created_at: new Date().toISOString(),
    dir: o.dir, action: "tancar", reason,
  };
  return {
    ...s,
    user: { ...s.user, cash: round2(s.user.cash + Math.max(0, o.margin + pnl)) },
    ops: (s.ops ?? []).filter((x) => x.id !== id),
    trades: [trade, ...s.trades],
  };
}

export function updateOpLevels(s: State, id: string, price: number, sl: number | null, tp: number | null): State {
  const o = (s.ops ?? []).find((x) => x.id === id);
  if (!o) throw new TradeError("OP_NO_EXISTEIX");
  checkLevels(o.dir, price, sl, tp);
  return { ...s, ops: (s.ops ?? []).map((x) => (x.id === id ? { ...x, sl, tp } : x)) };
}

// Mira si algun preu ha tocat un stop, un objectiu o s'ha perdut tota la garantia.
// Es tanca al nivell marcat (stop o objectiu), com una ordre automàtica.
export function runTriggers(s: State, priceOf: (symbol: string) => number | undefined): { state: State; closed: { op: Op; reason: CloseReason; pnl: number }[] } {
  let state = s;
  const closed: { op: Op; reason: CloseReason; pnl: number }[] = [];
  for (const o of s.ops ?? []) {
    const p = priceOf(o.symbol);
    if (p == null) continue;
    const k = sign(o.dir);
    let reason: CloseReason | null = null;
    let at = p;
    if (o.sl != null && k * (p - o.sl) <= 0) [reason, at] = ["sl", o.sl];
    else if (o.tp != null && k * (p - o.tp) >= 0) [reason, at] = ["tp", o.tp];
    else if (opValue(o, p) <= 0.005) reason = "liquidacio";
    if (!reason) continue;
    state = closeOp(state, o.id, at, reason);
    closed.push({ op: o, reason, pnl: state.trades[0].realized ?? 0 });
  }
  return { state, closed };
}

export function tradeLabel(t: Trade): string {
  if (t.action === "obrir") return t.dir === "llarg" ? "Obre compra" : "Obre venda";
  if (t.action === "tancar") {
    const why = t.reason === "sl" ? " (stop)" : t.reason === "tp" ? " (objectiu)" : t.reason === "liquidacio" ? " (sense garantia)" : "";
    return `Tanca ${t.dir === "llarg" ? "compra" : "venda"}${why}`;
  }
  return t.side === "compra" ? "Compra" : "Venda";
}
