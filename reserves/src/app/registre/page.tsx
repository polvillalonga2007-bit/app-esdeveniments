"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { BackLink, ErrorBox, Field, inputClass, primaryButton } from "@/components/ui";
import { errorText, rpc } from "@/lib/supabase";
import { session } from "@/lib/session";

export default function Register() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await rpc<{ token: string }>("rs_register", {
        p_name: form.name, p_email: form.email, p_password: form.password, p_phone: form.phone,
      });
      session.set(r.token);
      router.push("/panell?nou=1");
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }

  return (
    <main className="px-5 pb-10 pt-4">
      <BackLink href="/" />
      <h1 className="mt-2 font-display text-[28px] font-bold tracking-tight">Crea el teu negoci</h1>
      <p className="mt-1 text-muted">En dos minuts tindràs la teva pàgina de reserves.</p>
      <form onSubmit={submit} className="mt-7 flex flex-col gap-4">
        <Field label="Nom del negoci">
          <input required maxLength={80} value={form.name} onChange={set("name")} className={inputClass} placeholder="Perruqueria Montse" />
        </Field>
        <Field label="Correu electrònic" hint="El faràs servir per entrar.">
          <input required type="email" autoComplete="email" value={form.email} onChange={set("email")} className={inputClass} />
        </Field>
        <Field label="Telèfon del negoci" hint="Opcional. Els clients el veuran per si volen trucar.">
          <input type="tel" maxLength={30} value={form.phone} onChange={set("phone")} className={inputClass} placeholder="93 000 00 00" />
        </Field>
        <Field label="Contrasenya" hint="Mínim 6 caràcters.">
          <input required type="password" minLength={6} autoComplete="new-password" value={form.password} onChange={set("password")} className={inputClass} />
        </Field>
        <ErrorBox>{error}</ErrorBox>
        <button disabled={busy} className={`${primaryButton} mt-2`}>{busy ? "Creant…" : "Crear negoci"}</button>
        <p className="text-center text-sm text-muted">
          Ja tens compte? <Link href="/entrar" className="font-semibold text-brand">Entra</Link>
        </p>
      </form>
    </main>
  );
}
