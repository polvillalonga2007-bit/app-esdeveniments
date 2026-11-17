"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { BackLink, ErrorBox, Field, inputClass, primaryButton } from "@/components/ui";
import { errorText, rpc } from "@/lib/supabase";
import { session } from "@/lib/session";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await rpc<{ token: string }>("rs_login", { p_email: email, p_password: password });
      session.set(r.token);
      router.push("/panell");
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }

  return (
    <main className="px-5 pb-10 pt-4">
      <BackLink href="/" />
      <h1 className="mt-2 font-display text-[28px] font-bold tracking-tight">Entra al teu negoci</h1>
      <form onSubmit={submit} className="mt-7 flex flex-col gap-4">
        <Field label="Correu electrònic">
          <input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Contrasenya">
          <input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
        </Field>
        <ErrorBox>{error}</ErrorBox>
        <button disabled={busy} className={`${primaryButton} mt-2`}>{busy ? "Entrant…" : "Entrar"}</button>
        <p className="text-center text-sm text-muted">
          Encara no tens compte? <Link href="/registre" className="font-semibold text-brand">Crea&apos;l</Link>
        </p>
      </form>
    </main>
  );
}
