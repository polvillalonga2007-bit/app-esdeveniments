import "server-only";
import { ASSETS, Asset, findAsset } from "./assets";

export type Quote = {
  symbol: string;
  name: string;
  type: Asset["type"];
  price: number; // en €
  prevClose: number | null; // en €
  changePct: number | null;
  open: boolean; // es pot operar ara mateix
  spark: number[]; // preus d'avui (en €), per al mini gràfic
  updatedAt: number;
};

type YahooMeta = {
  regularMarketPrice?: number;
  chartPreviousClose?: number;
  previousClose?: number;
  regularMarketTime?: number;
  currentTradingPeriod?: { regular?: { start: number; end: number } };
};
type YahooChart = { meta: YahooMeta; timestamp?: number[]; closes: (number | null)[] };

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

async function yahooChart(symbol: string, range: string, interval: string, revalidate: number): Promise<YahooChart | null> {
  for (const host of ["query1.finance.yahoo.com", "query2.finance.yahoo.com"]) {
    try {
      const url = `https://${host}/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`;
      const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, next: { revalidate } });
      if (!res.ok) continue;
      const json = await res.json();
      const r = json?.chart?.result?.[0];
      if (!r?.meta) continue;
      return { meta: r.meta, timestamp: r.timestamp, closes: r.indicators?.quote?.[0]?.close ?? [] };
    } catch {
      // provem el següent servidor
    }
  }
  return null;
}

// Quants dòlars val 1 euro
async function eurUsd(): Promise<number | null> {
  const y = await yahooChart("EURUSD=X", "1d", "1h", 300);
  const p = y?.meta.regularMarketPrice;
  if (p && p > 0.5 && p < 2) return p;
  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=EUR&to=USD", { next: { revalidate: 3600 } });
    const j = await res.json();
    const r = j?.rates?.USD;
    if (r && r > 0.5 && r < 2) return r;
  } catch {}
  return null;
}

async function coingeckoQuote(asset: Asset): Promise<{ price: number; changePct: number | null } | null> {
  if (!asset.coingecko) return null;
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${asset.coingecko}&vs_currencies=eur&include_24hr_change=true`,
      { next: { revalidate: 60 } },
    );
    const j = await res.json();
    const d = j?.[asset.coingecko];
    if (!d?.eur) return null;
    return { price: d.eur, changePct: typeof d.eur_24h_change === "number" ? d.eur_24h_change : null };
  } catch {
    return null;
  }
}

function isOpen(asset: Asset, meta: YahooMeta): boolean {
  if (asset.type === "cripto") return true;
  const reg = meta.currentTradingPeriod?.regular;
  if (!reg) return false;
  const now = Date.now() / 1000;
  return now >= reg.start && now < reg.end;
}

async function quoteFor(asset: Asset, fx: number | null, revalidate: number): Promise<Quote | null> {
  const toEur = asset.currency === "USD" ? (fx ? 1 / fx : null) : 1;
  const y = await yahooChart(asset.symbol, "1d", "5m", revalidate);
  if (y && y.meta.regularMarketPrice && toEur) {
    const price = y.meta.regularMarketPrice * toEur;
    const prevRaw = y.meta.chartPreviousClose ?? y.meta.previousClose ?? null;
    const prevClose = prevRaw ? prevRaw * toEur : null;
    const spark = y.closes.filter((c): c is number => typeof c === "number").map((c) => c * toEur);
    return {
      symbol: asset.symbol,
      name: asset.name,
      type: asset.type,
      price,
      prevClose,
      changePct: prevClose ? ((price - prevClose) / prevClose) * 100 : null,
      open: isOpen(asset, y.meta),
      spark,
      updatedAt: (y.meta.regularMarketTime ?? Date.now() / 1000) * 1000,
    };
  }
  const cg = await coingeckoQuote(asset);
  if (cg) {
    return {
      symbol: asset.symbol,
      name: asset.name,
      type: asset.type,
      price: cg.price,
      prevClose: cg.changePct != null ? cg.price / (1 + cg.changePct / 100) : null,
      changePct: cg.changePct,
      open: true,
      spark: [],
      updatedAt: Date.now(),
    };
  }
  return null;
}

export async function getQuotes(): Promise<Quote[]> {
  const fx = await eurUsd();
  const quotes = await Promise.all(ASSETS.map((a) => quoteFor(a, fx, 60)));
  return quotes.filter((q): q is Quote => q !== null);
}

// Preu fresc per executar una operació
export async function getFreshQuote(symbol: string): Promise<Quote | null> {
  const asset = findAsset(symbol);
  if (!asset) return null;
  const fx = asset.currency === "USD" ? await eurUsd() : 1;
  return quoteFor(asset, fx, 10);
}

export type Candle = { t: number; o: number; h: number; l: number; c: number; v: number };

// Temporalitats del gràfic d'espelmes: quin període i quina mida d'espelma demanem a Yahoo
export const TIMEFRAMES: Record<string, { range: string; interval: string; group?: number; revalidate: number }> = {
  "1m": { range: "1d", interval: "1m", revalidate: 30 },
  "5m": { range: "5d", interval: "5m", revalidate: 60 },
  "15m": { range: "1mo", interval: "15m", revalidate: 120 },
  "1h": { range: "3mo", interval: "60m", revalidate: 300 },
  "4h": { range: "1y", interval: "60m", group: 4, revalidate: 600 },
  "1d": { range: "2y", interval: "1d", revalidate: 900 },
  "1wk": { range: "10y", interval: "1wk", revalidate: 3600 },
};

async function yahooCandles(symbol: string, range: string, interval: string, revalidate: number) {
  for (const host of ["query1.finance.yahoo.com", "query2.finance.yahoo.com"]) {
    try {
      const url = `https://${host}/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`;
      const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, next: { revalidate } });
      if (!res.ok) continue;
      const r = (await res.json())?.chart?.result?.[0];
      const q = r?.indicators?.quote?.[0];
      if (!r?.timestamp || !q) continue;
      return { t: r.timestamp as number[], o: q.open, h: q.high, l: q.low, c: q.close, v: q.volume } as {
        t: number[]; o: (number | null)[]; h: (number | null)[]; l: (number | null)[]; c: (number | null)[]; v: (number | null)[];
      };
    } catch {}
  }
  return null;
}

// Ajunta espelmes petites en una de més gran (p. ex. 4 d'una hora = 1 de 4 hores)
function group(candles: Candle[], hours: number): Candle[] {
  const size = hours * 3600;
  const out: Candle[] = [];
  for (const k of candles) {
    const bucket = Math.floor(k.t / size) * size;
    const last = out[out.length - 1];
    if (last && last.t === bucket) {
      last.h = Math.max(last.h, k.h);
      last.l = Math.min(last.l, k.l);
      last.c = k.c;
      last.v += k.v;
    } else out.push({ ...k, t: bucket });
  }
  return out;
}

export async function getCandles(symbol: string, tf: string): Promise<Candle[] | null> {
  const asset = findAsset(symbol);
  const cfg = TIMEFRAMES[tf];
  if (!asset || !cfg) return null;
  const fx = asset.currency === "USD" ? await eurUsd() : 1;
  if (!fx) return null;
  const k = asset.currency === "USD" ? 1 / fx : 1;
  const y = await yahooCandles(symbol, cfg.range, cfg.interval, cfg.revalidate);
  if (!y) return null;
  let out: Candle[] = [];
  const seen = new Set<number>();
  y.t.forEach((t, i) => {
    const [o, h, l, c] = [y.o[i], y.h[i], y.l[i], y.c[i]];
    if (o == null || h == null || l == null || c == null || seen.has(t)) return;
    seen.add(t);
    out.push({ t, o: o * k, h: h * k, l: l * k, c: c * k, v: y.v[i] ?? 0 });
  });
  out.sort((a, b) => a.t - b.t);
  if (cfg.group) out = group(out, cfg.group);
  return out;
}
