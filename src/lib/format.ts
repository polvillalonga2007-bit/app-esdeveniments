const dateFmt = new Intl.DateTimeFormat("ca-ES", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Madrid",
});

export function formatWhen(iso: string) {
  const s = dateFmt.format(new Date(iso));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function timeAgo(iso: string) {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "ara mateix";
  if (min < 60) return `fa ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `fa ${h} h`;
  return `fa ${Math.round(h / 24)} dies`;
}
