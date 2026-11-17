import {
  Inter, Manrope, Fraunces, Instrument_Serif, Newsreader, Bodoni_Moda, Syne,
  Playfair_Display, DM_Serif_Display, Bricolage_Grotesque,
} from "next/font/google";

export const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--f-inter" });
export const manrope = Manrope({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-manrope" });
export const fraunces = Fraunces({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-fraunces", axes: ["opsz", "SOFT"] });
export const instrument = Instrument_Serif({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-instrument", weight: "400", style: ["normal", "italic"] });
export const newsreader = Newsreader({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-newsreader", style: ["normal", "italic"] });
export const bodoni = Bodoni_Moda({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-bodoni", style: ["normal", "italic"] });
export const syne = Syne({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-syne" });
export const playfair = Playfair_Display({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-playfair", style: ["normal", "italic"] });
export const dmserif = DM_Serif_Display({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-dmserif", weight: "400", style: ["normal", "italic"] });
export const bricolage = Bricolage_Grotesque({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-bricolage" });

export const fontVars = [inter, manrope, fraunces, instrument, newsreader, bodoni, syne, playfair, dmserif, bricolage]
  .map((f) => f.variable)
  .join(" ");
