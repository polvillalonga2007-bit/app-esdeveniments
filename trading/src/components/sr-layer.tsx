"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Candle, ChartApi } from "./candle-chart";
import { supportResistance } from "@/lib/indicators";

// Dibuixa les zones de suport (verd) i resistència (vermell) com a franges horitzontals
export function SrLayer({ api, candles }: { api: ChartApi | null; candles: Candle[] }) {
  const [, setTick] = useState(0);
  const bump = useCallback(() => setTick((t) => t + 1), []);
  const zones = useMemo(() => supportResistance(candles), [candles]);

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

  if (!api || zones.length === 0) return null;
  const width = api.chart.timeScale().width();
  const height = api.chart.panes()[0]?.getHeight() ?? 320;
  const py = (p: number) => api.series.priceToCoordinate(p);

  return (
    <svg width={width} height={height} className="pointer-events-none absolute left-0 top-0 z-[5]" aria-hidden="true">
      {zones.map((z, i) => {
        const y1 = py(z.high);
        const y2 = py(z.low);
        if (y1 == null || y2 == null) return null;
        const top = Math.min(y1, y2);
        const h = Math.max(3, Math.abs(y2 - y1));
        if (top > height || top + h < 0) return null;
        const sup = z.kind === "suport";
        const color = sup ? "22,163,74" : "220,38,38";
        const opacity = Math.min(0.3, 0.08 + z.touches * 0.04);
        return (
          <g key={i}>
            <rect x={0} y={top} width={width} height={h} fill={`rgba(${color},${opacity})`} />
            <line x1={0} x2={width} y1={top} y2={top} stroke={`rgba(${color},0.55)`} strokeDasharray="4 3" />
            <line x1={0} x2={width} y1={top + h} y2={top + h} stroke={`rgba(${color},0.55)`} strokeDasharray="4 3" />
            <text x={6} y={top + h / 2 + 4} fontSize={10} fontWeight={700} fill={`rgb(${color})`}>
              {sup ? "Suport" : "Resistència"} · {z.touches} toc{z.touches === 1 ? "" : "s"}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
