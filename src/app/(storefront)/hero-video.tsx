"use client";

import { useEffect, useRef, useState } from "react";
import IconButton from "@mui/material/IconButton";
import PauseIcon from "@mui/icons-material/PauseRounded";
import PlayIcon from "@mui/icons-material/PlayArrowRounded";

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

  // The browser only picks a <source> when the video loads, so crossing the
  // desktop/mobile breakpoint (resizing the window, rotating a tablet) would leave
  // the wrong film playing until a refresh. Re-run source selection on the change.
  const userPaused = useRef(false);
  useEffect(() => {
    if (!wideSrc) return;
    const mq = window.matchMedia("(min-width: 900px)");
    const onChange = () => {
      const el = main.current;
      if (!el) return;
      el.load();
      if (!userPaused.current && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        el.play().catch(() => {});
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [wideSrc]);

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
      <IconButton
        onClick={() => {
          const vids = all();
          if (vids.length === 0) return;
          if (vids[0].paused) {
            userPaused.current = false;
            setReduced(false);
            setPlaying(true);
            vids.forEach((v) => v.play().catch(() => {}));
          } else {
            userPaused.current = true;
            setPlaying(false);
            vids.forEach((v) => v.pause());
          }
        }}
        aria-label={showPlaying ? "Pause video" : "Play video"}
        sx={{
          position: "absolute",
          bottom: { xs: 20, sm: 32 },
          right: { xs: 20, sm: 32 },
          zIndex: 10,
          width: 44,
          height: 44,
          color: "#fff",
          border: "1px solid rgba(255,255,255,0.4)",
          backgroundColor: "rgba(6,20,12,0.5)",
          backdropFilter: "blur(6px)",
          "&:hover": { backgroundColor: "rgba(6,20,12,0.8)" },
        }}
      >
        {showPlaying ? <PauseIcon fontSize="small" /> : <PlayIcon fontSize="small" />}
      </IconButton>
    </>
  );
}
