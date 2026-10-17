"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const INTERVAL_MS = 4800;

export function HeroArch({ images }: { images: { src: string; label: string }[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % images.length),
      INTERVAL_MS
    );
    return () => window.clearInterval(id);
  }, [images.length]);

  return (
    <div className="mx-auto w-full max-w-[420px]">
      <div className="relative">
      {/* Hairline gold outline offset behind the arch */}
      <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-t-[999px] border border-gold/60" />
      <div className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] bg-forest-deep">
        {images.map((img, i) => (
          <Image
            key={img.src}
            src={img.src}
            alt=""
            fill
            priority={i === 0}
            sizes="(min-width: 1024px) 420px, 80vw"
            className={`object-cover transition-[opacity,transform] duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              i === index ? "scale-100 opacity-100" : "scale-[1.06] opacity-0"
            }`}
          />
        ))}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-forest-deep/70 to-transparent" />
        <p
          key={index}
          aria-live="polite"
          className="animate-rise-in absolute inset-x-0 bottom-6 text-center font-display text-lg tracking-[0.12em] text-cream"
        >
          {images[index].label}
        </p>
      </div>
      </div>
      <div className="mt-8 flex justify-center gap-2" role="tablist" aria-label="Featured category">
        {images.map((img, i) => (
          <button
            key={img.src}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={img.label}
            onClick={() => setIndex(i)}
            className={`h-[3px] rounded-full transition-all duration-500 ${
              i === index ? "w-8 bg-forest" : "w-3 bg-forest/20 hover:bg-forest/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
