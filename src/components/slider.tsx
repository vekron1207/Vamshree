"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardIcon from "@mui/icons-material/ArrowForwardRounded";

// Swipeable row: native scroll-snap (so touch just works) plus arrow buttons
// and optional gentle auto-advance that pauses while someone is interacting.
export function Slider({
  children,
  label,
  autoplayMs,
  className = "",
}: {
  children: ReactNode;
  label: string;
  autoplayMs?: number;
  className?: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const [edges, setEdges] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  const step = useCallback((dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const first = el.firstElementChild as HTMLElement | null;
    const gap = parseFloat(getComputedStyle(el).columnGap || "0") || 0;
    const amount = first ? first.getBoundingClientRect().width + gap : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  useEffect(() => {
    if (!autoplayMs || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      const el = track.current;
      if (!el || paused.current || document.hidden) return;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 4) el.scrollTo({ left: 0, behavior: "smooth" });
      else step(1);
    }, autoplayMs);
    return () => window.clearInterval(id);
  }, [autoplayMs, step]);

  const arrow = {
    width: 42,
    height: 42,
    border: "1px solid rgba(14,59,34,0.25)",
    color: "primary.main",
    "&:hover": { backgroundColor: "primary.main", color: "#fff" },
    "&.Mui-disabled": { opacity: 0.3 },
  } as const;

  return (
    <div
      className={className}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
      onFocus={() => (paused.current = true)}
      onBlur={() => (paused.current = false)}
      onTouchStart={() => (paused.current = true)}
      onTouchEnd={() => window.setTimeout(() => (paused.current = false), 4000)}
    >
      <div className="mb-5 hidden justify-end gap-2 sm:flex">
        <IconButton aria-label={`Previous ${label}`} disabled={edges.start} onClick={() => step(-1)} sx={arrow}>
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <IconButton aria-label={`Next ${label}`} disabled={edges.end} onClick={() => step(1)} sx={arrow}>
          <ArrowForwardIcon fontSize="small" />
        </IconButton>
      </div>
      <div
        ref={track}
        onScroll={measure}
        className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-6 pb-2 [scrollbar-width:none] sm:gap-6 [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
    </div>
  );
}

// Slide wrapper: set the width per breakpoint with className
export function Slide({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`shrink-0 snap-start ${className}`}>{children}</div>;
}
