"use client";

import { useState } from "react";
import { Card, ErrorBox, primaryButton } from "@/components/ui";
import { WEEKDAYS } from "@/lib/format";
import { errorText, rpc, type Hour } from "@/lib/supabase";

const timeInput = "h-11 w-full rounded-xl border border-line bg-white px-2.5 text-[16px] tabular-nums outline-none focus:border-brand";

export function HoursEditor({ token, hours, onChange }: { token: string; hours: Hour[]; onChange: () => void }) {
  const [list, setList] = useState<Hour[]>(hours);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const update = (i: number, patch: Partial<Hour>) => {
    setList(list.map((h, j) => (j === i ? { ...h, ...patch } : h)));
    setMsg("");
  };

  async function save() {
    const bad = list.find((h) => h.closes <= h.opens);
    if (bad) {
      setError(`${WEEKDAYS[bad.weekday - 1]}: l'hora de tancar ha de ser després de la d'obrir.`);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await rpc("rs_set_hours", { p_token: token, p_hours: list });
      setMsg("Horari desat");
      onChange();
    } catch (e) {
      setError(errorText(e));
    }
    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[15px] text-muted">Els clients només podran reservar dins d&apos;aquestes franges. Pots posar matí i tarda.</p>
      {WEEKDAYS.map((name, idx) => {
        const day = idx + 1;
        const ranges = list.map((h, i) => ({ h, i })).filter((x) => x.h.weekday === day);
        return (
          <Card key={day} className="py-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{name}</p>
              {ranges.length === 0 && <span className="text-sm text-muted">Tancat</span>}
            </div>
            {ranges.map(({ h, i }) => (
              <div key={i} className="mt-2.5 flex items-center gap-2">
                <input type="time" step={300} value={h.opens} onChange={(e) => update(i, { opens: e.target.value })} className={timeInput} aria-label="Obre" />
                <span className="text-muted">–</span>
                <input type="time" step={300} value={h.closes} onChange={(e) => update(i, { closes: e.target.value })} className={timeInput} aria-label="Tanca" />
                <button onClick={() => setList(list.filter((_, j) => j !== i))} aria-label="Treure franja" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-bad-soft hover:text-bad">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
                </button>
              </div>
            ))}
            <button
              onClick={() => setList([...list, { weekday: day, opens: ranges.length ? "16:00" : "09:00", closes: ranges.length ? "20:00" : "13:00" }])}
              className="mt-2 text-sm font-semibold text-brand"
            >
              + Afegir franja
            </button>
          </Card>
        );
      })}
      <ErrorBox>{error}</ErrorBox>
      <div className="sticky bottom-4 pt-2">
        <button disabled={busy} onClick={save} className={`${primaryButton} shadow-lg`}>{busy ? "Desant…" : msg || "Desar horari"}</button>
      </div>
    </div>
  );
}
