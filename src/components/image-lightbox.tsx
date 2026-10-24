"use client";

import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/CloseRounded";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightIcon from "@mui/icons-material/ChevronRightRounded";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export type LightboxImage = { url: string; alt: string };

type View = { scale: number; x: number; y: number };

const MIN = 1;
const MAX = 4;
const DOUBLE_TAP_SCALE = 2.5;
const RESET: View = { scale: 1, x: 0, y: 0 };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function ImageLightbox({
  images,
  index,
  onIndexChange,
  onClose,
}: {
  images: LightboxImage[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}) {
  const [view, setView] = useState<View>(RESET);
  const [dragX, setDragX] = useState(0); // swipe feedback when not zoomed
  const [animate, setAnimate] = useState(true);
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  // Gesture handlers need the latest view synchronously between renders.
  // Written only from handlers (applyView) and after commit, never in render.
  const viewRef = useRef(view);
  useLayoutEffect(() => {
    viewRef.current = view;
  }, [view]);
  const applyView = useCallback((v: View) => {
    viewRef.current = v;
    setView(v);
  }, []);

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{
    startView: View;
    startDist?: number;
    startMid?: { x: number; y: number };
    startPoint?: { x: number; y: number };
    moved: boolean;
  } | null>(null);
  const lastTap = useRef<{ t: number; x: number; y: number } | null>(null);

  const count = images.length;
  const go = useCallback(
    (delta: number) => {
      if (count < 2) return;
      onIndexChange((index + delta + count) % count);
    },
    [count, index, onIndexChange]
  );

  // Reset zoom whenever the photo changes (state derived from props, no effect)
  const [shownIndex, setShownIndex] = useState(index);
  if (shownIndex !== index) {
    setShownIndex(index);
    setView(RESET);
    setDragX(0);
  }

  // Keep pan inside the image so it can't be dragged off screen
  const clampView = useCallback((v: View): View => {
    const img = imgRef.current;
    const stage = stageRef.current;
    if (!img || !stage) return v;
    const scale = clamp(v.scale, MIN, MAX);
    const maxX = Math.max(0, (img.offsetWidth * scale - stage.clientWidth) / 2);
    const maxY = Math.max(0, (img.offsetHeight * scale - stage.clientHeight) / 2);
    return { scale, x: clamp(v.x, -maxX, maxX), y: clamp(v.y, -maxY, maxY) };
  }, []);

  // Zoom so the image point under (clientX, clientY) stays put
  const zoomAt = useCallback(
    (nextScale: number, clientX: number, clientY: number, from: View = viewRef.current) => {
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      const px = clientX - rect.left - rect.width / 2;
      const py = clientY - rect.top - rect.height / 2;
      const s = clamp(nextScale, MIN, MAX);
      const ratio = s / from.scale;
      applyView(clampView({ scale: s, x: px - (px - from.x) * ratio, y: py - (py - from.y) * ratio }));
    },
    [clampView, applyView]
  );

  const zoomBy = (factor: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    const r = stage.getBoundingClientRect();
    setAnimate(true);
    zoomAt(viewRef.current.scale * factor, r.left + r.width / 2, r.top + r.height / 2);
  };

  // Keyboard, scroll lock, focus handling
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "+" || e.key === "=") zoomBy(1.5);
      else if (e.key === "-") zoomBy(1 / 1.5);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [go, onClose]);

  // Wheel zoom needs a non-passive listener to stop the page from scrolling
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setAnimate(false);
      zoomAt(viewRef.current.scale * Math.exp(-e.deltaY * 0.0018), e.clientX, e.clientY);
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setAnimate(false);
    const pts = [...pointers.current.values()];
    if (pts.length === 2) {
      const [a, b] = pts;
      gesture.current = {
        startView: viewRef.current,
        startDist: Math.hypot(a.x - b.x, a.y - b.y),
        startMid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        moved: true,
      };
    } else {
      gesture.current = { startView: viewRef.current, startPoint: { x: e.clientX, y: e.clientY }, moved: false };
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    const pts = [...pointers.current.values()];

    if (pts.length >= 2 && g.startDist && g.startMid) {
      // Pinch: scale by finger distance, anchored at the midpoint
      const [a, b] = pts;
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const from = { ...g.startView, x: g.startView.x + (mid.x - g.startMid.x), y: g.startView.y + (mid.y - g.startMid.y) };
      zoomAt(g.startView.scale * (dist / g.startDist), mid.x, mid.y, from);
      return;
    }

    if (g.startPoint) {
      const dx = e.clientX - g.startPoint.x;
      const dy = e.clientY - g.startPoint.y;
      if (Math.hypot(dx, dy) > 6) g.moved = true;
      if (g.startView.scale > 1.01) {
        applyView(clampView({ ...g.startView, x: g.startView.x + dx, y: g.startView.y + dy }));
      } else if (count > 1) {
        setDragX(dx);
      }
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    const g = gesture.current;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size > 0) {
      // One finger lifted after a pinch: continue as a pan from here
      const [p] = [...pointers.current.values()];
      gesture.current = { startView: viewRef.current, startPoint: p, moved: true };
      return;
    }
    gesture.current = null;
    setAnimate(true);

    if (!g) return;
    if (viewRef.current.scale < 1.01) {
      if (Math.abs(dragX) > 60) go(dragX < 0 ? 1 : -1);
      setDragX(0);
      applyView(RESET);
    }

    if (!g.moved) {
      // Double tap / double click toggles zoom at the tapped point
      const now = Date.now();
      const last = lastTap.current;
      if (last && now - last.t < 320 && Math.hypot(e.clientX - last.x, e.clientY - last.y) < 30) {
        lastTap.current = null;
        if (viewRef.current.scale > 1.01) applyView(RESET);
        else zoomAt(DOUBLE_TAP_SCALE, e.clientX, e.clientY);
      } else {
        lastTap.current = { t: now, x: e.clientX, y: e.clientY };
      }
    }
  }

  const current = images[index];
  const zoomed = view.scale > 1.01;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Photo ${index + 1} of ${count}`}
      className="animate-[lightbox-in_240ms_ease-out] fixed inset-0 z-[100] flex flex-col bg-forest-deep/95 text-cream backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <p className="text-xs uppercase tracking-[0.18em] text-cream/60 tabular-nums">
          {index + 1} / {count}
        </p>
        <div className="flex items-center gap-1">
          <ToolButton label="Zoom out" onClick={() => zoomBy(1 / 1.5)} disabled={view.scale <= MIN}>
            &minus;
          </ToolButton>
          <span className="w-12 text-center text-xs tabular-nums text-cream/60">{Math.round(view.scale * 100)}%</span>
          <ToolButton label="Zoom in" onClick={() => zoomBy(1.5)} disabled={view.scale >= MAX}>
            +
          </ToolButton>
          <IconButton ref={closeRef} onClick={onClose} aria-label="Close" sx={{ ml: 1.5, color: "inherit" }}>
            <CloseIcon />
          </IconButton>
        </div>
      </div>

      <div
        ref={stageRef}
        className={`relative flex flex-1 touch-none select-none items-center justify-center overflow-hidden ${
          zoomed ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"
        }`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          key={current.url}
          src={current.url}
          alt={current.alt}
          draggable={false}
          className="max-h-full max-w-full object-contain will-change-transform"
          style={{
            transform: `translate3d(${view.x + dragX}px, ${view.y}px, 0) scale(${view.scale})`,
            transition: animate ? "transform 260ms cubic-bezier(0.22,1,0.36,1)" : "none",
          }}
        />

        {count > 1 ? (
          <>
            <NavButton side="left" label="Previous photo" onClick={() => go(-1)} />
            <NavButton side="right" label="Next photo" onClick={() => go(1)} />
          </>
        ) : null}

        {!zoomed ? (
          <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-forest-deep/70 px-4 py-1.5 text-xs text-cream/70">
            <span className="hidden sm:inline">Double-click or scroll to zoom</span>
            <span className="sm:hidden">Pinch or double-tap to zoom</span>
          </p>
        ) : null}
      </div>

      {count > 1 ? (
        <div className="flex justify-center gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none]">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => onIndexChange(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === index}
              className={`h-14 w-12 shrink-0 overflow-hidden rounded-t-full transition ${
                i === index ? "ring-2 ring-gold" : "opacity-50 hover:opacity-90"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>,
    document.body
  );
}

function ToolButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <IconButton aria-label={label} onClick={onClick} disabled={disabled} sx={{ color: "inherit", fontSize: 22, "&.Mui-disabled": { color: "inherit", opacity: 0.3 } }}>
      {children}
    </IconButton>
  );
}

function NavButton({ side, label, onClick }: { side: "left" | "right"; label: string; onClick: () => void }) {
  return (
    <IconButton
      aria-label={label}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClick}
      sx={{
        position: "absolute",
        top: "50%",
        transform: "translateY(-50%)",
        display: { xs: "none", sm: "inline-flex" },
        [side]: 16,
        width: 48,
        height: 48,
        color: "#fff",
        backgroundColor: "rgba(6,20,12,0.6)",
        "&:hover": { backgroundColor: "rgba(6,20,12,0.9)" },
      }}
    >
      {side === "left" ? <ChevronLeftIcon /> : <ChevronRightIcon />}
    </IconButton>
  );
}
