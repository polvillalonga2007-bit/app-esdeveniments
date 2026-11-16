"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Logical } from "lightweight-charts";
import type { Candle, ChartApi } from "./candle-chart";
import { price as fmtPrice } from "@/lib/format";

type Pt = { t: number; p: number };
export type Drawing =
  | { id: string; kind: "hline"; price: number }
  | { id: string; kind: "trend"; a: Pt; b: Pt }
  | { id: string; kind: "brush"; pts: Pt[] }
  | { id: string; kind: "long" | "short"; t1: number; t2: number; entry: number; target: number; stop: number };

export type Tool = "cursor" | "long" | "short" | "hline" | "trend" | "brush";

type Drag = {
  id: string;
  part: "move" | "target" | "stop" | "right" | "a" | "b";
  x0: number;
  y0: number;
  orig: Drawing;
  moved?: boolean;
};

const KEY = (symbol: string) => `parquet:dibuixos:${symbol}`;

export function loadDrawings(symbol: string): Drawing[] {
  try {
    const d = JSON.parse(localStorage.getItem(KEY(symbol)) ?? "[]");
    return Array.isArray(d) ? d : [];
  } catch {
    return [];
  }
}

export function saveDrawings(symbol: string, d: Drawing[]) {
  try {
    localStorage.setItem(KEY(symbol), JSON.stringify(d));
  } catch {}
}

const UP = "#16a34a";
const DOWN = "#dc2626";
const INK = "#2563eb";

export function DrawingLayer({
  api,
  candles,
  tool,
  setTool,
  drawings,
  setDrawings,
  selected,
  setSelected,
}: {
  api: ChartApi | null;
  candles: Candle[];
  tool: Tool;
  setTool: (t: Tool) => void;
  drawings: Drawing[];
  setDrawings: (d: Drawing[], record?: boolean) => void;
  selected: string | null;
  setSelected: (id: string | null) => void;
}) {
  const [, setTick] = useState(0);
  const [draft, setDraft] = useState<Drawing | null>(null);
  const drag = useRef<Drag | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const bump = useCallback(() => setTick((t) => t + 1), []);

  // Tornem a dibuixar quan el gràfic es mou, fa zoom o canvia de mida
  useEffect(() => {
    if (!api) return;
    const ts = api.chart.timeScale();
    ts.subscribeVisibleLogicalRangeChange(bump);
    api.chart.subscribeCrosshairMove(bump);
    const ro = new ResizeObserver(bump);
    ro.observe(api.container);
    bump();
    return () => {
      ts.unsubscribeVisibleLogicalRangeChange(bump);
      api.chart.unsubscribeCrosshairMove(bump);
      ro.disconnect();
    };
  }, [api, bump]);

  if (!api || candles.length < 2) return null;
  const { chart, series } = api;
  const ts = chart.timeScale();
  const times = candles.map((c) => c.t);
  const n = times.length;
  const step = (times[n - 1] - times[0]) / (n - 1) || 60;
  const width = ts.width();
  const height = chart.panes()[0]?.getHeight() ?? 320;

  // Temps (segons) <-> posició horitzontal, també fora de les dades (futur o passat)
  const timeToLogical = (t: number) => {
    if (t <= times[0]) return (t - times[0]) / step;
    if (t >= times[n - 1]) return n - 1 + (t - times[n - 1]) / step;
    let lo = 0;
    let hi = n - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (times[mid] <= t) lo = mid;
      else hi = mid;
    }
    return lo + (t - times[lo]) / (times[hi] - times[lo]);
  };
  const logicalToTime = (l: number) => {
    if (l <= 0) return times[0] + l * step;
    if (l >= n - 1) return times[n - 1] + (l - (n - 1)) * step;
    const i = Math.floor(l);
    return times[i] + (l - i) * (times[i + 1] - times[i]);
  };
  const tx = (t: number) => ts.logicalToCoordinate(timeToLogical(t) as Logical) ?? -9999;
  const xt = (x: number) => {
    const l = ts.coordinateToLogical(x);
    return l == null ? times[n - 1] : logicalToTime(l);
  };
  const py = (p: number) => series.priceToCoordinate(p) ?? -9999;
  const yp = (y: number) => series.coordinateToPrice(y) ?? 0;

  function local(e: React.PointerEvent) {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  const id = () => Math.random().toString(36).slice(2, 10);

  function onDown(e: React.PointerEvent<SVGSVGElement>) {
    if (tool === "cursor") return;
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const { x, y } = local(e);
    const pt = { t: xt(x), p: yp(y) };
    if (tool === "hline") {
      setDrawings([...drawings, { id: id(), kind: "hline", price: pt.p }]);
      setTool("cursor");
    } else if (tool === "long" || tool === "short") {
      const visTop = yp(0);
      const visBottom = yp(height);
      const d = Math.abs(visTop - visBottom) * 0.12;
      const sign = tool === "long" ? 1 : -1;
      const nd: Drawing = { id: id(), kind: tool, t1: pt.t, t2: pt.t + step * 25, entry: pt.p, target: pt.p + sign * d, stop: pt.p - sign * d };
      setDrawings([...drawings, nd]);
      setSelected(nd.id);
      setTool("cursor");
    } else if (tool === "trend") {
      setDraft({ id: id(), kind: "trend", a: pt, b: pt });
    } else if (tool === "brush") {
      setDraft({ id: id(), kind: "brush", pts: [pt] });
    }
  }

  function startDrag(e: React.PointerEvent, d: Drawing, part: Drag["part"]) {
    if (tool !== "cursor") return;
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    const { x, y } = local(e);
    drag.current = { id: d.id, part, x0: x, y0: y, orig: d };
    setSelected(d.id);
  }

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const { x, y } = local(e);
    if (draft) {
      const pt = { t: xt(x), p: yp(y) };
      if (draft.kind === "trend") setDraft({ ...draft, b: pt });
      if (draft.kind === "brush") {
        const last = draft.pts[draft.pts.length - 1];
        if (Math.hypot(tx(last.t) - x, py(last.p) - y) > 3) setDraft({ ...draft, pts: [...draft.pts, pt] });
      }
      return;
    }
    const g = drag.current;
    if (!g) return;
    const dt = xt(x) - xt(g.x0);
    const dp = yp(y) - yp(g.y0);
    const o = g.orig;
    let nd: Drawing = o;
    const mv = (p: Pt) => ({ t: p.t + dt, p: p.p + dp });
    if (o.kind === "hline") nd = { ...o, price: o.price + dp };
    else if (o.kind === "trend") {
      if (g.part === "a") nd = { ...o, a: { t: xt(x), p: yp(y) } };
      else if (g.part === "b") nd = { ...o, b: { t: xt(x), p: yp(y) } };
      else nd = { ...o, a: mv(o.a), b: mv(o.b) };
    } else if (o.kind === "brush") nd = { ...o, pts: o.pts.map(mv) };
    else {
      const sign = o.kind === "long" ? 1 : -1;
      // l'objectiu i l'stop no poden creuar l'entrada: deixem com a mínim 10 píxels de marge
      const gap = Math.abs(yp(py(o.entry) + 10) - o.entry);
      if (g.part === "target") {
        const v = yp(y);
        nd = { ...o, target: sign * (v - o.entry) >= gap ? v : o.entry + sign * gap };
      } else if (g.part === "stop") {
        const v = yp(y);
        nd = { ...o, stop: sign * (o.entry - v) >= gap ? v : o.entry - sign * gap };
      } else if (g.part === "right") nd = { ...o, t2: Math.max(o.t1 + step, xt(x)) };
      else nd = { ...o, t1: o.t1 + dt, t2: o.t2 + dt, entry: o.entry + dp, target: o.target + dp, stop: o.stop + dp };
    }
    // el primer moviment guarda l'estat anterior per poder desfer
    setDrawings(drawings.map((d) => (d.id === nd.id ? nd : d)), !g.moved);
    g.moved = true;
  }

  function onUp() {
    if (draft) {
      const ok =
        draft.kind === "brush"
          ? draft.pts.length > 1
          : draft.kind === "trend" && Math.hypot(tx(draft.a.t) - tx(draft.b.t), py(draft.a.p) - py(draft.b.p)) > 8;
      if (ok) setDrawings([...drawings, draft]);
      setDraft(null);
      if (draft.kind === "trend") setTool("cursor");
    }
    drag.current = null;
  }

  const all = draft ? [...drawings, draft] : drawings;
  const grab = { pointerEvents: tool === "cursor" ? ("all" as const) : ("none" as const), cursor: "move" };

  function handle(d: Drawing, part: Drag["part"], x: number, y: number, cursor = "ns-resize") {
    return (
      <g key={part} onPointerDown={(e) => startDrag(e, d, part)} style={{ pointerEvents: tool === "cursor" ? "all" : "none", cursor }}>
        <circle cx={x} cy={y} r={14} fill="transparent" />
        <circle cx={x} cy={y} r={5} fill="#fff" stroke={INK} strokeWidth={2} />
      </g>
    );
  }

  function label(x: number, y: number, text: string, bg: string) {
    const w = text.length * 6.3 + 12;
    return (
      <g style={{ pointerEvents: "none" }}>
        <rect x={x - w / 2} y={y - 10} width={w} height={20} rx={4} fill={bg} />
        <text x={x} y={y + 4} textAnchor="middle" fontSize={11} fontWeight={600} fill="#fff">{text}</text>
      </g>
    );
  }

  const pctTxt = (a: number, b: number) =>
    `${(b - a >= 0 ? "+" : "−")}${Math.abs(((b - a) / a) * 100).toLocaleString("ca-ES", { maximumFractionDigits: 2 })} %`;

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className="absolute left-0 top-0 z-10"
      style={{ pointerEvents: tool === "cursor" ? "none" : "all", touchAction: tool === "cursor" ? "auto" : "none", cursor: tool === "cursor" ? "default" : "crosshair" }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <defs>
        <clipPath id="plot">
          <rect x={0} y={0} width={width} height={height} />
        </clipPath>
      </defs>
      <g clipPath="url(#plot)">
        {all.map((d) => {
          const sel = d.id === selected;
          if (d.kind === "hline") {
            const y = py(d.price);
            return (
              <g key={d.id}>
                <line x1={0} x2={width} y1={y} y2={y} stroke={INK} strokeWidth={sel ? 2 : 1.3} />
                <line x1={0} x2={width} y1={y} y2={y} stroke="transparent" strokeWidth={16} style={grab} onPointerDown={(e) => startDrag(e, d, "move")} />
                {label(width - 40, y - 12, fmtPrice(d.price), INK)}
              </g>
            );
          }
          if (d.kind === "trend") {
            const [x1, y1, x2, y2] = [tx(d.a.t), py(d.a.p), tx(d.b.t), py(d.b.p)];
            return (
              <g key={d.id}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={INK} strokeWidth={sel ? 2.4 : 1.6} />
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth={16} style={grab} onPointerDown={(e) => startDrag(e, d, "move")} />
                {sel && handle(d, "a", x1, y1, "move")}
                {sel && handle(d, "b", x2, y2, "move")}
              </g>
            );
          }
          if (d.kind === "brush") {
            const pts = d.pts.map((p) => `${tx(p.t).toFixed(1)},${py(p.p).toFixed(1)}`).join(" ");
            return (
              <g key={d.id}>
                <polyline points={pts} fill="none" stroke="#f59e0b" strokeWidth={sel ? 3 : 2} strokeLinejoin="round" strokeLinecap="round" />
                <polyline points={pts} fill="none" stroke="transparent" strokeWidth={14} style={grab} onPointerDown={(e) => startDrag(e, d, "move")} />
              </g>
            );
          }
          // Posició llarga o curta
          const x1 = tx(d.t1);
          const x2 = tx(d.t2);
          const [ye, yt, ys] = [py(d.entry), py(d.target), py(d.stop)];
          const w = Math.max(4, x2 - x1);
          const reward = Math.abs(d.target - d.entry);
          const risk = Math.abs(d.entry - d.stop);
          const rr = risk ? reward / risk : 0;
          const mid = x1 + w / 2;
          const isLong = d.kind === "long";
          return (
            <g key={d.id}>
              <rect x={x1} y={Math.min(ye, yt)} width={w} height={Math.abs(yt - ye)} fill="rgba(22,163,74,0.18)" />
              <rect x={x1} y={Math.min(ye, ys)} width={w} height={Math.abs(ys - ye)} fill="rgba(220,38,38,0.18)" />
              <line x1={x1} x2={x1 + w} y1={ye} y2={ye} stroke="#64748b" strokeWidth={1.2} />
              <rect x={x1} y={Math.min(yt, ys)} width={w} height={Math.abs(yt - ys)} fill="transparent" style={grab} onPointerDown={(e) => startDrag(e, d, "move")} />
              {sel && (
                <>
                  {label(mid, yt + (isLong ? -14 : 14), `Objectiu: ${fmtPrice(d.target)} (${pctTxt(d.entry, d.target)})`, UP)}
                  {label(mid, ys + (isLong ? 14 : -14), `Stop: ${fmtPrice(d.stop)} (${pctTxt(d.entry, d.stop)})`, DOWN)}
                  {label(mid, ye + (isLong ? 14 : -14), `${isLong ? "Llarga" : "Curta"} a ${fmtPrice(d.entry)} · ràtio ${rr.toLocaleString("ca-ES", { maximumFractionDigits: 2 })}`, "#334155")}
                  {handle(d, "target", x1 + Math.min(w * 0.25, 40), yt)}
                  {handle(d, "stop", x1 + Math.min(w * 0.25, 40), ys)}
                  {handle(d, "move", x1, ye, "move")}
                  {handle(d, "right", x1 + w, ye, "ew-resize")}
                </>
              )}
              {!sel && label(mid, ye + (isLong ? 14 : -14), `ràtio ${rr.toLocaleString("ca-ES", { maximumFractionDigits: 2 })}`, "#334155")}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
