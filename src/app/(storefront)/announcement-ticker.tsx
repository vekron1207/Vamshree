"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { BarItem } from "@/lib/promo";

const noopSubscribe = () => () => {};
const prefersReduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function CodePill({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        let ok = false;
        try {
          await navigator.clipboard.writeText(code);
          ok = true;
        } catch {
          // Older or locked-down browsers: select a hidden field and use the classic command
          const field = document.createElement("textarea");
          field.value = code;
          field.setAttribute("readonly", "");
          field.style.position = "fixed";
          field.style.opacity = "0";
          document.body.appendChild(field);
          field.select();
          try {
            ok = document.execCommand("copy");
          } catch {
            ok = false;
          }
          field.remove();
        }
        if (ok) {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
        }
      }}
      aria-label={`Coupon code ${code}. Tap to copy.`}
      className="ml-2 inline-flex items-center gap-1.5 rounded border border-dashed border-gold bg-gold px-2.5 py-0.5 text-[12px] font-medium tracking-[0.14em] text-forest-deep transition-colors hover:bg-gold-soft"
    >
      {copied ? "COPIED" : code}
    </button>
  );
}

// All messages sit side by side on wide screens. On phones they take turns, one
// at a time, so each stays readable; people who prefer less motion see them stacked.
export function AnnouncementTicker({ items }: { items: BarItem[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useSyncExternalStore(noopSubscribe, prefersReduced, () => false);
  const rotate = items.length > 1 && !reduced;

  useEffect(() => {
    if (!rotate || paused) return;
    const id = window.setInterval(() => setActive((i) => (i + 1) % items.length), 4500);
    return () => window.clearInterval(id);
  }, [rotate, paused, items.length]);

  return (
    <div
      className="bg-forest text-gold print:hidden"
      role="region"
      aria-label="Announcements"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-x-10 gap-y-1 px-4 py-2.5 text-center lg:flex-row lg:flex-wrap">
        {items.map((item, i) => {
          const external = item.href.startsWith("https://");
          const textClass =
            "text-[11px] uppercase leading-snug tracking-[0.16em] transition-colors hover:text-gold-soft sm:text-xs";
          const label = (
            <>
              <span aria-hidden className="mr-2">&#10022;</span>
              {item.text}
            </>
          );
          return (
            <div
              key={i}
              className={`${!rotate || i === active ? "flex" : "hidden"} flex-wrap items-center justify-center lg:flex`}
            >
              {external ? (
                <a href={item.href} target="_blank" rel="noopener noreferrer" className={textClass}>
                  {label}
                </a>
              ) : (
                <Link href={item.href} className={textClass}>
                  {label}
                </Link>
              )}
              {item.code ? <CodePill code={item.code} /> : null}
            </div>
          );
        })}
        {rotate ? (
          <div className="flex gap-1.5 lg:hidden" aria-hidden>
            {items.map((_, i) => (
              <span key={i} className={`h-1 w-4 rounded-full transition-colors ${i === active ? "bg-gold" : "bg-gold/30"}`} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
