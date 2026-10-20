"use client";

import { useSyncExternalStore } from "react";

const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!timer) timer = setInterval(() => listeners.forEach((l) => l()), 1000);
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

const now = () => Math.floor(Date.now() / 1000);

// Live "days / hours / minutes" until a sale ends. Renders nothing on the
// server (the clock is the visitor's), then ticks once a second.
export function Countdown({ endsAt, className = "" }: { endsAt: string; className?: string }) {
  const nowSec = useSyncExternalStore(subscribe, now, () => null);
  if (nowSec === null) return null;
  const left = Math.floor(new Date(endsAt).getTime() / 1000) - nowSec;
  if (left <= 0) return null;

  const d = Math.floor(left / 86400);
  const h = Math.floor((left % 86400) / 3600);
  const m = Math.floor((left % 3600) / 60);
  const s = left % 60;
  const parts: [number, string][] = d > 0 ? [[d, "days"], [h, "hrs"], [m, "min"]] : [[h, "hrs"], [m, "min"], [s, "sec"]];

  return (
    <div className={`flex gap-3 ${className}`} role="timer" aria-label="Time left in the sale">
      {parts.map(([n, label]) => (
        <div key={label} className="min-w-14 rounded-xl border border-gold/40 bg-forest-deep/60 px-3 py-2 text-center">
          <p className="font-display text-2xl tabular-nums text-gold">{String(n).padStart(2, "0")}</p>
          <p className="text-[10px] uppercase tracking-[0.16em] text-cream/60">{label}</p>
        </div>
      ))}
    </div>
  );
}
