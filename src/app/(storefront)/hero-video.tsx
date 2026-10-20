"use client";

import { useEffect, useRef, useState } from "react";

// Hero film. Never stretched: every layout scales the picture uniformly.
//  - Phones and portrait tablets: the portrait film fills the screen.
//  - Wide screens with a landscape cut supplied: that cut fills the screen.
//  - Wide screens with only the portrait film: it is shown at its true shape,
//    full height and centred, with a soft blurred copy filling the sides, so
//    nothing is cropped away or blown up past its resolution.
// Muted, looping, pauses off-screen, still for reduced-motion, and has a pause button.
export function HeroVideo({
  portraitSrc,
  wideSrc,
}: {
  portraitSrc: string;
  /** Landscape cut for wide screens, when one has been supplied */
  wideSrc?: string | null;
}) {
  const main = useRef<HTMLVideoElement>(null);
  const backdrop = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [reduced, setReduced] = useState(false);

  const all = () => [main.current, backdrop.current].filter((v): v is HTMLVideoElement => Boolean(v));

  useEffect(() => {
    const el = main.current;
    if (!el) return;
    all().forEach((v) => (v.muted = true));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      all().forEach((v) => v.pause());
      const t = window.setTimeout(() => setReduced(true), 0);
      return () => window.clearTimeout(t);
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        all().forEach((v) => (entry.isIntersecting ? v.play().catch(() => {}) : v.pause()));
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const showPlaying = playing && !reduced;
  const common = { muted: true, loop: true, playsInline: true, preload: "auto" as const, autoPlay: showPlaying };

  return (
    <>
      {wideSrc ? null : (
        <video
          ref={backdrop}
          {...common}
          aria-hidden
          tabIndex={-1}
          className="absolute inset-0 hidden h-full w-full scale-125 object-cover opacity-70 blur-2xl min-[900px]:block"
        >
          <source src={portraitSrc} type="video/mp4" />
        </video>
      )}
      <video
        ref={main}
        {...common}
        aria-label="Vaamshri jewellery film"
        className={
          wideSrc
            ? "absolute inset-0 h-full w-full object-cover"
            : "absolute inset-0 h-full w-full object-cover min-[900px]:left-1/2 min-[900px]:right-auto min-[900px]:aspect-[9/16] min-[900px]:w-auto min-[900px]:-translate-x-1/2"
        }
      >
        {wideSrc ? <source src={wideSrc} type="video/mp4" media="(min-width: 900px)" /> : null}
        <source src={portraitSrc} type="video/mp4" />
      </video>
      <button
        type="button"
        onClick={() => {
          const vids = all();
          if (vids.length === 0) return;
          if (vids[0].paused) {
            setReduced(false);
            setPlaying(true);
            vids.forEach((v) => v.play().catch(() => {}));
          } else {
            setPlaying(false);
            vids.forEach((v) => v.pause());
          }
        }}
        aria-label={showPlaying ? "Pause video" : "Play video"}
        className="absolute bottom-5 right-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-cream/40 bg-forest-deep/50 text-cream backdrop-blur transition-colors hover:bg-forest-deep/80 sm:bottom-8 sm:right-8"
      >
        {showPlaying ? (
          <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor" aria-hidden>
            <rect x="0" y="0" width="4" height="14" />
            <rect x="8" y="0" width="4" height="14" />
          </svg>
        ) : (
          <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor" aria-hidden>
            <path d="M0 0l12 7-12 7z" />
          </svg>
        )}
      </button>
    </>
  );
}
