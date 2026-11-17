import type { Business, Variant } from "@/lib/types";
import { themeStyle } from "@/lib/themes";
import { groupedHours } from "@/lib/hours";
import { Header, HeroMedia, HorizontalGallery, Img, OpenNow, PinnedChapters, WordHighlight } from "./motion";

type HeroKind = "split" | "frame" | "overlay" | "editorial" | "mosaic";
const heroBySector: Record<Business["sector"], HeroKind[]> = {
  salut: ["split", "frame", "overlay"],
  bellesa: ["editorial", "mosaic", "overlay"],
  restauracio: ["overlay", "split", "frame"],
};

const tel = (p: string) => `tel:${p.replace(/\s/g, "")}`;
const wa = (n: string, name: string) => `https://wa.me/${n}?text=${encodeURIComponent(`Hola ${name}, us escric des de la web.`)}`;
const maps = (b: Business) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${b.name}, ${b.street}, ${b.town}`)}`;

const mainAction = (b: Business) =>
  b.sector === "restauracio" ? { label: "Reserva taula", href: b.whatsapp ? wa(b.whatsapp, b.name) : tel(b.phone) }
  : { label: "Demana hora", href: b.whatsapp ? wa(b.whatsapp, b.name) : tel(b.phone) };

function Actions({ b }: { b: Business }) {
  const a = mainAction(b);
  return (
    <div className="actions">
      <a className="btn" href={a.href}>{a.label}</a>
      <a className="btn btn--ghost" href={tel(b.phone)}>Truca al {b.phone}</a>
    </div>
  );
}

function Hero({ b, kind }: { b: Business; kind: HeroKind }) {
  const text = (
    <div className="hero__text" data-enter>
      <p className="eyebrow">{b.fact}</p>
      <h1 className="display h1">{b.headline}</h1>
      <p className="lead">{b.intro}</p>
      <Actions b={b} />
      <OpenNow hours={b.hours} />
    </div>
  );
  if (kind === "overlay")
    return (
      <section id="inici" className="hero hero--overlay">
        <HeroMedia photo={b.photos.hero} video={b.heroVideo} className="hero--overlay__media" />
        <div className="wrap hero--overlay__inner">{text}</div>
      </section>
    );
  if (kind === "editorial")
    return (
      <section id="inici" className="hero hero--editorial">
        <div className="wrap">
          <p className="hero--editorial__name display" data-enter aria-hidden>{b.name}</p>
          <div className="hero--editorial__grid">
            {text}
            <HeroMedia photo={b.photos.hero} video={b.heroVideo} className="hero--editorial__media" />
          </div>
        </div>
      </section>
    );
  if (kind === "mosaic")
    return (
      <section id="inici" className="hero hero--mosaic">
        <div className="wrap hero--mosaic__grid">
          {text}
          <div className="mosaic" data-enter>
            <HeroMedia photo={b.photos.hero} video={b.heroVideo} className="mosaic__a" />
            <div className="mosaic__b frame"><Img photo={b.photos.gallery[0]} sizes="25vw" /></div>
            <div className="mosaic__c frame"><Img photo={b.photos.steps[2] ?? b.photos.gallery[1]} sizes="25vw" /></div>
          </div>
        </div>
      </section>
    );
  if (kind === "frame")
    return (
      <section id="inici" className="hero hero--frame">
        <div className="wrap">
          {text}
          <HeroMedia photo={b.photos.hero} video={b.heroVideo} className="hero--frame__media" />
        </div>
      </section>
    );
  return (
    <section id="inici" className="hero hero--split">
      <div className="wrap hero--split__grid">
        {text}
        <HeroMedia photo={b.photos.hero} video={b.heroVideo} className="hero--split__media" />
      </div>
    </section>
  );
}

function Notice({ b }: { b: Business }) {
  if (!b.notice) return null;
  return (
    <aside className="notice">
      <div className="wrap notice__inner">
        <strong>{b.notice.title}</strong>
        <span>{b.notice.text}</span>
      </div>
    </aside>
  );
}

function Services({ b }: { b: Business }) {
  if (b.menu?.length)
    return (
      <section id="serveis" className="section menu">
        <div className="wrap">
          <div className="section__head">
            <p className="eyebrow">La carta</p>
            <h2 className="display h2">Què hi ha a la brasa aquesta temporada</h2>
          </div>
          <div className="menu__cols">
            {b.menu.map((s) => (
              <div key={s.title} className="menu__group">
                <h3 className="display h3">{s.title}</h3>
                <ul>
                  {s.items.map((it) => (
                    <li key={it.name} className="leader">
                      <span className="leader__name">{it.name}{it.description ? <small> · {it.description}</small> : null}</span>
                      <span className="leader__dots" aria-hidden />
                      <span className="leader__price">{it.price}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  if (b.sector === "bellesa")
    return (
      <section id="serveis" className="section prices">
        <div className="wrap prices__grid">
          <div className="section__head">
            <p className="eyebrow">Serveis i preus</p>
            <h2 className="display h2">Tall, color i cura, amb preus clars</h2>
            <p className="muted">Els preus amb «desde» depenen de la llargada del cabell. T&apos;ho diem abans de començar.</p>
          </div>
          <ul className="prices__list">
            {b.services.map((s) => (
              <li key={s.name} className="leader">
                <span className="leader__name">{s.name}{s.description ? <small>{s.description}</small> : null}</span>
                <span className="leader__dots" aria-hidden />
                <span className="leader__price">{s.price}{s.duration ? <small>{s.duration}</small> : null}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    );
  return (
    <section id="serveis" className="section rows">
      <div className="wrap">
        <div className="section__head">
          <p className="eyebrow">Tractaments</p>
          <h2 className="display h2">Què podem fer per tu</h2>
        </div>
        <ul className="rows__list">
          {b.services.map((s, i) => (
            <li key={s.name} className="rows__item">
              <span className="rows__num">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="display h3">{s.name}</h3>
                {s.description ? <p className="muted">{s.description}</p> : null}
              </div>
              <p className="rows__meta">{[s.duration, s.price].filter(Boolean).join(" · ")}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Steps({ b, withPhotos }: { b: Business; withPhotos?: boolean }) {
  return (
    <section className="section steps">
      <div className="wrap">
        <div className="section__head">
          <p className="eyebrow">{b.sector === "restauracio" ? "D'on ve el que menges" : "Com treballem"}</p>
          <h2 className="display h2">{b.sector === "restauracio" ? "Tres coses que no canviem mai" : "Tres passos, cada vegada"}</h2>
        </div>
        <ol className="steps__grid">
          {b.steps.map((s, i) => (
            <li key={s.title} className="steps__item">
              {withPhotos && b.photos.steps[i] ? <div className="frame steps__photo"><Img photo={b.photos.steps[i]} sizes="(min-width: 900px) 33vw, 100vw" /></div> : null}
              <span className="steps__num">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="display h3">{s.title}</h3>
              <p className="muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Statement({ b }: { b: Business }) {
  return (
    <section className="section statement">
      <div className="wrap">
        <p className="statement__text display">{b.statement}</p>
      </div>
    </section>
  );
}

function Gallery({ b, from = 0 }: { b: Business; from?: number }) {
  const ph = b.photos.gallery.slice(from, from + 4);
  if (ph.length < 3) return null;
  return (
    <section className="section gallery" aria-label={`Fotos de ${b.name}`}>
      <div className="wrap gallery__grid">
        {ph.map((p, i) => (
          <div key={p.src} className={`frame gallery__item gallery__item--${i}`}><Img photo={p} sizes="(min-width: 900px) 50vw, 100vw" /></div>
        ))}
      </div>
    </section>
  );
}

function Visit({ b }: { b: Business }) {
  const a = mainAction(b);
  return (
    <section id="visita" className="section visit">
      <div className="wrap visit__grid">
        <div>
          <p className="eyebrow">Horari i adreça</p>
          <h2 className="display h2 visit__street">{b.street}, {b.town}</h2>
          <OpenNow hours={b.hours} className="status--big" />
          <div className="actions">
            <a className="btn" href={a.href}>{a.label}</a>
            <a className="btn btn--ghost" href={maps(b)} target="_blank" rel="noopener">Com arribar-hi</a>
          </div>
        </div>
        <dl className="hours">
          {groupedHours(b.hours).map((r) => (
            <div key={r.label} className="hours__row">
              <dt>{r.label}</dt>
              <dd>{r.value}</dd>
            </div>
          ))}
          <div className="hours__row hours__row--contact">
            <dt>Telèfon</dt>
            <dd><a className="link" href={tel(b.phone)}>{b.phone}</a></dd>
          </div>
          {b.email ? (
            <div className="hours__row hours__row--contact">
              <dt>Correu</dt>
              <dd><a className="link" href={`mailto:${b.email}`}>{b.email}</a></dd>
            </div>
          ) : null}
        </dl>
      </div>
    </section>
  );
}

function Footer({ b, base }: { b: Business; base: string }) {
  return (
    <footer className="footer">
      <div className="wrap footer__inner">
        <p className="display footer__name">{b.name}</p>
        <nav className="footer__links" aria-label="Legal">
          <a className="link" href={`${base}/avis-legal`}>Avís legal</a>
          <a className="link" href={`${base}/privacitat`}>Privacitat</a>
        </nav>
        <p className="footer__small">Fotos: Unsplash · Web feta per <a className="link" href="https://voradigital.cat">Vora Digital</a></p>
      </div>
    </footer>
  );
}

function MobileBar({ b }: { b: Business }) {
  const a = mainAction(b);
  return (
    <nav className="mobilebar" aria-label="Accions ràpides">
      <a href={tel(b.phone)}>Truca</a>
      {b.whatsapp ? <a href={wa(b.whatsapp, b.name)}>WhatsApp</a> : null}
      <a href={maps(b)} target="_blank" rel="noopener">Com arribar</a>
      <a href={a.href} className="mobilebar__main">{a.label}</a>
    </nav>
  );
}

export default function Site({ b, v, base }: { b: Business; v: Variant; base: string }) {
  const kind = heroBySector[b.sector][v.layout];
  const swap = v.layout === 1;
  let body: React.ReactNode;
  if (b.sector === "salut") {
    const parts = [
      <Services key="s" b={b} />,
      <PinnedChapters key="c" steps={b.steps} photos={b.photos.steps} label="Com treballem" />,
    ];
    body = <>{swap ? parts.reverse() : parts}<Statement b={b} /><Gallery b={b} /></>;
  } else if (b.sector === "bellesa") {
    const parts = [<Services key="s" b={b} />, <HorizontalGallery key="g" photos={b.photos.gallery} title="El saló, per dins" kicker="L'estudi" />];
    body = <>{swap ? parts.reverse() : parts}<Steps b={b} withPhotos /><Statement b={b} /></>;
  } else {
    const parts = [<Services key="s" b={b} />, <Steps key="st" b={b} withPhotos />];
    body = <>{swap ? parts.reverse() : parts}<WordHighlight text={b.statement} kicker="La casa" /><Gallery b={b} /></>;
  }
  return (
    <div className={`site site--${b.sector} hero-${kind}`} style={themeStyle(b.sector, v)} data-sector={b.sector}>
      <a href="#serveis" className="skip">Salta al contingut</a>
      {b.demo ? <div className="ribbon">Demo de Vora Digital · no és una web real</div> : null}
      <Header name={b.name} phone={b.phone} light={kind === "overlay"} />
      <main>
        <Hero b={b} kind={kind} />
        <Notice b={b} />
        {body}
        <Visit b={b} />
      </main>
      <Footer b={b} base={base} />
      <MobileBar b={b} />
    </div>
  );
}
