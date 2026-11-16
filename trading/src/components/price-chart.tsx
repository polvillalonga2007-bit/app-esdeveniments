"use client";

import { useState } from "react";
import { money } from "@/lib/format";

type Point = { t: number; p: number };

export function PriceChart({ points, range }: { points: Point[]; range: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 360;
  const H = 180;
  if (points.length < 2) return <div className="flex h-[180px] items-center justify-center text-sm text-muted">Sense dades per a aquest període</div>;
  const ps = points.map((x) => x.p);
  const min = Math.min(...ps);
  const max = Math.max(...ps);
  const span = max - min || 1;
  const x = (i: number) => (i / (points.length - 1)) * W;
  const y = (v: number) => H - 8 - ((v - min) / span) * (H - 16);
  const line = points.map((pt, i) => `${x(i).toFixed(1)},${y(pt.p).toFixed(1)}`).join(" ");
  const up = ps[ps.length - 1] >= ps[0];
  const color = up ? "var(--color-up)" : "var(--color-down)";
  const h = hover != null ? points[hover] : null;

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = (e.clientX - rect.left) / rect.width;
    setHover(Math.max(0, Math.min(points.length - 1, Math.round(rel * (points.length - 1)))));
  }

  const fmtT = (t: number) =>
    new Date(t).toLocaleString("ca-ES", range === "1d" || range === "5d"
      ? { weekday: range === "5d" ? "short" : undefined, hour: "2-digit", minute: "2-digit" }
      : { day: "numeric", month: "short", year: range === "1y" ? "2-digit" : undefined });

  return (
    <div>
      <div className="mb-1 h-5 text-sm text-muted">{h ? `${money(h.p)} · ${fmtT(h.t)}` : `Mín. ${money(min)} · Màx. ${money(max)}`}</div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-[180px] w-full touch-none"
        preserveAspectRatio="none"
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label="Gràfic del preu"
      >
        <defs>
          <linearGradient id="fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.18" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={`0,${H} ${line} ${W},${H}`} fill="url(#fill)" />
        <polyline points={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {hover != null && (
          <line x1={x(hover)} x2={x(hover)} y1="0" y2={H} stroke="var(--color-muted)" strokeWidth="1" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
        )}
      </svg>
    </div>
  );
}
