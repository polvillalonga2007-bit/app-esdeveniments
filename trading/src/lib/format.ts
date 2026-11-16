const eur = new Intl.NumberFormat("ca-ES", { style: "currency", currency: "EUR" });
const eurSmall = new Intl.NumberFormat("ca-ES", { style: "currency", currency: "EUR", maximumSignificantDigits: 4 });

export function money(n: number): string {
  return eur.format(n);
}

// Preu d'una unitat: les cripto barates necessiten més decimals
export function price(n: number): string {
  if (Math.abs(n) > 0 && Math.abs(n) < 1) return eurSmall.format(n);
  return eur.format(n);
}

export function signedMoney(n: number): string {
  const s = money(Math.abs(n));
  return n > 0.004 ? `+${s}` : n < -0.004 ? `−${s}` : s;
}

export function pct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "–";
  const v = Math.abs(n).toLocaleString("ca-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n > 0.004 ? `+${v} %` : n < -0.004 ? `−${v} %` : `${v} %`;
}

export function qty(n: number): string {
  return n.toLocaleString("ca-ES", { maximumFractionDigits: n < 1 ? 8 : n < 100 ? 4 : 2 });
}

export function dateTime(iso: string): string {
  return new Date(iso).toLocaleString("ca-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function tone(n: number | null | undefined): string {
  if (n == null || Math.abs(n) < 0.004) return "text-muted";
  return n > 0 ? "text-up" : "text-down";
}
