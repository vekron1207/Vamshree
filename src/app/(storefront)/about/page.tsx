import Image from "next/image";
import { Suspense } from "react";
import { getSitePage, toParagraphs } from "@/lib/site-pages";
import { Reveal } from "@/components/reveal";

export default function AboutPage() {
  return (
    <Suspense fallback={<div className="mx-auto h-96 max-w-2xl animate-pulse" />}>
      <AboutContent />
    </Suspense>
  );
}

async function AboutContent() {
  const page = await getSitePage("about");
  const paragraphs = toParagraphs(page.body);

  return (
    <article className="mx-auto max-w-2xl px-6 pb-24 pt-14 text-center">
      <Image
        src="/brand/logo-mark.png"
        alt=""
        width={160}
        height={98}
        unoptimized
        className="animate-bloom-in mx-auto h-auto w-28 sm:w-32"
      />
      <h1 className="mt-8 font-display text-4xl text-forest sm:text-5xl">{page.title}</h1>
      {page.intro ? (
        <p className="mt-8 font-tagline text-xl italic leading-relaxed text-ink/75 sm:text-2xl">{page.intro}</p>
      ) : null}

      {page.imageUrl ? (
        <Reveal className="mt-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={page.imageUrl} alt="" className="aspect-[16/9] w-full rounded-t-[2.5rem] object-cover" />
        </Reveal>
      ) : null}

      {paragraphs.length > 0 ? (
        <Reveal className="mt-12 space-y-5 text-left leading-relaxed text-ink/75 sm:text-center">
          {paragraphs.map((p, i) => (
            <p key={i} className="whitespace-pre-line">
              {p}
            </p>
          ))}
        </Reveal>
      ) : null}
    </article>
  );
}
