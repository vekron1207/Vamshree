import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getVisibleCollection, getVisibleCollections } from "@/lib/collections";
import { getActiveProducts } from "@/lib/products";
import { ProductCard, ProductGridSkeleton } from "@/components/product-card";
import { Reveal } from "@/components/reveal";

export default function CollectionPage(props: PageProps<"/collections/[slug]">) {
  return (
    <Suspense fallback={<div className="aspect-[1200/630] w-full animate-pulse bg-ink/5" />}>
      <CollectionDetail paramsPromise={props.params} />
    </Suspense>
  );
}

async function CollectionDetail({
  paramsPromise,
}: {
  paramsPromise: PageProps<"/collections/[slug]">["params"];
}) {
  const { slug } = await paramsPromise;
  const collection = await getVisibleCollection(slug);
  if (!collection) notFound();

  const others = (await getVisibleCollections()).filter((c) => c.id !== collection.id);

  return (
    <div>
      {collection.imageUrl ? (
        <div className="relative mx-auto aspect-[1200/630] w-full max-w-[1400px] overflow-hidden">
          <Image
            src={collection.imageUrl}
            alt={`${collection.name} collection`}
            fill
            unoptimized={!collection.imageUrl.startsWith("/brand/")}
            sizes="100vw"
            className="animate-bloom-in object-cover"
            priority
          />
        </div>
      ) : null}

      {collection.saleLabel ? (
        <div className="bg-terracotta px-6 py-3 text-center text-sm text-cream">
          <span className="uppercase tracking-[0.18em]">{collection.saleLabel}</span>
          <span className="mx-3 opacity-60">&middot;</span>
          <span>
            Every piece in {collection.name} is {collection.salePercent}% off
            {collection.saleEndsAt
              ? ` until ${collection.saleEndsAt.toLocaleDateString("en-IN", { day: "numeric", month: "long" })}`
              : ""}
          </span>
        </div>
      ) : null}

      <div className="mx-auto max-w-2xl px-6 pt-16 text-center">
        <p className="text-[11px] uppercase tracking-[0.24em] text-gold">The collection</p>
        <h1 className="mt-3 font-display text-4xl text-forest sm:text-5xl">{collection.name}</h1>
        {collection.tagline ? (
          <p className="mt-4 font-tagline text-xl italic text-ink/70">{collection.tagline}</p>
        ) : null}
        {collection.description ? (
          <p className="mt-8 leading-relaxed text-ink/70">{collection.description}</p>
        ) : null}
      </div>

      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6">
        <Suspense fallback={<ProductGridSkeleton count={4} />}>
          <CollectionProducts slug={slug} />
        </Suspense>
      </div>

      {others.length > 0 ? (
        <section className="border-t border-gold/30 bg-paper px-6 py-16">
          <p className="text-center text-[11px] uppercase tracking-[0.24em] text-gold">More stories</p>
          <div className="mx-auto mt-8 flex max-w-4xl flex-col flex-wrap items-center justify-center gap-6 sm:flex-row sm:gap-12">
            {others.map((c) => (
              <Link
                key={c.id}
                href={`/collections/${c.slug}`}
                className="font-display text-xl text-forest transition-colors hover:text-gold"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

async function CollectionProducts({ slug }: { slug: string }) {
  const products = await getActiveProducts({ collectionSlug: slug });

  if (products.length === 0) {
    return (
      <div className="text-center">
        <p className="font-tagline text-xl italic text-ink/70">
          Pieces from this collection are arriving soon.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-block text-[12px] uppercase tracking-[0.18em] text-forest underline underline-offset-8"
        >
          Shop all jewellery
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-14 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product, i) => (
        <Reveal key={product.id} delay={(i % 4) * 80}>
          <ProductCard product={{ ...product, eyebrow: null }} />
        </Reveal>
      ))}
    </div>
  );
}
