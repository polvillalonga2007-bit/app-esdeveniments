import { demos } from "@/lib/demos";
import { palettes, typePairs } from "@/lib/themes";
import { photoUrl } from "@/lib/photo";

const sectorName = { salut: "Salut", bellesa: "Bellesa", restauracio: "Restauració" } as const;
const layoutName = {
  salut: ["Partida", "Marc ample", "Foto sencera"],
  bellesa: ["Editorial", "Mosaic", "Foto sencera"],
  restauracio: ["Foto sencera", "Partida", "Marc ample"],
} as const;

export default function Home() {
  return (
    <main className="studio">
      <header className="studio__head">
        <p className="studio__brand">Vora Digital</p>
        <h1>Webs de mostra per ensenyar a les visites</h1>
        <p>Tria un sector i una combinació. Cada web es pot veure amb 3 composicions, 4 paletes i 4 tipografies: 48 webs diferents per sector amb el mateix contingut.</p>
      </header>
      <div className="studio__list">
        {demos.map((d) => (
          <article key={d.slug} className="studio__card">
            <a href={`/s/${d.slug}`} className="studio__thumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrl(d.photos.hero.src, 900)} alt="" loading="lazy" />
              <span>{sectorName[d.sector]}</span>
            </a>
            <div className="studio__body">
              <h2><a href={`/s/${d.slug}`}>{d.name}</a></h2>
              <p className="studio__label">Composició</p>
              <div className="studio__chips">
                {layoutName[d.sector].map((n, i) => <a key={n} href={`/s/${d.slug}?l=${i}`}>{n}</a>)}
              </div>
              <p className="studio__label">Colors</p>
              <div className="studio__chips">
                {palettes[d.sector].map((p, i) => (
                  <a key={p.name} href={`/s/${d.slug}?p=${i}`}><i style={{ background: p.accent, boxShadow: `inset 0 0 0 4px ${p.bg}` }} />{p.name}</a>
                ))}
              </div>
              <p className="studio__label">Tipografia</p>
              <div className="studio__chips">
                {typePairs[d.sector].map((t, i) => <a key={t.name} href={`/s/${d.slug}?t=${i}`}>{t.name}</a>)}
              </div>
              <p className="studio__label">Combinació a l&apos;atzar</p>
              <div className="studio__chips">
                {[1, 2, 3].map((k) => {
                  const l = (k * 7 + d.slug.length) % 3, p = (k * 5 + 1) % 4, t = (k * 3 + 2) % 4;
                  return <a key={k} href={`/s/${d.slug}?l=${l}&p=${p}&t=${t}`}>Variant {k}</a>;
                })}
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
