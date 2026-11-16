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

const RANGES: Record<string, { range: string; interval: string }> = {
  "1d": { range: "1d", interval: "5m" },
  "5d": { range: "5d", interval: "30m" },
  "1mo": { range: "1mo", interval: "1d" },
  "6mo": { range: "6mo", interval: "1d" },
  "1y": { range: "1y", interval: "1wk" },
};

export async function getChart(symbol: string, range: string): Promise<{ t: number; p: number }[] | null> {
  const asset = findAsset(symbol);
  const r = RANGES[range];
  if (!asset || !r) return null;
  const fx = asset.currency === "USD" ? await eurUsd() : 1;
  if (!fx) return null;
  const toEur = asset.currency === "USD" ? 1 / fx : 1;
  const y = await yahooChart(symbol, r.range, r.interval, range === "1d" ? 60 : 600);
  if (!y?.timestamp) return null;
  const out: { t: number; p: number }[] = [];
  y.timestamp.forEach((t, i) => {
    const c = y.closes[i];
    if (typeof c === "number") out.push({ t: t * 1000, p: c * toEur });
  });
  return out;
}
