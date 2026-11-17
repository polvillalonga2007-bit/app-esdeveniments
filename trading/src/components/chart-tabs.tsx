"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ASSETS, TYPE_LABEL, AssetType, shortTicker } from "@/lib/assets";
import { useApp } from "@/lib/app-context";
import { pct, tone } from "@/lib/format";

const KEY = "parquet:pestanyes";

function load(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((s) => ASSETS.some((a) => a.symbol === s)) : [];
  } catch {
    return [];
  }
}
function save(v: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {}
}

const label = (symbol: string) => {
  const a = ASSETS.find((x) => x.symbol === symbol);
  return a?.type === "fons" ? shortTicker(symbol) : a?.type === "cripto" ? a.name : shortTicker(symbol);
};

// Pestanyes amb els actius oberts, com en un navegador
export function ChartTabs({ current }: { current: string }) {
  const router = useRouter();
  const { quote } = useApp();
  const [tabs, setTabs] = useState<string[]>([]);
  const [picker, setPicker] = useState(false);
  const activeRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const t = load();
    const next = t.includes(current) ? t : [...t, current];
    setTabs(next);
    save(next);
  }, [current]);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [tabs, current]);

  function close(symbol: string) {
    const i = tabs.indexOf(symbol);
    const next = tabs.filter((s) => s !== symbol);
    setTabs(next);
    save(next);
    if (symbol === current) {
      const go = next[Math.min(i, next.length - 1)];
      router.replace(go ? `/actiu/${encodeURIComponent(go)}` : "/mercat");
    }
  }

  function open(symbol: string) {
    setPicker(false);
    router.push(`/actiu/${encodeURIComponent(symbol)}`);
  }

  const groups: AssetType[] = ["cripto", "eua", "espanya", "fons"];

  return (
    <div className="relative">
      <div className="no-scrollbar -mx-4 flex items-end gap-1 overflow-x-auto border-b border-line px-4">
        {tabs.map((s) => {
          const on = s === current;
          const q = quote(s);
          return (
            <div
              key={s}
              className={`flex shrink-0 items-center rounded-t-xl border border-b-0 ${on ? "border-line bg-white" : "border-transparent bg-black/[0.04]"}`}
            >
              <Link
                ref={on ? activeRef : undefined}
                href={`/actiu/${encodeURIComponent(s)}`}
                replace
                className={`flex h-10 flex-col justify-center pl-3 pr-1 text-left leading-tight ${on ? "text-ink" : "text-muted"}`}
              >
                <span className="text-[13px] font-semibold">{label(s)}</span>
                <span className={`text-[11px] font-medium ${tone(q?.changePct)}`}>{pct(q?.changePct)}</span>
              </Link>
              <button
                type="button"
                onClick={() => close(s)}
                aria-label={`Tancar ${label(s)}`}
                className="mr-1 flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-black/5"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => setPicker((v) => !v)}
          aria-label="Obrir una pestanya nova"
          className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-brand hover:bg-brand-soft"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        </button>
      </div>
      {picker && (
        <>
          <button type="button" aria-label="Tancar" className="fixed inset-0 z-20 cursor-default" onClick={() => setPicker(false)} />
          <div className="absolute inset-x-0 top-full z-30 mt-2 max-h-[60vh] overflow-y-auto rounded-2xl border border-line bg-white p-2 shadow-xl">
            <p className="px-2 pb-1 pt-1 text-sm font-semibold">Obrir en una pestanya nova</p>
            {groups.map((g) => (
              <div key={g} className="py-1">
                <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted">{TYPE_LABEL[g]}</p>
                {ASSETS.filter((a) => a.type === g).map((a) => {
                  const isOpen = tabs.includes(a.symbol);
                  return (
                    <button
                      key={a.symbol}
                      type="button"
                      onClick={() => open(a.symbol)}
                      className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm hover:bg-ground"
                    >
                      <span>
                        <span className="font-semibold">{a.name}</span> <span className="text-muted">{shortTicker(a.symbol)}</span>
                      </span>
                      {isOpen && <span className="text-xs text-muted">oberta</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
