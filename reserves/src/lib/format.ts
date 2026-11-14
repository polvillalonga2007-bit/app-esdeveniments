export const TZ = "Europe/Madrid";

export const WEEKDAYS = ["Dilluns", "Dimarts", "Dimecres", "Dijous", "Divendres", "Dissabte", "Diumenge"];

export function formatTime(iso: string) {
  return new Intl.DateTimeFormat("ca-ES", { hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(new Date(iso));
}

export function formatDayLong(iso: string) {
  const s = new Intl.DateTimeFormat("ca-ES", { weekday: "long", day: "numeric", month: "long", timeZone: TZ }).format(new Date(iso));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatPrice(cents: number | null | undefined) {
  if (cents == null) return null;
  return new Intl.NumberFormat("ca-ES", { style: "currency", currency: "EUR", minimumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);
}

export function formatDuration(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** Data (YYYY-MM-DD) a l'hora de Barcelona */
export function dateKey(d: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

/** Els propers n dies a partir d'avui (hora de Barcelona) */
export function nextDays(n: number) {
  const out: { key: string; weekday: number; day: number; short: string; month: string }[] = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getTime() + i * 86400000);
    const key = dateKey(d);
    const noon = new Date(`${key}T12:00:00Z`);
    const jsDay = noon.getUTCDay(); // 0 = diumenge
    out.push({
      key,
      weekday: jsDay === 0 ? 7 : jsDay,
      day: noon.getUTCDate(),
      short: ["dg", "dl", "dt", "dc", "dj", "dv", "ds"][jsDay],
      month: new Intl.DateTimeFormat("ca-ES", { month: "short", timeZone: "UTC" }).format(noon).replace(".", ""),
    });
  }
  return out;
}

export function publicOrigin() {
  if (typeof window === "undefined") return "";
  const host = window.location.host;
  // Els dominis interns de Vercel (amb l'equip al nom) estan protegits; compartim sempre el públic.
  if (host.endsWith(".vercel.app") && host.includes("-polete1")) return "https://torn-reserves.vercel.app";
  return window.location.origin;
}
