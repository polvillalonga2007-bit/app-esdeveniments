import type { DayHours } from "./types";

export const DAYS = ["Dilluns", "Dimarts", "Dimecres", "Dijous", "Divendres", "Dissabte", "Diumenge"];

export function formatDay(h: DayHours) {
  if (!h.length) return "Tancat";
  return h.map((r) => `${r.open}–${r.close}`).join(" · ");
}

/** Agrupa dies consecutius amb el mateix horari: "Dilluns – Divendres". */
export function groupedHours(hours: DayHours[]) {
  const out: { label: string; value: string }[] = [];
  let i = 0;
  while (i < 7) {
    const v = formatDay(hours[i] ?? []);
    let j = i;
    while (j + 1 < 7 && formatDay(hours[j + 1] ?? []) === v) j++;
    out.push({ label: j > i ? `${DAYS[i]} – ${DAYS[j]}` : DAYS[i], value: v });
    i = j + 1;
  }
  return out;
}

const toMin = (s: string) => {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
};

/** Estat ara mateix a l'hora de Catalunya. */
export function openStatus(hours: DayHours[], now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(now);
  const wd = parts.find((p) => p.type === "weekday")?.value ?? "Mon";
  const day = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(wd);
  const mins = Number(parts.find((p) => p.type === "hour")?.value) * 60 + Number(parts.find((p) => p.type === "minute")?.value);
  const today = hours[day] ?? [];
  for (const r of today) {
    if (mins >= toMin(r.open) && mins < toMin(r.close)) return { open: true, text: `Obert ara · fins a les ${r.close}` };
  }
  const later = today.find((r) => toMin(r.open) > mins);
  if (later) return { open: false, text: `Tancat ara · obrim a les ${later.open}` };
  for (let k = 1; k <= 7; k++) {
    const d = (day + k) % 7;
    const first = (hours[d] ?? [])[0];
    if (first) return { open: false, text: `Tancat ara · obrim ${k === 1 ? "demà" : DAYS[d].toLowerCase()} a les ${first.open}` };
  }
  return { open: false, text: "Tancat" };
}
