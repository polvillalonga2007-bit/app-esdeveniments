"use client";

import { useState } from "react";
import { Card, ErrorBox, Field, inputClass, primaryButton, secondaryButton } from "@/components/ui";
import { formatDuration, formatPrice } from "@/lib/format";
import { errorText, rpc, type Service } from "@/lib/supabase";

const DURATIONS = [10, 15, 20, 30, 45, 60, 75, 90, 120, 150, 180, 240];

type Draft = { id: string | null; name: string; duration_min: number; price: string; active: boolean };

const empty: Draft = { id: null, name: "", duration_min: 30, price: "", active: true };

export function Services({ token, services, onChange }: { token: string; services: Service[]; onChange: () => void }) {
  const [draft, setDraft] = useState<Draft | null>(services.length ? null : empty);

  return (
    <div className="flex flex-col gap-3">
      {services.map((s) =>
        draft?.id === s.id ? (
          <ServiceForm key={s.id} token={token} draft={draft} setDraft={setDraft} onSaved={onChange} />
        ) : (
          <button
            key={s.id}
            onClick={() => setDraft({ id: s.id, name: s.name, duration_min: s.duration_min, price: s.price_cents == null ? "" : String(s.price_cents / 100).replace(".", ","), active: s.active ?? true })}
            className="text-left"
          >
            <Card className={`flex items-center justify-between gap-3 ${s.active ? "" : "opacity-55"}`}>
              <div>
                <p className="font-semibold">{s.name}</p>
                <p className="text-sm text-muted">
                  {formatDuration(s.duration_min)}
                  {s.price_cents != null && ` · ${formatPrice(s.price_cents)}`}
                  {!s.active && " · amagat"}
                </p>
              </div>
              <span className="text-sm font-semibold text-brand">Editar</span>
            </Card>
          </button>
        ),
      )}

      {draft && draft.id === null ? (
        <ServiceForm token={token} draft={draft} setDraft={setDraft} onSaved={onChange} />
      ) : (
        <button onClick={() => setDraft(empty)} className={secondaryButton}>+ Afegir servei</button>
      )}
    </div>
  );
}

function ServiceForm({ token, draft, setDraft, onSaved }: {
  token: string; draft: Draft; setDraft: (d: Draft | null) => void; onSaved: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const priceNum = draft.price.trim() ? Number(draft.price.replace(",", ".")) : null;
    if (priceNum != null && (isNaN(priceNum) || priceNum < 0)) {
      setError("El preu no és vàlid.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await rpc("rs_save_service", {
        p_token: token, p_id: draft.id, p_name: draft.name, p_duration_min: draft.duration_min,
        p_price_cents: priceNum == null ? null : Math.round(priceNum * 100), p_active: draft.active,
      });
      setDraft(null);
      onSaved();
    } catch (err) {
      setError(errorText(err));
    }
    setBusy(false);
  }

  async function remove() {
    if (!draft.id) return;
    setBusy(true);
    try {
      await rpc("rs_delete_service", { p_token: token, p_id: draft.id });
      setDraft(null);
      onSaved();
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }

  return (
    <Card className="border-brand/40">
      <form onSubmit={save} className="flex flex-col gap-3.5">
        <Field label="Nom del servei">
          <input required autoFocus maxLength={80} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={inputClass} placeholder="Tall i rentat" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Durada">
            <select value={draft.duration_min} onChange={(e) => setDraft({ ...draft, duration_min: Number(e.target.value) })} className={inputClass}>
              {DURATIONS.map((d) => <option key={d} value={d}>{formatDuration(d)}</option>)}
            </select>
          </Field>
          <Field label="Preu (€)">
            <input inputMode="decimal" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} className={inputClass} placeholder="Opcional" />
          </Field>
        </div>
        {draft.id && (
          <label className="flex items-center gap-2.5 text-[15px]">
            <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} className="h-5 w-5 accent-brand" />
            Visible per als clients
          </label>
        )}
        <ErrorBox>{error}</ErrorBox>
        <button disabled={busy} className={primaryButton}>{busy ? "Desant…" : "Desar"}</button>
        <div className="flex justify-between">
          <button type="button" onClick={() => setDraft(null)} className="px-1 py-2 text-sm font-semibold text-muted">Cancel·lar</button>
          {draft.id && <button type="button" onClick={remove} className="px-1 py-2 text-sm font-semibold text-bad">Esborrar servei</button>}
        </div>
      </form>
    </Card>
  );
}
