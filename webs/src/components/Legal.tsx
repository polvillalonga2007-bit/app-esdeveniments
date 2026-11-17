import type { Business } from "@/lib/types";
import { themeStyle } from "@/lib/themes";

export function LegalShell({ b, title, children }: { b: Business; title: string; children: React.ReactNode }) {
  return (
    <div className={`site site--${b.sector}`} style={themeStyle(b.sector, b.variant)}>
      <main className="wrap legal">
        <p><a className="link" href={`/s/${b.slug}`}>← Torna a {b.name}</a></p>
        <h1 className="display">{title}</h1>
        {children}
      </main>
    </div>
  );
}

export function AvisLegal({ b }: { b: Business }) {
  return (
    <LegalShell b={b} title="Avís legal">
      <p>En compliment de la Llei 34/2002, de serveis de la societat de la informació i de comerç electrònic (LSSI), us informem de les dades del titular d&apos;aquesta web.</p>
      <ul>
        <li>Titular: {b.legal.owner}</li>
        <li>NIF: {b.legal.nif}</li>
        <li>Adreça: {b.legal.address}</li>
        <li>Telèfon: {b.phone}{b.email ? ` · Correu: ${b.email}` : ""}</li>
      </ul>
      <h2>Ús de la web</h2>
      <p>Aquesta web informa dels serveis, horaris i contacte de {b.name}. Els textos, logotips i fotografies pròpies són del titular i no es poden reproduir sense permís.</p>
      <h2>Responsabilitat</h2>
      <p>El titular procura que la informació sigui correcta i actualitzada, però els preus i horaris poden canviar. En cas de dubte, contacteu-nos directament.</p>
    </LegalShell>
  );
}

export function Privacitat({ b }: { b: Business }) {
  return (
    <LegalShell b={b} title="Política de privacitat">
      <p>Responsable del tractament: {b.legal.owner}, NIF {b.legal.nif}, {b.legal.address}.</p>
      <h2>Quines dades tractem</h2>
      <p>Només les dades que ens envieu voluntàriament per telèfon, WhatsApp o correu per demanar informació o una cita: nom, telèfon i el missatge.</p>
      <h2>Per a què</h2>
      <p>Per respondre la vostra consulta i gestionar la cita. No les fem servir per a publicitat ni les cedim a tercers, tret d&apos;obligació legal.</p>
      <h2>Quant de temps</h2>
      <p>El temps necessari per atendre-us i el que marqui la llei.</p>
      <h2>Els vostres drets</h2>
      <p>Podeu demanar accedir, rectificar o suprimir les vostres dades escrivint a {b.email ?? "l'adreça del titular"}. També podeu reclamar a l&apos;Autoritat Catalana de Protecció de Dades.</p>
      <h2>Galetes</h2>
      <p>Aquesta web no fa servir galetes de seguiment ni de publicitat. Per això no us demana permís en entrar.</p>
    </LegalShell>
  );
}
