export type Sector = "salut" | "bellesa" | "restauracio";

/** Franges d'obertura d'un dia, en hora local ("09:00"). Llista buida = tancat. */
export type DayHours = { open: string; close: string }[];

export type Service = { name: string; description?: string; price?: string; duration?: string };

export type MenuSection = { title: string; items: { name: string; description?: string; price: string }[] };

export type Photo = { src: string; alt: string; credit?: string };

export type Variant = {
  /** Composició (portada i ordre de seccions): 0, 1 o 2 */
  layout: number;
  /** Paleta de colors del sector: 0-3 */
  palette: number;
  /** Parella de tipografies del sector: 0-3 */
  type: number;
};

export type Business = {
  slug: string;
  name: string;
  sector: Sector;
  /** Què és, en una línia (va al títol gran) */
  headline: string;
  /** Una o dues frases sota el títol */
  intro: string;
  /** Un fet concret per a la portada (anys, especialitat...) */
  fact: string;
  town: string;
  /** Carrer sense número */
  street: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  /** dilluns = 0 ... diumenge = 6 */
  hours: DayHours[];
  services: Service[];
  menu?: MenuSection[];
  /** 3 punts: com treballem / per què nosaltres */
  steps: { title: string; text: string }[];
  /** Frase llarga per al moment tipogràfic */
  statement: string;
  notice?: { title: string; text: string };
  photos: { hero: Photo; steps: Photo[]; gallery: Photo[] };
  heroVideo?: string;
  team?: { name: string; role: string; text?: string; photo?: Photo }[];
  reviews?: { rating: number; count: number; items: { text: string; author: string; when?: string }[] };
  offers?: { title: string; text: string; price?: string; tag?: string }[];
  faq?: { q: string; a: string }[];
  legal: { owner: string; nif: string; address: string };
  variant: Variant;
  demo: boolean;
};
