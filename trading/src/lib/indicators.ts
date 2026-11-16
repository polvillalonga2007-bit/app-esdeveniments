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
