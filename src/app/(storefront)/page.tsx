import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { CATEGORIES } from "@/lib/site-content";
import { getVisibleCollections } from "@/lib/collections";
import { Reveal } from "@/components/reveal";
import { Slider, Slide } from "@/components/slider";
import { ProductCard } from "@/components/product-card";
import { getActiveProducts } from "@/lib/products";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { HeroVideo } from "./hero-video";
import { SaleBanner } from "./sale-banner";

// A landscape cut is used on wide screens as soon as this file exists
const WIDE_VIDEO = existsSync(join(process.cwd(), "public", "brand", "home-video-wide.mp4"))
  ? "/brand/home-video-wide.mp4"
  : null;

const TICKER = [
  "Adorne your story",
  "Our collection, your story",
  "Inaugural collections",
  "For every you, every story",
  "Tag us on Instagram",
];

export default function Home() {
  return (
    <>
      {/* Hero: the film is the first thing visitors see */}
      <section className="relative isolate flex h-[calc(100svh-4.5rem)] min-h-[30rem] items-end overflow-hidden bg-forest-deep sm:h-[calc(100svh-5rem)] lg:max-h-[56rem]">
        <HeroVideo portraitSrc="/brand/home-video.mp4" wideSrc={WIDE_VIDEO} />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-forest-deep/80 via-forest-deep/10 to-transparent" />
        <div className="relative mx-auto w-full max-w-6xl px-6 pb-8 text-center sm:pb-10 lg:text-left">
          {/* The film already carries the logo, so the headline is for screen readers and search engines */}
          <h1 className="sr-only">Vaamshri: Adorne Your Story. For every you, every story.</h1>
          <div
            className="animate-rise-in flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start"
            style={{ animationDelay: '0.5s' }}
          >
            <Link
              href="/products"
              className="rounded-full bg-gold px-9 py-3.5 text-[12px] uppercase tracking-[0.18em] text-forest-deep transition-[background-color,transform] duration-300 hover:-translate-y-0.5 hover:bg-gold-soft"
            >
              Shop jewellery
            </Link>
            <Link href="#collections" className="group text-[12px] uppercase tracking-[0.18em] text-cream">
              Explore collections
              <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-y-0.5">&darr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Ticker */}
      <div className="overflow-hidden" aria-hidden>
        <div className="overflow-hidden bg-forest py-3.5 text-gold">
          <div className="flex w-max animate-marquee gap-12 whitespace-nowrap font-display text-sm tracking-[0.2em] uppercase">
            {[0, 1].map((n) =>
              TICKER.map((t) => (
                <span key={`${n}-${t}`} className="flex items-center gap-12">
                  {t}
                  <span>&#10022;</span>
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Sale banner (only while a sale is running) */}
      <Suspense fallback={null}>
        <SaleBanner />
      </Suspense>

      {/* Shop by category */}
      <section className="px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal className="text-center">
            <p className="text-[11px] uppercase tracking-[0.24em] text-gold">Vaamshri Jewellery</p>
            <h2 className="mt-3 font-display text-3xl text-forest sm:text-4xl">Shop by category</h2>
          </Reveal>

          <Slider label="categories" className="mt-12">
            {CATEGORIES.map((category) => {
              return (
              <Slide key={category.slug} className="w-[58%] sm:w-[31%] lg:w-[calc(20%-1.2rem)]">
                <Link
                  href={`/products?category=${category.slug}`}
                  className="group relative block aspect-[4/5] overflow-hidden rounded-t-[999px]"
                >
                  <Image
                    src={category.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 20vw, (min-width: 640px) 46vw, 92vw"
                    className="object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/85 via-forest-deep/10 to-transparent transition-opacity duration-500 group-hover:opacity-80" />
                  <span className="absolute inset-x-0 bottom-6 text-center font-display text-lg tracking-[0.08em] text-cream transition-transform duration-500 group-hover:-translate-y-1 sm:text-xl">
                    {category.label}
                  </span>
                </Link>
              </Slide>
              );
            })}
          </Slider>
        </div>
      </section>

      {/* Fresh drops */}
      <section className="px-6 pb-20 sm:pb-24">
        <div className="mx-auto max-w-6xl">
          <Reveal className="text-center">
            <p className="text-[11px] uppercase tracking-[0.24em] text-gold">Just landed</p>
            <h2 className="mt-3 font-display text-3xl text-forest sm:text-4xl">Fresh drops</h2>
          </Reveal>
          <Suspense fallback={<div className="mt-12 h-72 animate-pulse bg-ink/5" />}>
            <FreshDrops />
          </Suspense>
          <div className="mt-10 text-center">
            <Link
              href="/products"
              className="inline-block rounded-full border border-forest/30 px-8 py-3 text-[12px] uppercase tracking-[0.18em] text-forest transition-colors hover:bg-forest hover:text-cream"
            >
              Shop all jewellery
            </Link>
          </div>
        </div>
      </section>

      {/* Collections */}
      <section id="collections" className="scroll-mt-20 bg-paper px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal className="text-center">
            <p className="text-[11px] uppercase tracking-[0.24em] text-gold">Our Collection, Your Story</p>
            <h2 className="mt-3 font-display text-3xl text-forest sm:text-4xl">
              Explore Vaamshri Inaugural Collections.
            </h2>
          </Reveal>

          <Suspense
            fallback={
              <div className="mt-12 grid gap-x-8 gap-y-14 md:grid-cols-2">
                {[0, 1].map((i) => (
                  <div key={i} className="aspect-[1200/630] animate-pulse bg-ink/5" />
                ))}
              </div>
            }
          >
            <HomeCollections />
          </Suspense>
        </div>
      </section>

      {/* Brand story */}
      <section className="relative overflow-hidden bg-forest-deep px-6 py-24 text-center sm:py-32">
        <Image
          src="/brand/logo-mark.png"
          alt=""
          width={1200}
          height={724}
          unoptimized
          className="pointer-events-none absolute left-1/2 top-1/2 h-auto w-[640px] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-[0.06]"
        />
        <Reveal className="relative">
          <p className="text-[11px] uppercase tracking-[0.24em] text-gold">Our belief</p>
          <p className="mx-auto mt-8 max-w-3xl font-tagline text-2xl italic leading-[1.6] text-cream/90 sm:text-[1.9rem]">
            Every story deserves more than to be told. It deserves to be adorned.
          </p>
          <p className="mx-auto mt-8 max-w-2xl leading-relaxed text-cream/60">
            The milestones, the quiet victories, the moments that made you who you are
            today. Just like the right piece of jewellery doesn&rsquo;t just complete an
            outfit, it becomes a part of your story, worn close, carried with you, and
            remembered forever.
          </p>
          <Link
            href="/about"
            className="mt-10 inline-block text-[12px] uppercase tracking-[0.18em] text-gold underline-offset-8 hover:underline"
          >
            About Vaamshri
          </Link>
        </Reveal>
      </section>

      {/* Closing CTA */}
      <section className="px-6 py-24 text-center">
        <Reveal>
          <h2 className="font-display text-3xl text-forest sm:text-4xl">
            So why let your story go unadorned?
          </h2>
          <p className="mt-4 font-tagline text-lg italic text-ink/70">
            Let it shine. Adorne your stories with Vaamshri.
          </p>
          <Link
            href="/products"
            className="mt-10 inline-block rounded-full bg-forest px-9 py-3.5 text-[12px] uppercase tracking-[0.18em] text-cream transition-[background-color,transform] duration-300 hover:-translate-y-0.5 hover:bg-forest-deep"
          >
            Shop now
          </Link>
        </Reveal>
      </section>
    </>
  );
}

async function HomeCollections() {
  const collections = await getVisibleCollections();
  if (collections.length === 0) return null;

  return (
    <Slider label="collections" autoplayMs={5500} className="mt-12">
      {collections.map((collection) => (
        <Slide key={collection.id} className="w-[88%] md:w-[calc(50%-1rem)]">
          <Link href={`/collections/${collection.slug}`} className="group block">
            <div className="relative aspect-[1200/630] overflow-hidden bg-cream">
              {collection.imageUrl ? (
                <Image
                  src={collection.imageUrl}
                  alt={`${collection.name} collection`}
                  fill
                  unoptimized={!collection.imageUrl.startsWith("/brand/")}
                  sizes="(min-width: 768px) 46vw, 92vw"
                  className="object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center font-display text-2xl text-forest/60">
                  {collection.name}
                </span>
              )}
              {collection.saleLabel ? (
                <span className="absolute left-4 top-4 rounded-full bg-terracotta px-3.5 py-1.5 text-[11px] uppercase tracking-[0.16em] text-cream shadow-lg">
                  {collection.saleLabel}
                </span>
              ) : null}
            </div>
            <div className="mt-5 flex items-baseline justify-between gap-4 border-b border-gold/30 pb-4">
              <div className="min-w-0">
                <p className="font-display text-xl text-forest">{collection.name}</p>
                {collection.tagline ? (
                  <p className="mt-1 truncate font-tagline text-sm italic text-ink/60">{collection.tagline}</p>
                ) : null}
              </div>
              <span className="shrink-0 text-[11px] uppercase tracking-[0.18em] text-forest/70 transition-[color,transform] duration-300 group-hover:translate-x-1 group-hover:text-gold">
                Shop &rarr;
              </span>
            </div>
          </Link>
        </Slide>
      ))}
    </Slider>
  );
}

// Newest pieces, in-stock ones first
async function FreshDrops() {
  const all = await getActiveProducts({ sort: "new" });
  const picks = [...all.filter((p) => p.stock > 0), ...all.filter((p) => p.stock <= 0)].slice(0, 10);
  if (picks.length === 0) return null;
  return (
    <Slider label="new arrivals" className="mt-12">
      {picks.map((p) => (
        <Slide key={p.id} className="w-[62%] sm:w-[31%] lg:w-[calc(25%-1.15rem)]">
          <ProductCard product={p} />
        </Slide>
      ))}
    </Slider>
  );
}
