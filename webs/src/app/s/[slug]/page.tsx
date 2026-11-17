import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Site from "@/components/Site";
import { demos, getBusiness } from "@/lib/demos";
import { variantFrom, type SP } from "@/lib/variant";
import { photoUrl } from "@/lib/photo";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SP> };

export function generateStaticParams() {
  return demos.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const b = getBusiness((await params).slug);
  if (!b) return {};
  return {
    title: `${b.name} · ${b.town}`,
    description: b.intro,
    openGraph: { title: b.name, description: b.intro, images: [photoUrl(b.photos.hero.src, 1200)], locale: "ca_ES", type: "website" },
    robots: b.demo ? { index: false, follow: false } : undefined,
  };
}

export default async function Page({ params, searchParams }: Props) {
  const { slug } = await params;
  const b = getBusiness(slug);
  if (!b) notFound();
  const v = variantFrom(b, await searchParams);
  return <Site b={b} v={v} base={`/s/${b.slug}`} />;
}
