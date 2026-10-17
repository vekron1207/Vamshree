"use client";

import { useEffect, useRef, useState, ViewTransition } from "react";
import { ImageLightbox } from "@/components/image-lightbox";

type GalleryImage = { url: string; alt: string | null };

const MAGNIFY = 2.5;

export function ProductGallery({
  slug,
  name,
  images,
}: {
  slug: string;
  name: string;
  images: GalleryImage[];
}) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [magnify, setMagnify] = useState<{ index: number; x: number; y: number } | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const count = images.length;
  const alts = images.map((img, i) => img.alt ?? (count > 1 ? `${name}, photo ${i + 1}` : name));

  function scrollToIndex(i: number, smooth = true) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: i * track.clientWidth, behavior: smooth ? "smooth" : "auto" });
  }

  // The scroll position is the source of truth: swiping, arrows and
  // thumbnails all move the track, and the active index follows it.
  function onScroll() {
    const track = trackRef.current;
    if (!track) return;
    const i = Math.round(track.scrollLeft / track.clientWidth);
    if (i !== active) setActive(i);
  }

  // Keep the carousel in sync when the lightbox changes photo
  useEffect(() => {
    if (!lightboxOpen) return;
    scrollToIndex(active, false);
  }, [active, lightboxOpen]);

  function onMagnifyMove(e: React.PointerEvent<HTMLButtonElement>, index: number) {
    // Hover magnifier is for precise pointers only; touch uses the lightbox
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    setMagnify({
      index,
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    });
  }

  if (count === 0) {
    return <div className="aspect-[4/5] rounded-t-[999px] bg-paper" />;
  }

  return (
    <div>
      <div className="group relative">
        <ViewTransition name={`product-image-${slug}`}>
          <div className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] bg-paper">
            <div
              ref={trackRef}
              onScroll={onScroll}
              className="flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              aria-roledescription="carousel"
              aria-label={`${name} photos`}
            >
              {images.map((img, i) => {
                const zoomHere = magnify?.index === i;
                return (
                  <button
                    key={img.url}
                    type="button"
                    onClick={() => {
                      setActive(i);
                      setMagnify(null);
                      setLightboxOpen(true);
                    }}
                    onPointerMove={(e) => onMagnifyMove(e, i)}
                    onPointerLeave={() => setMagnify(null)}
                    aria-label={`Open photo ${i + 1} of ${count} full screen`}
                    className="relative h-full w-full shrink-0 snap-center overflow-hidden md:cursor-zoom-in"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={alts[i]}
                      draggable={false}
                      loading={i === 0 ? "eager" : "lazy"}
                      className="h-full w-full object-cover transition-transform duration-200 ease-out"
                      style={
                        zoomHere
                          ? { transform: `scale(${MAGNIFY})`, transformOrigin: `${magnify.x}% ${magnify.y}%` }
                          : undefined
                      }
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </ViewTransition>

        {count > 1 ? (
          <>
            <GalleryArrow side="left" disabled={active === 0} onClick={() => scrollToIndex(active - 1)} />
            <GalleryArrow side="right" disabled={active === count - 1} onClick={() => scrollToIndex(active + 1)} />
            <span className="pointer-events-none absolute bottom-4 right-4 rounded-full bg-forest-deep/60 px-2.5 py-1 text-[11px] tabular-nums text-cream backdrop-blur-sm">
              {active + 1} / {count}
            </span>
          </>
        ) : null}

        <span className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full bg-cream/85 px-3 py-1 text-[11px] text-forest backdrop-blur-sm transition-opacity duration-300 md:group-hover:opacity-0">
          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden>
            <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.6" />
            <path d="m13 13 4 4M8.5 6v5M6 8.5h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <span className="md:hidden">Tap to zoom</span>
          <span className="hidden md:inline">Hover to zoom, click to expand</span>
        </span>
      </div>

      {count > 1 ? (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none]" role="tablist" aria-label="Choose photo">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Photo ${i + 1} of ${count}`}
              onClick={() => scrollToIndex(i)}
              className={`aspect-[4/5] w-[18%] min-w-14 shrink-0 overflow-hidden rounded-t-full bg-paper ring-offset-2 ring-offset-cream transition ${
                i === active ? "ring-2 ring-forest" : "opacity-60 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      {lightboxOpen ? (
        <ImageLightbox
          images={images.map((img, i) => ({ url: img.url, alt: alts[i] }))}
          index={active}
          onIndexChange={setActive}
          onClose={() => setLightboxOpen(false)}
        />
      ) : null}
    </div>
  );
}

function GalleryArrow({
  side,
  disabled,
  onClick,
}: {
  side: "left" | "right";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={side === "left" ? "Previous photo" : "Next photo"}
      disabled={disabled}
      onClick={onClick}
      className={`absolute top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-cream/90 text-xl text-forest shadow-md transition-[opacity,transform] duration-300 hover:scale-105 disabled:pointer-events-none disabled:opacity-0 md:flex md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100 ${
        side === "left" ? "left-3" : "right-3"
      }`}
    >
      {side === "left" ? "‹" : "›"}
    </button>
  );
}
