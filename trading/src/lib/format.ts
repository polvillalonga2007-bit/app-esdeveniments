// Tots els imports de l'app es guarden en euros. Aquí es mostren en la moneda triada (dòlars o euros).
export type Currency = "USD" | "EUR";

const fmts: Record<"EUR", { big: Intl.NumberFormat; small: Intl.NumberFormat }> = {
  EUR: {
    big: new Intl.NumberFormat("ca-ES", { style: "currency", currency: "EUR" }),
    small: new Intl.NumberFormat("ca-ES", { style: "currency", currency: "EUR", maximumSignificantDigits: 4 }),
  },
};

// En català els dòlars surten com "100,00 USD"; els mostrem com "100,00 $".
function fmt(n: number, kind: "big" | "small"): string {
  const out = fmts.EUR[kind].format(n);
  return display.currency === "USD" ? out.replace("€", "$") : out;
}

let display: { currency: Currency; rate: number } = { currency: "EUR", rate: 1 };

// rate = quantes unitats de la moneda triada val 1 euro
export function setDisplayCurrency(currency: Currency, rate: number) {
  display = { currency, rate: currency === "EUR" ? 1 : rate };
}
export function displayCurrency() {
  return display;
}
export const toDisp = (eur: number) => eur * display.rate;
export const fromDisp = (v: number) => v / display.rate;
export const currencySymbol = () => (display.currency === "USD" ? "$" : "€");

// Import ja en la moneda triada (sense convertir)
export function moneyRaw(n: number): string {
  return fmt(n, "big");
}

export function money(eurAmount: number): string {
  return fmt(toDisp(eurAmount), "big");
}

// Preu d'una unitat: les cripto barates necessiten més decimals
export function price(eurAmount: number): string {
  const v = toDisp(eurAmount);
  if (Math.abs(v) > 0 && Math.abs(v) < 1) return fmt(v, "small");
  return fmt(v, "big");
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

// Import en una moneda concreta (p. ex. el preu original d'una acció dels EUA)
export function nativeMoney(n: number, cur: string): string {
  if (cur === "USD" || cur === "EUR") return fmts.EUR.big.format(n).replace("€", cur === "USD" ? "$" : "€");
  return n.toLocaleString("ca-ES", { style: "currency", currency: cur });
}
