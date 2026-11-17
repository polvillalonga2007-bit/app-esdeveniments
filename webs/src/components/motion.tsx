"use client";

import { useEffect, useRef, useState } from "react";
import { photoUrl, srcSet } from "@/lib/photo";
import { openStatus } from "@/lib/hours";
import type { DayHours, Photo } from "@/lib/types";

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Escriu --p (0..1) a l'element segons quant s'ha recorregut de la secció. */
function useScrollVar<T extends HTMLElement>(mode: "through" | "leave" = "through", onP?: (p: number) => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced()) return;
    let raf = 0;
    const tick = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      let p: number;
      if (mode === "leave") p = Math.min(1, Math.max(0, -r.top / r.height));
      else p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - vh)));
      el.style.setProperty("--p", p.toFixed(4));
      onP?.(p);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(tick); };
    tick();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, [mode, onP]);
  return ref;
}

export function Img({ photo, className, sizes = "100vw", eager }: { photo: Photo; className?: string; sizes?: string; eager?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={photoUrl(photo.src)} srcSet={srcSet(photo.src)} sizes={sizes} alt={photo.alt} className={className}
      loading={eager ? "eager" : "lazy"} decoding="async" {...(eager ? { fetchPriority: "high" as const } : {})} />
  );
}

/** Foto o vídeo de portada: zoom lent en entrar i s'allunya en fer scroll. */
export function HeroMedia({ photo, video, className = "" }: { photo: Photo; video?: string; className?: string }) {
  const ref = useScrollVar<HTMLDivElement>("leave");
  return (
    <div ref={ref} className={`hero-media ${className}`}>
      {video ? (
        <video className="hero-media__el" autoPlay muted loop playsInline poster={photoUrl(photo.src, 1600)} aria-label={photo.alt}>
          <source src={video} type="video/mp4" />
        </video>
      ) : (
        <Img photo={photo} eager className="hero-media__el kenburns" />
      )}
    </div>
  );
}

/** Moment: capítols fixats. El text avança i la foto canvia amb un fos. */
export function PinnedChapters({ steps, photos, label }: { steps: { title: string; text: string }[]; photos: Photo[]; label: string }) {
  const [active, setActive] = useState(0);
  const ref = useScrollVar<HTMLElement>("through", (p) => setActive(Math.min(steps.length - 1, Math.floor(p * steps.length * 0.999))));
  return (
    <section ref={ref} className="chapters" style={{ ["--n" as string]: steps.length }} aria-label={label}>
      <div className="chapters__sticky wrap">
        <div className="chapters__text">
          <p className="eyebrow">{label}</p>
          <ol>
            {steps.map((s, i) => (
              <li key={s.title} className={i === active ? "is-active" : ""}>
                <span className="chapters__num">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="display">{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
          <div className="chapters__bar" aria-hidden><span /></div>
        </div>
        <div className="chapters__media">
          {photos.slice(0, steps.length).map((ph, i) => (
            <Img key={ph.src} photo={ph} sizes="(min-width: 900px) 50vw, 100vw" className={i === active ? "is-active" : ""} />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Moment: galeria que llisca en horitzontal mentre baixes. */
export function HorizontalGallery({ photos, title, kicker }: { photos: Photo[]; title: string; kicker: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [dist, setDist] = useState(0);
  const ref = useScrollVar<HTMLElement>("through");
  useEffect(() => {
    const m = () => { if (track.current) setDist(Math.max(0, track.current.scrollWidth - window.innerWidth)); };
    m();
    window.addEventListener("resize", m);
    return () => window.removeEventListener("resize", m);
  }, []);
  return (
    <section ref={ref} className="hgallery" style={{ ["--dist" as string]: `${dist}px`, height: `calc(100vh + ${dist}px)` }} aria-label={title}>
      <div className="hgallery__sticky">
        <div className="wrap hgallery__head">
          <p className="eyebrow">{kicker}</p>
          <h2 className="display h2">{title}</h2>
        </div>
        <div ref={track} className="hgallery__track">
          {photos.map((ph, i) => (
            <figure key={ph.src} className={`hgallery__item ${i % 3 === 1 ? "is-tall" : ""}`}>
              <Img photo={ph} sizes="(min-width: 900px) 40vw, 80vw" />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Moment tipogràfic: les paraules s'encenen a mesura que baixes. */
export function WordHighlight({ text, kicker }: { text: string; kicker: string }) {
  const words = text.split(" ");
  const [lit, setLit] = useState(words.length);
  const ref = useScrollVar<HTMLElement>("through", (p) => setLit(Math.round(p * 1.15 * words.length)));
  useEffect(() => { if (!reduced()) setLit(0); }, []);
  return (
    <section ref={ref} className="words" aria-label={kicker}>
      <div className="words__sticky wrap">
        <p className="eyebrow">{kicker}</p>
        <p className="words__text display">
          {words.map((w, i) => (
            <span key={i} className={i < lit ? "is-lit" : ""}>{w} </span>
          ))}
        </p>
      </div>
    </section>
  );
}

/** "Obert ara" calculat al navegador amb l'hora de Catalunya. */
export function OpenNow({ hours, className = "" }: { hours: DayHours[]; className?: string }) {
  const [s, setS] = useState<{ open: boolean; text: string } | null>(null);
  useEffect(() => {
    const u = () => setS(openStatus(hours));
    u();
    const t = setInterval(u, 60_000);
    return () => clearInterval(t);
  }, [hours]);
  if (!s) return <span className={`status ${className}`} aria-hidden>&nbsp;</span>;
  return (
    <span className={`status ${s.open ? "is-open" : ""} ${className}`}>
      <span className="status__dot" aria-hidden />
      {s.text}
    </span>
  );
}

/** Capçalera que s'enfosqueix quan baixes. */
export function Header({ name, phone, light }: { name: string; phone: string; light?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className={`topbar ${scrolled ? "is-scrolled" : ""} ${light && !scrolled ? "is-light" : ""}`}>
      <div className="wrap topbar__inner">
        <a href="#inici" className="topbar__name display">{name}</a>
        <nav className="topbar__nav" aria-label="Seccions">
          <a href="#serveis" className="link">Serveis</a>
          <a href="#visita" className="link">Horari i adreça</a>
          <a href={`tel:${phone.replace(/\s/g, "")}`} className="btn btn--small">Truca&apos;ns</a>
        </nav>
      </div>
    </header>
  );
}
