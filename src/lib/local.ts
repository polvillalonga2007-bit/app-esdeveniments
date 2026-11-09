// Dades que es guarden només al navegador de cada persona.
// (Més endavant, quan hi hagi comptes d'usuari, això anirà a la base de dades.)

export type MyEvent = { slug: string; admin_token: string; title: string; starts_at: string };

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* navegació privada: no passa res */
  }
}

export const local = {
  myEvents: () => read<MyEvent[]>("quedem:events", []),
  saveMyEvent(e: MyEvent) {
    const list = local.myEvents().filter((x) => x.slug !== e.slug);
    write("quedem:events", [e, ...list]);
  },
  guestToken: (slug: string) => read<string | null>(`quedem:guest:${slug}`, null),
  saveGuestToken: (slug: string, token: string) => write(`quedem:guest:${slug}`, token),
  name: () => read<string>("quedem:name", ""),
  saveName: (name: string) => write("quedem:name", name),
};
