import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { CATEGORIES } from "@/lib/site-content";
import { getVisibleCollections } from "@/lib/collections";
import { Reveal } from "@/components/reveal";
import { BrandMark } from "@/components/brand";
import { HeroArch } from "./hero-arch";

const HERO_IMAGES = CATEGORIES.map((c) => ({ src: c.image, label: c.label }));

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-20 pt-10 sm:pt-16 lg:pb-28">
        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
          <div className="text-center lg:text-left">
            <BrandMark size="xl" priority className="animate-bloom-in mx-auto lg:mx-0" />
            <h1
              className="animate-rise-in mt-6 font-display text-[clamp(2.6rem,6.4vw,5.4rem)] leading-[1.02] text-forest"
              style={{ animationDelay: "0.2s" }}
            >
              Adorne
              <br />
              Your Story
            </h1>
            <p
              className="animate-rise-in mx-auto mt-6 max-w-md font-tagline text-xl italic leading-relaxed text-ink/70 sm:text-2xl lg:mx-0"
              style={{ animationDelay: "0.35s" }}
            >
              For every you, every story.
            </p>
            <div
              className="animate-rise-in mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start"
              style={{ animationDelay: "0.5s" }}
            >
              <Link
                href="/products"
                className="rounded-full bg-forest px-9 py-3.5 text-[12px] uppercase tracking-[0.18em] text-cream transition-[background-color,transform] duration-300 hover:-translate-y-0.5 hover:bg-forest-deep"
              >
                Shop jewellery
              </Link>
              <Link
                href="#collections"
                className="group text-[12px] uppercase tracking-[0.18em] text-forest"
              >
                Explore collections
                <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-y-0.5">
                  &darr;
                </span>
              </Link>
            </div>
          </div>

          <div className="animate-rise-in" style={{ animationDelay: "0.3s" }}>
            <HeroArch images={HERO_IMAGES} />
          </div>
        </div>
      </section>

      {/* Shop by category */}
      <section className="px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal className="text-center">
            <p className="text-[11px] uppercase tracking-[0.24em] text-gold">Vaamshri collection</p>
            <h2 className="mt-3 font-display text-3xl text-forest sm:text-4xl">Shop by category</h2>
          </Reveal>

          <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-5">
            {CATEGORIES.map((category, i) => {
              // Odd one out on the 2-column mobile/tablet grid spans full width
              const wide = i === CATEGORIES.length - 1;
              return (
              <Reveal
                key={category.slug}
                delay={i * 90}
                className={wide ? "col-span-2 lg:col-span-1" : ""}
              >
                <Link
                  href={`/products?category=${category.slug}`}
                  className={`group relative block overflow-hidden ${
                    wide
                      ? "aspect-[8/5] rounded-t-[2rem] lg:aspect-[4/5] lg:rounded-t-[999px]"
                      : "aspect-[4/5] rounded-t-[999px]"
                  }`}
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
              </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Collections */}
      <section id="collections" className="scroll-mt-20 bg-paper px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal className="text-center">
            <p className="text-[12px] tracking-[0.2em] text-gold">Our Collection, Your Story</p>
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
    <div className="mt-12 grid gap-x-8 gap-y-14 md:grid-cols-2">
      {collections.map((collection, i) => (
        <Reveal key={collection.id} delay={(i % 2) * 120}>
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
        </Reveal>
      ))}
    </div>
  );
}
