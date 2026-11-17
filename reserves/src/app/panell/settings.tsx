"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ErrorBox, Field, inputClass, primaryButton, secondaryButton } from "@/components/ui";
import { errorText, rpc, type Business } from "@/lib/supabase";
import { session } from "@/lib/session";

export function Settings({ token, business, onChange }: { token: string; business: Business; onChange: () => void }) {
  const router = useRouter();
  const [f, setF] = useState({
    name: business.name, phone: business.phone ?? "", address: business.address ?? "",
    description: business.description ?? "", capacity: business.capacity ?? 1, slot_step: business.slot_step ?? 15,
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await rpc("rs_update_business", {
        p_token: token, p_name: f.name, p_phone: f.phone, p_address: f.address,
        p_description: f.description, p_capacity: f.capacity, p_slot_step: f.slot_step,
      });
      setMsg("Desat");
      onChange();
    } catch (err) {
      setError(errorText(err));
    }
    setBusy(false);
  }

  async function logout() {
    try {
      await rpc("rs_logout", { p_token: token });
    } catch {}
    session.clear();
    router.replace("/");
  }

  const change = (patch: Partial<typeof f>) => {
    setF({ ...f, ...patch });
    setMsg("");
  };

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <Field label="Nom del negoci">
        <input required maxLength={80} value={f.name} onChange={(e) => change({ name: e.target.value })} className={inputClass} />
      </Field>
      <Field label="Telèfon">
        <input type="tel" maxLength={30} value={f.phone} onChange={(e) => change({ phone: e.target.value })} className={inputClass} />
      </Field>
      <Field label="Adreça">
        <input maxLength={200} value={f.address} onChange={(e) => change({ address: e.target.value })} className={inputClass} placeholder="Carrer Major 10, Manresa" />
      </Field>
      <Field label="Descripció curta" hint="Surt a dalt de la teva pàgina de reserves.">
        <textarea maxLength={500} rows={3} value={f.description} onChange={(e) => change({ description: e.target.value })} className={`${inputClass} h-auto py-3`} />
      </Field>
      <Field label="Quantes persones podeu atendre alhora?" hint="Si sou dues perruqueres, posa 2: s'acceptaran dues reserves a la mateixa hora.">
        <select value={f.capacity} onChange={(e) => change({ capacity: Number(e.target.value) })} className={inputClass}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </Field>
      <Field label="Cada quant poden començar les reserves?">
        <select value={f.slot_step} onChange={(e) => change({ slot_step: Number(e.target.value) })} className={inputClass}>
          {[10, 15, 20, 30, 60].map((n) => <option key={n} value={n}>Cada {n} minuts</option>)}
        </select>
      </Field>
      <ErrorBox>{error}</ErrorBox>
      <button disabled={busy} className={primaryButton}>{busy ? "Desant…" : msg || "Desar canvis"}</button>
      <p className="pt-4 text-center text-sm text-muted">Has entrat com a {business.email}</p>
      <button type="button" onClick={logout} className={secondaryButton}>Tancar sessió</button>
    </form>
  );
}
