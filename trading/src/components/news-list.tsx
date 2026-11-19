"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "./ui";

type Item = { title: string; link: string; source: string; date: string };

function ago(iso: string): string {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `fa ${Math.max(1, m)} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `fa ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "ahir" : `fa ${d} dies`;
}

export function NewsList({ symbol, limit }: { symbol?: string; limit?: number }) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState(false);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [updated, setUpdated] = useState<number | null>(null);
  const [, setNow] = useState(0);
  const seen = useRef<Set<string> | null>(null);

  // Es refresca sol cada minut; les notícies que arriben noves es marquen
  useEffect(() => {
    let alive = true;
    setItems(null);
    setError(false);
    seen.current = null;
    const load = () =>
      fetch(`/api/news${symbol ? `?symbol=${encodeURIComponent(symbol)}` : ""}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((j: { items?: Item[] }) => {
          if (!alive) return;
          if (!j.items) return void (!seen.current && setError(true));
          if (seen.current) {
            const nw = j.items.filter((n) => !seen.current!.has(n.link)).map((n) => n.link);
            if (nw.length) setFresh((f) => new Set([...f, ...nw]));
          }
          seen.current = new Set(j.items.map((n) => n.link));
          setItems(j.items);
          setError(false);
          setUpdated(Date.now());
        })
        .catch(() => alive && !seen.current && setError(true));
    load();
    const id = setInterval(() => document.visibilityState === "visible" && load(), 60_000);
    const clock = setInterval(() => setNow(Date.now()), 15_000);
    return () => {
      alive = false;
      clearInterval(id);
      clearInterval(clock);
    };
  }, [symbol]);

  if (error) return <Card className="text-sm text-muted">No s&apos;han pogut carregar les notícies. Torna-ho a provar d&apos;aquí a una estona.</Card>;
  if (!items)
    return (
      <Card className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-ground" />
        ))}
      </Card>
    );
  if (items.length === 0) return <Card className="text-sm text-muted">No hi ha notícies dels últims 7 dies.</Card>;

  const secs = updated ? Math.round((Date.now() - updated) / 1000) : 0;
  return (
    <Card className="divide-y divide-line p-0">
      <p className="flex items-center gap-2 px-4 py-2 text-xs text-muted">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-up" />
        En directe · actualitzat {secs < 20 ? "ara mateix" : `fa ${secs < 60 ? `${secs} s` : `${Math.round(secs / 60)} min`}`}
      </p>
      {items.slice(0, limit ?? items.length).map((n) => (
        <a key={n.link} href={n.link} target="_blank" rel="noopener noreferrer" className={`flex flex-col gap-1 px-4 py-3 hover:bg-black/[0.02] ${fresh.has(n.link) ? "bg-brand/5" : ""}`}>
          <span className="text-[15px] font-medium leading-snug">
            {fresh.has(n.link) && <span className="mr-1.5 rounded bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white">NOU</span>}
            {n.title}
          </span>
          <span className="text-xs text-muted">
            {n.source} · {ago(n.date)}
          </span>
        </a>
      ))}
    </Card>
  );
}
