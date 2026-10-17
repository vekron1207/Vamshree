"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-[11px] uppercase tracking-[0.24em] text-gold">Something went wrong</p>
      <h1 className="mt-4 font-display text-4xl text-forest">We hit a snag</h1>
      <p className="mt-5 font-tagline text-xl italic text-ink/70">Please try again. If it keeps happening, contact us.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-10 rounded-full bg-forest px-9 py-3.5 text-[12px] uppercase tracking-[0.18em] text-cream hover:bg-forest-deep"
      >
        Try again
      </button>
      <Link href="/" className="mt-5 text-[11px] uppercase tracking-[0.16em] text-forest/70 hover:text-forest">
        Back to home
      </Link>
    </div>
  );
}
