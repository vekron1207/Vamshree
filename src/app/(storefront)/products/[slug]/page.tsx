import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/lib/products";
import { parseDescription } from "@/lib/description";
import { formatINR } from "@/lib/format";
import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/reveal";
import { SITE_URL } from "@/lib/site-url";
import { AddToCartButton } from "./add-to-cart-button";
import { WishlistButton } from "@/components/wishlist-button";
import { ProductGallery } from "./product-gallery";

export async function generateMetadata(props: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  const { story } = parseDescription(product.description);
  const description = (story[0] ?? `${product.name} by Vaamshri`).slice(0, 160);
  const image = product.images[0]?.url;
  return {
    title: product.name,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: { title: product.name, description, type: "website", images: image ? [image] : undefined },
  };
}

export default function ProductPage(props: PageProps<"/products/[slug]">) {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-8 sm:px-6 sm:pt-12">
      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductDetail paramsPromise={props.params} />
      </Suspense>
    </div>
  );
}

async function ProductDetail({
  paramsPromise,
}: {
  paramsPromise: PageProps<"/products/[slug]">["params"];
}) {
  const { slug } = await paramsPromise;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.id, product.collectionId);
  const image = product.images[0];
  const { story, specs, care } = parseDescription(product.description);
  const { price, originalPrice, saleLabel } = product.pricing;

  const absolute = (u: string) => (u.startsWith("http") ? u : `${SITE_URL}${u}`);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: story[0] ?? product.name,
    image: product.images.map((i) => absolute(i.url)),
    sku: product.sku ?? undefined,
    brand: { "@type": "Brand", name: "Vaamshri" },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/products/${product.slug}`,
      priceCurrency: "INR",
      price: price.toFixed(2),
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        // Escape "<" so product text can't close the script tag
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <nav aria-label="Breadcrumb" className="text-[11px] uppercase tracking-[0.16em] text-ink/50">
        <Link href="/products" className="hover:text-forest">
          Shop
        </Link>
        {product.category ? (
          <>
            <span className="mx-2">/</span>
            <Link href={`/products?category=${product.category.slug}`} className="hover:text-forest">
              {product.category.name}
            </Link>
          </>
        ) : null}
      </nav>

      <div className="mt-8 grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ProductGallery
            slug={product.slug}
            name={product.name}
            images={product.images.map((img) => ({ url: img.url, alt: img.alt }))}
          />
        </div>

        <div className="animate-rise-in" style={{ animationDelay: "0.15s" }}>
          {product.collection ? (
            <Link
              href={`/collections/${product.collection.slug}`}
              className="text-[11px] uppercase tracking-[0.22em] text-gold hover:underline"
            >
              {product.collection.name}
            </Link>
          ) : null}
          <h1 className="mt-3 font-display text-3xl leading-tight text-forest sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-5 flex flex-wrap items-baseline gap-3 text-xl">
            <span className={originalPrice ? "text-terracotta" : "text-ink"}>{formatINR(price)}</span>
            {originalPrice ? (
              <span className="text-base text-ink/40 line-through">{formatINR(originalPrice)}</span>
            ) : null}
            {saleLabel ? (
              <span className="rounded-full bg-terracotta px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-cream">
                {saleLabel}
              </span>
            ) : null}
          </p>
          <p className="mt-1 text-xs text-ink/50">Inclusive of all taxes</p>

          <div className="mt-6 flex items-center gap-3 text-sm text-ink/60">
            <WishlistButton productId={product.id} name={product.name} className="border border-forest/20" />
            Save to wishlist
          </div>

          <AddToCartButton
            className="mt-6"
            stock={product.stock}
            variants={product.variants.map((v) => ({ id: v.id, label: v.label, stock: v.stock }))}
            product={{
              productId: product.id,
              name: product.name,
              price,
              image: image?.url ?? null,
            }}
          />

          {story.length > 0 ? (
            <div className="mt-10 space-y-4 border-t border-gold/30 pt-8 leading-relaxed text-ink/75">
              {story.map((p, i) => (
                <p key={i} className={i === 0 ? "font-tagline text-lg italic text-ink/85" : ""}>
                  {p}
                </p>
              ))}
            </div>
          ) : null}

          {specs.length > 0 ? (
            <dl className="mt-10 divide-y divide-gold/20 border-y border-gold/30">
              {specs.map((s) => (
                <div key={s.label} className="grid grid-cols-[9rem_1fr] gap-4 py-3 text-sm">
                  <dt className="text-[11px] uppercase tracking-[0.14em] text-ink/50">{s.label}</dt>
                  <dd className="text-ink/80">{s.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {care.length > 0 ? (
            <details className="group mt-6 border-b border-gold/30 pb-4">
              <summary className="flex cursor-pointer list-none items-center justify-between py-2 text-[11px] uppercase tracking-[0.16em] text-forest">
                Care instructions
                <span className="text-lg transition-transform duration-300 group-open:rotate-45">+</span>
              </summary>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink/70">
                {care.map((c) => (
                  <li key={c} className="flex gap-3">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" />
                    {c}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-28">
          <Reveal className="text-center">
            <p className="text-[11px] uppercase tracking-[0.24em] text-gold">From the same story</p>
            <h2 className="mt-3 font-display text-2xl text-forest sm:text-3xl">
              {product.collection?.name}
            </h2>
          </Reveal>
          <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
            {related.map((p, i) => (
              <Reveal key={p.id} delay={i * 80}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="mt-12 grid animate-pulse gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
      <div className="aspect-[4/5] rounded-t-[999px] bg-ink/5" />
      <div className="space-y-4">
        <div className="h-3 w-24 bg-ink/5" />
        <div className="h-9 w-3/4 bg-ink/5" />
        <div className="h-6 w-28 bg-ink/5" />
        <div className="mt-8 h-12 w-full rounded-full bg-ink/5" />
      </div>
    </div>
  );
}
