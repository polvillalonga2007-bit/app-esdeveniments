/** URL d'Unsplash amb mida i format adequats. Els ids són "photo-...". */
export function unsplash(id: string, w: number, h?: number) {
  const p = new URLSearchParams({ auto: "format", fit: "crop", w: String(w), q: "72" });
  if (h) p.set("h", String(h));
  return `https://images.unsplash.com/${id}?${p.toString()}`;
}

export function srcSet(src: string, widths = [640, 960, 1400, 2000]) {
  if (!src.startsWith("photo-")) return undefined;
  return widths.map((w) => `${unsplash(src, w)} ${w}w`).join(", ");
}

export function photoUrl(src: string, w = 1400) {
  return src.startsWith("photo-") ? unsplash(src, w) : src;
}
