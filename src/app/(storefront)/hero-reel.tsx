"use client";

import { useEffect, useRef } from "react";

// Vertical brand reel in a phone-shaped card. Muted, looping and inline so
// browsers allow autoplay; paused off-screen, and left still for people who
// have asked their device to reduce motion.
export function HeroReel() {
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    el.muted = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="relative mx-auto w-[min(70vw,300px)] sm:w-[320px]">
      <div aria-hidden className="absolute -inset-8 -z-10 rounded-full bg-gold-soft/60 blur-3xl" />
      <div className="relative aspect-[9/16] rotate-[2.5deg] overflow-hidden rounded-[2rem] border-[5px] border-paper bg-forest-deep shadow-[0_30px_60px_-20px_rgba(6,20,12,0.55)] transition-transform duration-700 hover:rotate-0">
        <video
          ref={video}
          src="/brand/home-video.mp4"
          muted
          loop
          playsInline
          preload="auto"
          aria-label="Vaamshri jewellery reel"
          className="h-full w-full object-cover"
        />
      </div>
      <span className="absolute -left-4 top-10 -rotate-[8deg] rounded-full bg-gold px-4 py-1.5 text-[11px] uppercase tracking-[0.16em] text-forest-deep shadow-lg sm:-left-10">
        &#10022; New drop
      </span>
      <span className="absolute -right-3 bottom-16 rotate-[6deg] rounded-full bg-forest px-4 py-1.5 text-[11px] uppercase tracking-[0.16em] text-cream shadow-lg sm:-right-8">
        Adorne your story
      </span>
    </div>
  );
}
