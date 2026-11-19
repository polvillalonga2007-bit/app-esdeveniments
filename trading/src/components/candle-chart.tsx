"use client";

import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  HistogramSeries,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type SeriesType,
  type UTCTimestamp,
} from "lightweight-charts";
import { bollinger, ema, macd, rsi, sma, stochastic } from "@/lib/indicators";

export type ChartApi = { chart: IChartApi; series: ISeriesApi<SeriesType>; container: HTMLDivElement };
export type Candle = { t: number; o: number; h: number; l: number; c: number; v: number };
export type IndicatorKey = "mm20" | "mm50" | "mm200" | "ema20" | "ema45" | "boll" | "stoch" | "sr" | "vol" | "rsi" | "macd";

const UP = "#16a34a";
const DOWN = "#dc2626";

export const INDICATORS: { key: IndicatorKey; label: string; color: string; help: string }[] = [
  { key: "sr", label: "Suports i resist.", color: "#16a34a", help: "Zones de suport (verd) i resistència (vermell) calculades automàticament: llocs on el preu ha girat diverses vegades. Com més tocs, més forta. És una aproximació: cada temporalitat en mostra de diferents i no garanteix que el preu hi reboti." },
  { key: "vol", label: "Volum", color: "#94a3b8", help: "Quantes accions o monedes s'han comprat i venut a cada espelma. Molt volum vol dir que el moviment té força." },
  { key: "mm20", label: "MM 20", color: "#f59e0b", help: "Mitjana mòbil de 20 espelmes: el preu mitjà recent. Si el preu està per sobre, la tendència curta és alcista." },
  { key: "mm50", label: "MM 50", color: "#3b82f6", help: "Mitjana mòbil de 50 espelmes: tendència mitjana." },
  { key: "mm200", label: "MM 200", color: "#a855f7", help: "Mitjana mòbil de 200 espelmes: tendència llarga. Molt mirada als gràfics diaris." },
  { key: "ema20", label: "EMA 20", color: "#ec4899", help: "Mitjana exponencial de 20: com la MM 20 però dona més pes als preus més recents, reacciona abans." },
  { key: "ema45", label: "EMA 45", color: "#14b8a6", help: "Mitjana exponencial de 45: tendència una mica més llarga que l'EMA 20. Quan l'EMA 20 la creua cap amunt, molts ho llegeixen com a senyal alcista." },
  { key: "boll", label: "Bollinger", color: "#64748b", help: "Bandes a 2 desviacions de la MM 20. Quan el preu toca la banda de dalt està 'car' respecte al normal; la de baix, 'barat'." },
  { key: "rsi", label: "RSI", color: "#7c3aed", help: "Índex de força relativa (0 a 100). Per sobre de 70 es considera sobrecomprat; per sota de 30, sobrevenut." },
  { key: "macd", label: "MACD", color: "#0ea5e9", help: "Diferència entre dues mitjanes (12 i 26). Quan la línia blava creua per sobre la taronja és senyal alcista; per sota, baixista." },
  { key: "stoch", label: "Estocàstic", color: "#e11d48", help: "Estocàstic (14, 3, 3): on és el preu dins del rang de les últimes 14 espelmes, de 0 a 100. Per sobre de 80, sobrecomprat; per sota de 20, sobrevenut. La línia vermella (%K) creuant la gris (%D) dona senyals d'entrada o sortida." },
];

const color = (k: IndicatorKey) => INDICATORS.find((i) => i.key === k)!.color;

// El gràfic mostra les hores en UTC; desplacem cada punt a l'hora local del dispositiu
const local = (t: number) => (t - new Date(t * 1000).getTimezoneOffset() * 60) as UTCTimestamp;

function line(times: UTCTimestamp[], values: (number | null)[]) {
  return values.flatMap((v, i) => (v == null ? [] : [{ time: times[i], value: v }]));
}

export function CandleChart({
  candles,
  active,
  mode,
  intraday,
  onReady,
  viewKey,
  live,
}: {
  candles: Candle[];
  active: Set<IndicatorKey>;
  mode: "espelmes" | "linia";
  intraday: boolean;
  onReady?: (api: ChartApi | null) => void;
  viewKey?: string; // si no canvia (mateix actiu i temporalitat), conservem el zoom en refrescar les dades
  live?: Candle | null; // última espelma actualitzada en directe (sense redibuixar tot el gràfic)
}) {
  const ref = useRef<HTMLDivElement>(null);
  const saved = useRef<{ key?: string; range: { from: number; to: number } | null }>({ range: null });
  const mainRef = useRef<{ s: ISeriesApi<SeriesType>; candle: boolean; last: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || candles.length === 0) return;
    const panes = 1 + (active.has("rsi") ? 1 : 0) + (active.has("stoch") ? 1 : 0) + (active.has("macd") ? 1 : 0);
    const height = panes === 1 ? 320 : 320 + (panes - 1) * 107;
    const chart: IChartApi = createChart(el, {
      height,
      width: el.clientWidth,
      layout: { background: { type: ColorType.Solid, color: "#ffffff" }, textColor: "#64748b", fontSize: 11, attributionLogo: false },
      grid: { vertLines: { color: "#f1f5f9" }, horzLines: { color: "#f1f5f9" } },
      rightPriceScale: { borderColor: "#e2e8f0" },
      timeScale: { borderColor: "#e2e8f0", timeVisible: intraday, secondsVisible: false },
      localization: { locale: "ca-ES", priceFormatter: (p: number) => p.toLocaleString("ca-ES", { maximumFractionDigits: p < 1 ? 5 : 2, minimumFractionDigits: p < 1 ? 4 : 2 }) },
      crosshair: { mode: 0 },
    });

    const times = candles.map((c) => local(c.t));
    const closes = candles.map((c) => c.c);

    let main: ISeriesApi<SeriesType>;
    if (mode === "espelmes") {
      const s = chart.addSeries(CandlestickSeries, { upColor: UP, downColor: DOWN, borderVisible: false, wickUpColor: UP, wickDownColor: DOWN });
      s.setData(candles.map((c, i) => ({ time: times[i], open: c.o, high: c.h, low: c.l, close: c.c })));
      main = s;
    } else {
      const up = closes[closes.length - 1] >= closes[0];
      const s = chart.addSeries(LineSeries, { color: up ? UP : DOWN, lineWidth: 2, priceLineVisible: true });
      s.setData(closes.map((c, i) => ({ time: times[i], value: c })));
      main = s;
    }

    if (active.has("vol")) {
      const v = chart.addSeries(HistogramSeries, { priceScaleId: "vol", priceFormat: { type: "volume" }, lastValueVisible: false, priceLineVisible: false });
      v.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
      v.setData(candles.map((c, i) => ({ time: times[i], value: c.v, color: c.c >= c.o ? "rgba(22,163,74,0.35)" : "rgba(220,38,38,0.35)" })));
    }

    const overlay = (key: IndicatorKey, values: (number | null)[], opts: { dashed?: boolean } = {}) => {
      const s = chart.addSeries(LineSeries, {
        color: color(key),
        lineWidth: 1,
        lineStyle: opts.dashed ? 2 : 0,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      s.setData(line(times, values));
    };
    if (active.has("mm20")) overlay("mm20", sma(closes, 20));
    if (active.has("mm50")) overlay("mm50", sma(closes, 50));
    if (active.has("mm200")) overlay("mm200", sma(closes, 200));
    if (active.has("ema20")) overlay("ema20", ema(closes, 20));
    if (active.has("ema45")) overlay("ema45", ema(closes, 45));
    if (active.has("boll")) {
      const b = bollinger(closes);
      overlay("boll", b.upper, { dashed: true });
      overlay("boll", b.mid);
      overlay("boll", b.lower, { dashed: true });
    }

    let pane = 1;
    if (active.has("rsi")) {
      const s = chart.addSeries(LineSeries, { color: color("rsi"), lineWidth: 1, priceLineVisible: false }, pane);
      s.setData(line(times, rsi(closes)));
      s.createPriceLine({ price: 70, color: DOWN, lineWidth: 1, lineStyle: 2, axisLabelVisible: false, title: "" });
      s.createPriceLine({ price: 30, color: UP, lineWidth: 1, lineStyle: 2, axisLabelVisible: false, title: "" });
      pane++;
    }
    if (active.has("stoch")) {
      const st = stochastic(candles.map((c) => c.h), candles.map((c) => c.l), closes);
      const k = chart.addSeries(LineSeries, { color: color("stoch"), lineWidth: 1, priceLineVisible: false }, pane);
      k.setData(line(times, st.k));
      const d = chart.addSeries(LineSeries, { color: "#94a3b8", lineWidth: 1, priceLineVisible: false, lastValueVisible: false }, pane);
      d.setData(line(times, st.d));
      k.createPriceLine({ price: 80, color: DOWN, lineWidth: 1, lineStyle: 2, axisLabelVisible: false, title: "" });
      k.createPriceLine({ price: 20, color: UP, lineWidth: 1, lineStyle: 2, axisLabelVisible: false, title: "" });
      pane++;
    }
    if (active.has("macd")) {
      const m = macd(closes);
      const h = chart.addSeries(HistogramSeries, { priceLineVisible: false, lastValueVisible: false }, pane);
      h.setData(m.hist.flatMap((v, i) => (v == null ? [] : [{ time: times[i], value: v, color: v >= 0 ? "rgba(22,163,74,0.5)" : "rgba(220,38,38,0.5)" }])));
      const l = chart.addSeries(LineSeries, { color: "#0ea5e9", lineWidth: 1, priceLineVisible: false, lastValueVisible: false }, pane);
      l.setData(line(times, m.line));
      const sg = chart.addSeries(LineSeries, { color: "#f59e0b", lineWidth: 1, priceLineVisible: false, lastValueVisible: false }, pane);
      sg.setData(line(times, m.signal));
    }
    const allPanes = chart.panes();
    allPanes.forEach((p, i) => p.setStretchFactor(i === 0 ? 3 : 1));

    // Mostrem les últimes ~90 espelmes; es pot fer zoom i arrossegar
    const n = candles.length;
    const prev = saved.current;
    if (prev.key === viewKey && prev.range) chart.timeScale().setVisibleLogicalRange(prev.range);
    else chart.timeScale().setVisibleLogicalRange({ from: Math.max(0, n - 90), to: n + 2 });

    const ro = new ResizeObserver(() => chart.applyOptions({ width: el.clientWidth }));
    ro.observe(el);
    onReady?.({ chart, series: main, container: el });
    mainRef.current = { s: main, candle: mode === "espelmes", last: candles[candles.length - 1].t };
    return () => {
      mainRef.current = null;
      const r = chart.timeScale().getVisibleLogicalRange();
      saved.current = { key: viewKey, range: r ? { from: r.from, to: r.to } : null };
      onReady?.(null);
      ro.disconnect();
      chart.remove();
    };
  }, [candles, active, mode, intraday, onReady, viewKey]);

  // Moviment en directe: només actualitzem l'última espelma
  useEffect(() => {
    const m = mainRef.current;
    if (!m || !live || live.t < m.last) return;
    try {
      if (m.candle) m.s.update({ time: local(live.t), open: live.o, high: live.h, low: live.l, close: live.c });
      else m.s.update({ time: local(live.t), value: live.c });
    } catch {}
  }, [live]);

  return <div ref={ref} className="w-full" />;
}
