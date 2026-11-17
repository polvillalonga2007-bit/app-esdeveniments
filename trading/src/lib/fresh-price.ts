import type { Quote } from "./market";
import { TradeError } from "./store";

// Preu del moment, demanat al servidor just abans d'operar
export async function freshQuote(symbol: string): Promise<Quote> {
  const res = await fetch(`/api/price?symbol=${encodeURIComponent(symbol)}`, { cache: "no-store" });
  const j = (await res.json()) as { quote?: Quote };
  if (!j.quote) throw new TradeError("PREU_NO_DISPONIBLE");
  if (!j.quote.open) throw new TradeError("MERCAT_TANCAT");
  return j.quote;
}

// Converteix el text d'un camp (en la moneda que es mostra) a número; buit = null
export function parseNum(v: string): number | null {
  const t = v.trim().replace(/\./g, (m, i, s: string) => (s.includes(",") ? "" : m)).replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) && n > 0 ? n : null;
}
