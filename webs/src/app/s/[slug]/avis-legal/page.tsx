import { notFound } from "next/navigation";
import { demos, getBusiness } from "@/lib/demos";
import { AvisLegal } from "@/components/Legal";

export function generateStaticParams() {
  return demos.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const b = getBusiness((await params).slug);
  return { title: b ? `Avís legal · ${b.name}` : "Avís legal", robots: { index: false } };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const b = getBusiness((await params).slug);
  if (!b) notFound();
  return <AvisLegal b={b} />;
}
