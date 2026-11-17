"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    let alive = true;
    setItems(null);
    setError(false);
    fetch(`/api/news${symbol ? `?symbol=${encodeURIComponent(symbol)}` : ""}`)
      .then((r) => r.json())
      .then((j) => alive && (j.items ? setItems(j.items) : setError(true)))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
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

  return (
    <Card className="divide-y divide-line p-0">
      {items.slice(0, limit ?? items.length).map((n) => (
        <a key={n.link} href={n.link} target="_blank" rel="noopener noreferrer" className="flex flex-col gap-1 px-4 py-3 hover:bg-black/[0.02]">
          <span className="text-[15px] font-medium leading-snug">{n.title}</span>
          <span className="text-xs text-muted">
            {n.source} · {ago(n.date)}
          </span>
        </a>
      ))}
    </Card>
  );
}
