import type { Business, Variant } from "./types";
import { clampVariant } from "./themes";

export type SP = Record<string, string | string[] | undefined>;

/** Llegeix ?l=&p=&t= per provar combinacions a la visita. */
export function variantFrom(b: Business, sp: SP): Variant {
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]?.[0] : sp[k]);
  return clampVariant(b.sector, { layout: one("l") as unknown as number, palette: one("p") as unknown as number, type: one("t") as unknown as number }, b.variant);
}
