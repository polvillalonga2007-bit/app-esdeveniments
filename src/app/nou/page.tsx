"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BackLink, inputClass, primaryButton } from "@/components/ui";
import { local } from "@/lib/local";
import { supabase } from "@/lib/supabase";

function Toggle({ on, onChange, title, hint }: { on: boolean; onChange: (v: boolean) => void; title: string; hint: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left">
      <span className="flex flex-col gap-0.5">
        <span className="text-[15px] font-semibold">{title}</span>
        <span className="text-[13px] text-muted">{hint}</span>
      </span>
      <span className={`flex h-[30px] w-[50px] shrink-0 items-center rounded-full p-[3px] transition-colors ${on ? "justify-end bg-brand" : "justify-start bg-line"}`}>
        <span className="h-6 w-6 rounded-full bg-white shadow" />
      </span>
    </button>
  );
}

export default function NewEvent() {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", date: "", time: "21:00", location: "", description: "", organizer: "" });
  const [surprise, setSurprise] = useState(false);
  const [reminder, setReminder] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const n = local.name();
    if (n) setForm((f) => ({ ...f, organizer: n }));
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.title.trim() || !form.date || !form.organizer.trim()) {
      setError("Falten el nom de l'esdeveniment, el dia o el teu nom.");
      return;
    }
    setSaving(true);
    const startsAt = new Date(`${form.date}T${form.time || "00:00"}`).toISOString();
    const { data, error } = await supabase.rpc("create_event", {
      p_title: form.title,
      p_starts_at: startsAt,
      p_location: form.location,
      p_description: form.description,
      p_organizer_name: form.organizer,
      p_surprise: surprise,
      p_reminder: reminder,
    });
    if (error || !data) {
      setSaving(false);
      setError("No s'ha pogut crear. Torna-ho a provar.");
      return;
    }
    local.saveName(form.organizer.trim());
    local.saveMyEvent({ slug: data.slug, admin_token: data.admin_token, title: form.title.trim(), starts_at: startsAt });
    router.push(`/gestio/${data.admin_token}?nou=1`);
  }

  return (
    <main className="flex min-h-dvh flex-col">
      <header className="flex items-center gap-2 px-5 pb-2 pt-12">
        <BackLink href="/" />
        <h1 className="font-display text-2xl font-bold">Nou esdeveniment</h1>
      </header>

      <form onSubmit={submit} className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col gap-3.5 px-5 py-2">
          <Field id="title" label="Què celebreu?">
            <input id="title" className={inputClass} placeholder="Aniversari de la Marta" value={form.title} onChange={set("title")} maxLength={120} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field id="date" label="Dia">
              <input id="date" type="date" className={inputClass} value={form.date} onChange={set("date")} />
            </Field>
            <Field id="time" label="Hora">
              <input id="time" type="time" className={inputClass} value={form.time} onChange={set("time")} />
            </Field>
          </div>
          <Field id="location" label="On?">
            <input id="location" className={inputClass} placeholder="Restaurant, casa, parc…" value={form.location} onChange={set("location")} maxLength={200} />
          </Field>
          <Field id="description" label="Detalls per als convidats">
            <textarea id="description" rows={3} className={`${inputClass} h-auto resize-none py-3 leading-snug`} placeholder="Què cal saber? Què s'ha de portar?" value={form.description} onChange={set("description")} maxLength={2000} />
          </Field>
          <Field id="organizer" label="El teu nom">
            <input id="organizer" className={inputClass} placeholder="Com et diuen?" value={form.organizer} onChange={set("organizer")} maxLength={60} />
          </Field>

          <div className="divide-y divide-ground rounded-2xl bg-white">
            <Toggle on={surprise} onChange={setSurprise} title="Mode sorpresa" hint="Recorda als convidats que no diguin res" />
            <Toggle on={reminder} onChange={setReminder} title="Recordatori automàtic" hint="Uns dies abans de l'esdeveniment" />
          </div>

          {error && <p role="alert" className="rounded-xl bg-warm-soft px-3.5 py-2.5 text-sm text-warm-ink">{error}</p>}
        </div>

        <div className="px-5 pb-9 pt-4">
          <button type="submit" disabled={saving} className={primaryButton}>
            {saving ? "Creant…" : "Crear i convidar"}
          </button>
        </div>
      </form>
    </main>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-stone-700">{label}</label>
      {children}
    </div>
  );
}
