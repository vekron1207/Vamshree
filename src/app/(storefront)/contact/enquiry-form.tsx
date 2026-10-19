"use client";

import { useState, useTransition } from "react";
import { useSubmit } from "@/lib/use-submit";
import { submitEnquiry } from "./actions";

const field =
  "block w-full border-b border-ink/20 bg-transparent py-2 text-ink outline-none transition-colors focus:border-forest";

export function EnquiryForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = useSubmit((fd) =>
    startTransition(async () => {
      setError(null);
      const res = await submitEnquiry(fd);
      if (res.ok) setSent(true);
      else setError(res.error);
    })
  );

  if (sent) {
    return (
      <div role="status" className="border border-gold/30 bg-paper px-6 py-10 text-center">
        <p className="font-display text-2xl text-forest">Thank you</p>
        <p className="mt-3 font-tagline text-lg italic text-ink/70">
          We&rsquo;ve received your message and will get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 sm:grid-cols-2">
      <label className="block">
        <span className="block text-[11px] uppercase tracking-[0.14em] text-ink/50">Your name</span>
        <input name="name" required autoComplete="name" maxLength={80} className={field} />
      </label>
      <label className="block">
        <span className="block text-[11px] uppercase tracking-[0.14em] text-ink/50">Email</span>
        <input name="email" type="email" required autoComplete="email" maxLength={120} className={field} />
      </label>
      <label className="block sm:col-span-2">
        <span className="block text-[11px] uppercase tracking-[0.14em] text-ink/50">Mobile (optional)</span>
        <input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="98765 43210" className={field} />
      </label>
      <label className="block sm:col-span-2">
        <span className="block text-[11px] uppercase tracking-[0.14em] text-ink/50">Your question</span>
        <textarea name="message" required rows={5} minLength={10} maxLength={2000} className={`${field} resize-y leading-relaxed`} />
      </label>

      {/* Spam trap: real visitors never see or fill this */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {error ? (
        <p role="alert" className="border-l-2 border-terracotta bg-terracotta/5 px-4 py-3 text-sm text-terracotta sm:col-span-2">
          {error}
        </p>
      ) : null}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-forest px-9 py-3.5 text-[12px] uppercase tracking-[0.18em] text-cream transition-[background-color,transform] duration-300 hover:-translate-y-0.5 hover:bg-forest-deep disabled:opacity-60"
        >
          {pending ? "Sending..." : "Send message"}
        </button>
      </div>
    </form>
  );
}
