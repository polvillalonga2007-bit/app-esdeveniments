"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import { publicOrigin } from "@/lib/format";

export function ShareCard({ slug }: { slug: string }) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => setUrl(`${publicOrigin()}/r/${slug}`), [slug]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  const wa = `https://wa.me/?text=${encodeURIComponent(`Ja pots reservar hora aquí: ${url}`)}`;

  return (
    <Card>
      <p className="text-sm font-medium text-muted">El teu enllaç de reserves</p>
      <p className="mt-1 break-all font-semibold">{url.replace(/^https?:\/\//, "")}</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <button onClick={copy} className="h-10 rounded-xl bg-ink text-sm font-semibold text-white">{copied ? "Copiat!" : "Copiar"}</button>
        <a href={wa} target="_blank" rel="noreferrer" className="flex h-10 items-center justify-center rounded-xl border border-line text-sm font-semibold">WhatsApp</a>
        <a href={url} target="_blank" rel="noreferrer" className="flex h-10 items-center justify-center rounded-xl border border-line text-sm font-semibold">Veure</a>
      </div>
    </Card>
  );
}
