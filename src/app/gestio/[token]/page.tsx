"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { BackLink, Card, Loading, SectionTitle, SurpriseBadge, inputClass } from "@/components/ui";
import { formatWhen, timeAgo } from "@/lib/format";
import { local } from "@/lib/local";
import { supabase, type EventData } from "@/lib/supabase";

const statusLabel = { si: "Hi va", potser: "Potser", no: "No pot" } as const;

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <Manage />
    </Suspense>
  );
}

function Manage() {
  const { token } = useParams<{ token: string }>();
  const isNew = useSearchParams().get("nou") === "1";
  const [ev, setEv] = useState<EventData | null | undefined>(undefined);
  const [notice, setNotice] = useState("");
  const [task, setTask] = useState("");
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.rpc("get_event_admin", { p_admin_token: token });
    setEv((data as EventData) ?? null);
    if (data) local.saveMyEvent({ slug: data.slug, admin_token: token, title: data.title, starts_at: data.starts_at });
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  if (ev === undefined) return <Loading />;
  if (ev === null)
    return (
      <main className="p-8 text-center">
        <p className="font-semibold">No hem trobat aquest esdeveniment.</p>
        <Link href="/" className="mt-3 inline-block text-brand underline">Tornar a l&apos;inici</Link>
      </main>
    );

  // L'enllaç sempre apunta al domini públic, encara que l'organitzador hagi entrat per un altre
  const origin = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "");
  const inviteUrl = `${origin}/e/${ev.slug}`;
  const shareText = `${ev.organizer_name} et convida a: ${ev.title} (${formatWhen(ev.starts_at)}). Digues si hi vens aquí: ${inviteUrl}`;

  async function sendNotice(e: React.FormEvent) {
    e.preventDefault();
    if (!notice.trim()) return;
    await supabase.rpc("add_announcement", { p_admin_token: token, p_body: notice });
    setNotice("");
    load();
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!task.trim()) return;
    await supabase.rpc("add_task", { p_admin_token: token, p_title: task });
    setTask("");
    load();
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* sense permís */
    }
  }

  const pending = ev.tasks.filter((t) => !t.assignee).length;

  return (
    <main className="pb-10">
      <header className="flex flex-col gap-2.5 bg-brand px-5 pb-5 pt-12 text-white">
        <div className="flex items-center justify-between">
          <BackLink href="/" />
          {ev.surprise && <SurpriseBadge />}
        </div>
        <h1 className="font-display text-[26px] font-bold leading-tight">{ev.title}</h1>
        <p className="text-sm text-white/90">
          {formatWhen(ev.starts_at)}
          {ev.location ? ` · ${ev.location}` : ""}
        </p>
        <div className="mt-1.5 grid grid-cols-3 gap-2">
          <Stat n={ev.counts.si} label="hi van" />
          <Stat n={ev.counts.potser} label="potser" />
          <Stat n={ev.counts.no} label="no poden" />
        </div>
        {ev.counts.persones > ev.counts.si && (
          <p className="text-[13px] text-white/90">{ev.counts.persones} persones en total, comptant acompanyants</p>
        )}
      </header>

      <div className="flex flex-col gap-4 px-5 pt-4">
        {isNew && (
          <Card className="bg-brand-soft text-[#134e4a] shadow-none">
            <p className="font-semibold">Esdeveniment creat!</p>
            <p className="mt-1 text-sm leading-relaxed">
              Ara envia l&apos;enllaç als convidats. Aquesta pàgina és només teva: guarda-la, perquè qui la tingui pot gestionar l&apos;esdeveniment.
            </p>
          </Card>
        )}

        <div className="flex flex-col gap-2">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-ink text-[15px] font-semibold text-white hover:bg-black"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v14" />
            </svg>
            Enviar la invitació per WhatsApp
          </a>
          <div className="flex items-center justify-center gap-3 text-sm">
            <button type="button" onClick={copy} className="font-semibold text-brand hover:underline">
              {copied ? "Enllaç copiat!" : "Copiar l'enllaç"}
            </button>
            <span className="text-line" aria-hidden="true">|</span>
            <Link href={`/e/${ev.slug}`} className="font-semibold text-brand hover:underline">Veure-ho com un convidat</Link>
          </div>
        </div>

        <section className="flex flex-col gap-2">
          <SectionTitle>Avisos</SectionTitle>
          <form onSubmit={sendNotice} className="flex gap-2">
            <label htmlFor="notice" className="sr-only">Nou avís</label>
            <input id="notice" className={inputClass} placeholder="Ex: hem canviat l'hora a les 21:30" value={notice} onChange={(e) => setNotice(e.target.value)} maxLength={1000} />
            <button type="submit" className="h-12 shrink-0 rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark">Enviar</button>
          </form>
          {ev.announcements.map((a) => (
            <Card key={a.id} className="py-3">
              <p className="text-[15px] leading-snug">{a.body}</p>
              <p className="mt-1 text-xs text-muted">{timeAgo(a.created_at)}</p>
            </Card>
          ))}
        </section>

        <section className="flex flex-col gap-2">
          <SectionTitle>Tasques {ev.tasks.length > 0 && `· ${pending} sense ningú`}</SectionTitle>
          <form onSubmit={addTask} className="flex gap-2">
            <label htmlFor="task" className="sr-only">Nova tasca</label>
            <input id="task" className={inputClass} placeholder="Ex: portar el pastís" value={task} onChange={(e) => setTask(e.target.value)} maxLength={120} />
            <button type="submit" className="h-12 shrink-0 rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark">Afegir</button>
          </form>
          {ev.tasks.length > 0 && (
            <div className="divide-y divide-ground rounded-2xl bg-white">
              {ev.tasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="text-[15px] font-medium">{t.title}</span>
                  <span className={`text-[13px] ${t.assignee ? "text-brand" : "text-muted"}`}>{t.assignee ?? "Encara ningú"}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-2">
          <SectionTitle>Qui ha respost ({ev.guests?.length ?? 0})</SectionTitle>
          {ev.guests?.length ? (
            <div className="divide-y divide-ground rounded-2xl bg-white">
              {ev.guests.map((g, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3">
                  <span className="text-[15px]">
                    {g.name}
                    {g.companions > 0 && <span className="text-muted"> +{g.companions}</span>}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      g.status === "si" ? "bg-brand-soft text-[#134e4a]" : g.status === "potser" ? "bg-warm-soft text-warm-ink" : "bg-ground text-muted"
                    }`}
                  >
                    {statusLabel[g.status]}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Encara no ha respost ningú. Envia l&apos;enllaç!</p>
          )}
        </section>
      </div>
    </main>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl bg-white/15 p-2.5">
      <span className="font-display text-[22px] font-bold">{n}</span>
      <span className="text-xs">{label}</span>
    </div>
  );
}
