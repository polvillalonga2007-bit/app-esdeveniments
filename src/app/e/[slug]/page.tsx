"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Card, Loading, SectionTitle, inputClass } from "@/components/ui";
import { formatWhen, timeAgo } from "@/lib/format";
import { local } from "@/lib/local";
import { supabase, type EventData, type Status } from "@/lib/supabase";

const options: { id: Status; label: string }[] = [
  { id: "si", label: "Hi vaig" },
  { id: "potser", label: "Potser" },
  { id: "no", label: "No puc" },
];

const thanks: Record<Status, string> = {
  si: "Genial! Ens veiem allà.",
  potser: "D'acord! Quan ho sàpigues, torna aquí i canvia la resposta.",
  no: "Llàstima! Si canvies d'idea, ho pots canviar aquí mateix.",
};

export default function Invite() {
  const { slug } = useParams<{ slug: string }>();
  const [ev, setEv] = useState<EventData | null | undefined>(undefined);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Status | null>(null);
  const [companions, setCompanions] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase.rpc("get_event", { p_slug: slug, p_guest_token: local.guestToken(slug) });
    setEv((data as EventData) ?? null);
    return data as EventData | null;
  }, [slug]);

  useEffect(() => {
    load().then((d) => {
      if (d?.me) {
        setName(d.me.name);
        setStatus(d.me.status);
        setCompanions(d.me.companions);
        setSaved(true);
      } else {
        setName(local.name());
      }
    });
  }, [load]);

  async function answer(s: Status) {
    setStatus(s);
    setSaved(false);
    setError("");
    if (s !== "si") setCompanions(0);
    if (!name.trim()) {
      setError("Escriu el teu nom perquè l'organitzador sàpiga qui ets.");
      return;
    }
    await save(s, s === "si" ? companions : 0);
  }

  async function save(s: Status, c: number) {
    if (!name.trim()) return;
    setSaving(true);
    const { data, error } = await supabase.rpc("upsert_rsvp", {
      p_slug: slug,
      p_guest_token: local.guestToken(slug),
      p_name: name,
      p_status: s,
      p_companions: c,
    });
    setSaving(false);
    if (error || !data) {
      setError("No s'ha pogut desar. Torna-ho a provar.");
      return;
    }
    local.saveGuestToken(slug, data as string);
    local.saveName(name.trim());
    setSaved(true);
    load();
  }

  function changeCompanions(delta: number) {
    const c = Math.min(10, Math.max(0, companions + delta));
    setCompanions(c);
    if (status === "si") save("si", c);
  }

  async function claim(taskId: string) {
    const who = name.trim() || local.name();
    if (!who) {
      setError("Escriu el teu nom a dalt per apuntar-te a una tasca.");
      return;
    }
    await supabase.rpc("claim_task", { p_slug: slug, p_task_id: taskId, p_name: who });
    load();
  }

  if (ev === undefined) return <Loading />;
  if (ev === null)
    return (
      <main className="p-8 text-center">
        <p className="font-semibold">Aquest enllaç no funciona.</p>
        <p className="mt-1 text-sm text-muted">Demana a qui t&apos;ha convidat que te&apos;l torni a enviar.</p>
      </main>
    );

  const myName = name.trim().toLowerCase();

  return (
    <main className="min-h-dvh bg-white pb-10">
      <div className="px-5 pt-10">
        <div className="flex h-[150px] flex-col justify-end rounded-3xl bg-brand p-[18px] text-white">
          <span className="text-[13px] text-white/90">{ev.organizer_name} et convida a</span>
          <h1 className="font-display text-[25px] font-bold leading-tight">{ev.title}</h1>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 px-5 pt-4">
        <p className="flex items-center gap-2.5 text-[15px]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f766e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          {formatWhen(ev.starts_at)}
        </p>
        {ev.location && (
          <p className="flex items-center gap-2.5 text-[15px]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f766e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.location)}`} target="_blank" rel="noopener noreferrer" className="text-brand underline">
              {ev.location}
            </a>
          </p>
        )}
        {ev.description && <p className="whitespace-pre-line text-[15px] leading-relaxed text-stone-700">{ev.description}</p>}
        {ev.surprise && (
          <p className="rounded-xl bg-warm-soft px-3 py-2.5 text-[13px] leading-snug text-[#7c2d12]">És una sorpresa: no en diguis res a l&apos;homenatjat!</p>
        )}
      </div>

      <section className="flex flex-col gap-3 px-5 pt-6">
        <h2 className="text-[15px] font-semibold">Hi vens?</h2>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-[13px] font-semibold text-stone-700">El teu nom</label>
          <input id="name" className={inputClass} placeholder="Com et diuen?" value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} maxLength={60} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              aria-pressed={status === o.id}
              disabled={saving}
              onClick={() => answer(o.id)}
              className={`h-[52px] rounded-2xl border text-[15px] font-semibold transition-colors ${
                status === o.id ? "border-brand bg-brand text-white" : "border-line bg-white text-ink hover:border-brand"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        {status === "si" && (
          <div className="flex items-center justify-between">
            <span className="text-[15px]">Acompanyants</span>
            <span className="flex items-center gap-3.5">
              <button type="button" aria-label="Menys acompanyants" onClick={() => changeCompanions(-1)} className="h-11 w-11 rounded-full border border-line text-xl">−</button>
              <span className="min-w-4 text-center font-display text-xl font-bold">{companions}</span>
              <button type="button" aria-label="Més acompanyants" onClick={() => changeCompanions(1)} className="h-11 w-11 rounded-full border border-line text-xl">+</button>
            </span>
          </div>
        )}

        {error && <p role="alert" className="rounded-xl bg-warm-soft px-3.5 py-2.5 text-sm text-warm-ink">{error}</p>}
        {saved && status && !error && (
          <p role="status" className="rounded-xl bg-brand-soft px-3.5 py-3 text-sm text-[#134e4a]">{thanks[status]}</p>
        )}
        <p className="text-[13px] text-muted">
          {ev.counts.si} {ev.counts.si === 1 ? "persona hi va" : "persones hi van"}
          {ev.counts.potser > 0 && ` · ${ev.counts.potser} potser`}
        </p>
      </section>

      {ev.announcements.length > 0 && (
        <section className="flex flex-col gap-2 px-5 pt-6">
          <SectionTitle>Avisos de {ev.organizer_name}</SectionTitle>
          {ev.announcements.map((a) => (
            <Card key={a.id} className="bg-ground py-3 shadow-none">
              <p className="text-[15px] leading-snug">{a.body}</p>
              <p className="mt-1 text-xs text-muted">{timeAgo(a.created_at)}</p>
            </Card>
          ))}
        </section>
      )}

      {ev.tasks.length > 0 && (
        <section className="flex flex-col gap-2 px-5 pt-6">
          <SectionTitle>Qui porta què</SectionTitle>
          <div className="divide-y divide-white rounded-2xl bg-ground">
            {ev.tasks.map((t) => (
              <div key={t.id} className="flex min-h-[60px] items-center justify-between gap-3 px-4 py-2.5">
                <span className="flex flex-col">
                  <span className="text-[15px] font-semibold">{t.title}</span>
                  <span className="text-[13px] text-muted">
                    {t.assignee ? (t.assignee.toLowerCase() === myName ? "Ho portes tu" : `Ho porta ${t.assignee}`) : "Encara ningú"}
                  </span>
                </span>
                {!t.assignee && (
                  <button type="button" onClick={() => claim(t.id)} className="h-10 shrink-0 rounded-full bg-brand px-3.5 text-[13px] font-semibold text-white hover:bg-brand-dark">
                    M&apos;hi apunto
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="px-5 pt-8 text-center text-xs text-muted">Fet amb Quedem · sense grups de WhatsApp</p>
    </main>
  );
}
