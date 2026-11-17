// Càlcul dels indicadors tècnics a partir dels preus de tancament.
// Cada funció torna una llista de la mateixa llargada, amb null on encara no hi ha prou dades.

export function sma(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  let sum = 0;
  values.forEach((v, i) => {
    sum += v;
    if (i >= period) sum -= values[i - period];
    out.push(i >= period - 1 ? sum / period : null);
  });
  return out;
}

export function ema(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  const k = 2 / (period + 1);
  let prev: number | null = null;
  values.forEach((v, i) => {
    if (i < period - 1) return out.push(null);
    if (prev === null) prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
    else prev = v * k + prev * (1 - k);
    out.push(prev);
  });
  return out;
}

export function bollinger(values: number[], period = 20, mult = 2) {
  const mid = sma(values, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];
  values.forEach((_, i) => {
    const m = mid[i];
    if (m == null) {
      upper.push(null);
      lower.push(null);
      return;
    }
    const slice = values.slice(i - period + 1, i + 1);
    const sd = Math.sqrt(slice.reduce((a, v) => a + (v - m) ** 2, 0) / period);
    upper.push(m + mult * sd);
    lower.push(m - mult * sd);
  });
  return { mid, upper, lower };
}

// RSI de Wilder (14 períodes)
export function rsi(values: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = [null];
  let gain = 0;
  let loss = 0;
  for (let i = 1; i < values.length; i++) {
    const d = values[i] - values[i - 1];
    const g = Math.max(d, 0);
    const l = Math.max(-d, 0);
    if (i <= period) {
      gain += g;
      loss += l;
      if (i < period) {
        out.push(null);
        continue;
      }
      gain /= period;
      loss /= period;
    } else {
      gain = (gain * (period - 1) + g) / period;
      loss = (loss * (period - 1) + l) / period;
    }
    out.push(loss === 0 ? 100 : 100 - 100 / (1 + gain / loss));
  }
  return out;
}

export function macd(values: number[], fast = 12, slow = 26, signal = 9) {
  const f = ema(values, fast);
  const s = ema(values, slow);
  const line = values.map((_, i) => (f[i] != null && s[i] != null ? (f[i] as number) - (s[i] as number) : null));
  const firstIdx = line.findIndex((v) => v != null);
  const sig: (number | null)[] = values.map(() => null);
  if (firstIdx >= 0) {
    const e = ema(line.slice(firstIdx) as number[], signal);
    e.forEach((v, j) => (sig[firstIdx + j] = v));
  }
  const hist = line.map((v, i) => (v != null && sig[i] != null ? v - (sig[i] as number) : null));
  return { line, signal: sig, hist };
}

// Estocàstic lent (%K de 14, suavitzat 3, %D de 3)
export function stochastic(highs: number[], lows: number[], closes: number[], period = 14, smoothK = 3, smoothD = 3) {
  const raw: (number | null)[] = closes.map((c, i) => {
    if (i < period - 1) return null;
    const hh = Math.max(...highs.slice(i - period + 1, i + 1));
    const ll = Math.min(...lows.slice(i - period + 1, i + 1));
    return hh === ll ? 50 : ((c - ll) / (hh - ll)) * 100;
  });
  const smooth = (vals: (number | null)[], n: number) =>
    vals.map((_, i) => {
      const w = vals.slice(Math.max(0, i - n + 1), i + 1);
      return w.length === n && w.every((v) => v != null) ? (w as number[]).reduce((a, b) => a + b, 0) / n : null;
    });
  const k = smooth(raw, smoothK);
  const d = smooth(k, smoothD);
  return { k, d };
}

export type SrZone = { low: number; high: number; touches: number; kind: "suport" | "resistencia" };

// Zones de suport i resistència automàtiques (aproximació):
// 1) busquem girs del preu (màxims i mínims locals),
// 2) ajuntem els que són a prop entre ells en una zona,
// 3) ens quedem les zones on el preu ha girat més vegades.
export function supportResistance(
  candles: { h: number; l: number; c: number }[],
  opts: { window?: number; maxZones?: number } = {},
): SrZone[] {
  const n = candles.length;
  if (n < 30) return [];
  const k = opts.window ?? 5;
  const maxZones = opts.maxZones ?? 6;
  const avgRange = candles.reduce((a, c) => a + (c.h - c.l), 0) / n;
  const tol = Math.max(avgRange * 0.9, candles[n - 1].c * 0.0005);

  const pivots: { p: number; w: number }[] = [];
  for (let i = k; i < n - k; i++) {
    let isHigh = true;
    let isLow = true;
    for (let j = i - k; j <= i + k; j++) {
      if (j === i) continue;
      if (candles[j].h > candles[i].h) isHigh = false;
      if (candles[j].l < candles[i].l) isLow = false;
    }
    const recency = 0.5 + (i / n) * 0.5; // els girs recents compten una mica més
    if (isHigh) pivots.push({ p: candles[i].h, w: recency });
    if (isLow) pivots.push({ p: candles[i].l, w: recency });
  }
  pivots.sort((a, b) => a.p - b.p);

  const clusters: { low: number; high: number; sum: number; touches: number; score: number }[] = [];
  for (const pv of pivots) {
    const c = clusters[clusters.length - 1];
    if (c && pv.p - c.sum / c.touches <= tol) {
      c.high = Math.max(c.high, pv.p);
      c.low = Math.min(c.low, pv.p);
      c.sum += pv.p;
      c.touches += 1;
      c.score += pv.w;
    } else clusters.push({ low: pv.p, high: pv.p, sum: pv.p, touches: 1, score: pv.w });
  }

  const last = candles[n - 1].c;
  return clusters
    .filter((c) => c.touches >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxZones)
    .map((c) => {
      const pad = tol * 0.25;
      const low = c.low - pad;
      const high = c.high + pad;
      return { low, high, touches: c.touches, kind: (low + high) / 2 <= last ? "suport" : "resistencia" } as SrZone;
    });
}
