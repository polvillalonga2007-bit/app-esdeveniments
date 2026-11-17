import type { Sector, Variant } from "./types";

export type Palette = { name: string; bg: string; surface: string; ink: string; muted: string; accent: string; onAccent: string; dark?: boolean };
export type TypePair = { name: string; display: string; body: string; displayWeight: number; displayCase?: "upper"; tracking: string };

const P = (name: string, bg: string, surface: string, ink: string, muted: string, accent: string, onAccent = "#ffffff", dark = false): Palette =>
  ({ name, bg, surface, ink, muted, accent, onAccent, dark });

export const palettes: Record<Sector, Palette[]> = {
  salut: [
    P("Sàlvia", "#F4F1EA", "#E6E2D5", "#1E2A24", "#56635B", "#2F6B4F"),
    P("Aigua", "#F2F5F6", "#DFE8EA", "#13262E", "#4F646C", "#1F6F8B"),
    P("Argila", "#F6F0E9", "#E9DDCF", "#2A211B", "#6A5B4F", "#A55A35"),
    P("Tinta", "#FAFAF7", "#EAE9E2", "#111418", "#575D65", "#1D3A5F"),
  ],
  bellesa: [
    P("Os", "#F3EEE8", "#E6DCD0", "#1A1614", "#675C54", "#8C3B2E"),
    P("Negre", "#121110", "#1F1D1B", "#F2ECE4", "#A99F95", "#D9B48F", "#121110", true),
    P("Rosa pols", "#F5ECE8", "#EADAD2", "#2B1D1D", "#715D59", "#A8414F"),
    P("Oliva", "#EFEEE6", "#DFDDCE", "#1D1F17", "#5E614C", "#55612A"),
  ],
  restauracio: [
    P("Brasa", "#F5EFE4", "#E9DAC2", "#231A12", "#6B5A48", "#B0411D"),
    P("Vi", "#F4EEE9", "#E5D7CE", "#251417", "#6B5356", "#7A1F2B"),
    P("Mercat", "#F1F0E8", "#E0E2D2", "#18201A", "#566158", "#2E5E3A"),
    P("Fosc", "#17130F", "#241E18", "#F3EADD", "#B5A794", "#E0A458", "#17130F", true),
  ],
};

const T = (name: string, display: string, body: string, displayWeight: number, tracking = "-0.02em", displayCase?: "upper"): TypePair =>
  ({ name, display: `var(${display})`, body: `var(${body})`, displayWeight, tracking, displayCase });

export const typePairs: Record<Sector, TypePair[]> = {
  salut: [
    T("Fraunces + Inter", "--f-fraunces", "--f-inter", 400, "-0.025em"),
    T("Instrument + Manrope", "--f-instrument", "--f-manrope", 400, "-0.01em"),
    T("Manrope", "--f-manrope", "--f-manrope", 600, "-0.035em"),
    T("Newsreader + Inter", "--f-newsreader", "--f-inter", 400, "-0.02em"),
  ],
  bellesa: [
    T("Bodoni + Manrope", "--f-bodoni", "--f-manrope", 400, "-0.02em"),
    T("Syne + Inter", "--f-syne", "--f-inter", 700, "-0.03em", "upper"),
    T("Instrument + Inter", "--f-instrument", "--f-inter", 400, "-0.01em"),
    T("Playfair + Manrope", "--f-playfair", "--f-manrope", 400, "-0.02em"),
  ],
  restauracio: [
    T("Fraunces + Manrope", "--f-fraunces", "--f-manrope", 500, "-0.03em"),
    T("DM Serif + Inter", "--f-dmserif", "--f-inter", 400, "-0.015em"),
    T("Bricolage + Inter", "--f-bricolage", "--f-inter", 700, "-0.04em"),
    T("Syne + Manrope", "--f-syne", "--f-manrope", 700, "-0.03em", "upper"),
  ],
};

export function clampVariant(sector: Sector, v: Partial<Variant>, base: Variant): Variant {
  const n = (x: unknown, max: number, d: number) => {
    const i = Number(x);
    return Number.isInteger(i) && i >= 0 && i < max ? i : d;
  };
  return {
    layout: n(v.layout, 3, base.layout),
    palette: n(v.palette, palettes[sector].length, base.palette),
    type: n(v.type, typePairs[sector].length, base.type),
  };
}

export function themeStyle(sector: Sector, v: Variant): React.CSSProperties {
  const p = palettes[sector][v.palette];
  const t = typePairs[sector][v.type];
  return {
    ["--bg" as string]: p.bg,
    ["--surface" as string]: p.surface,
    ["--ink" as string]: p.ink,
    ["--muted" as string]: p.muted,
    ["--accent" as string]: p.accent,
    ["--on-accent" as string]: p.onAccent,
    ["--line" as string]: `color-mix(in oklab, ${p.ink} 14%, transparent)`,
    ["--font-display" as string]: t.display,
    ["--font-body" as string]: t.body,
    ["--display-weight" as string]: String(t.displayWeight),
    ["--display-tracking" as string]: t.tracking,
    ["--display-case" as string]: t.displayCase === "upper" ? "uppercase" : "none",
    colorScheme: p.dark ? "dark" : "light",
  };
}
