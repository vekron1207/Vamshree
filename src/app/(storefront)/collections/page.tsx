import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { getVisibleCollections } from "@/lib/collections";
import { Reveal } from "@/components/reveal";

export default function CollectionsIndexPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-10 sm:px-6 sm:pt-14">
      <header className="text-center">
        <p className="text-[11px] uppercase tracking-[0.24em] text-gold">Our stories</p>
        <h1 className="mt-3 font-display text-4xl text-forest sm:text-5xl">Collections</h1>
      </header>
      <Suspense
        fallback={
          <div className="mt-14 space-y-16">
            {[0, 1].map((i) => (
              <div key={i} className="aspect-[1200/630] animate-pulse bg-ink/5" />
            ))}
          </div>
        }
      >
        <CollectionList />
      </Suspense>
    </div>
  );
}

async function CollectionList() {
  const collections = await getVisibleCollections();

  if (collections.length === 0) {
    return <p className="mt-16 text-center font-tagline text-xl italic text-ink/70">New collections are coming soon.</p>;
  }

  return (
    <div className="mt-14 space-y-20">
      {collections.map((c, i) => (
        <Reveal key={c.id}>
          <Link
            href={`/collections/${c.slug}`}
            className={`group grid items-center gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-14 ${
              i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
            }`}
          >
            <div className="relative aspect-[1200/630] overflow-hidden bg-cream">
              {c.imageUrl ? (
                <Image
                  src={c.imageUrl}
                  alt={`${c.name} collection`}
                  fill
                  unoptimized={!c.imageUrl.startsWith("/brand/")}
                  sizes="(min-width: 1024px) 58vw, 92vw"
                  className="object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                />
              ) : null}
              {c.saleLabel ? (
                <span className="absolute left-4 top-4 rounded-full bg-terracotta px-3.5 py-1.5 text-[11px] uppercase tracking-[0.16em] text-cream shadow-lg">
                  {c.saleLabel}
                </span>
              ) : null}
            </div>
            <div className="text-center lg:text-left">
              <h2 className="font-display text-3xl text-forest">{c.name}</h2>
              {c.tagline ? <p className="mt-3 font-tagline text-lg italic text-ink/70">{c.tagline}</p> : null}
              {c.description ? (
                <p className="mt-5 line-clamp-4 leading-relaxed text-ink/65">{c.description}</p>
              ) : null}
              <span className="mt-7 inline-block text-[12px] uppercase tracking-[0.18em] text-forest transition-[color,transform] duration-300 group-hover:translate-x-1 group-hover:text-gold">
                Explore the collection &rarr;
              </span>
            </div>
          </Link>
        </Reveal>
      ))}
    </div>
  );
}
