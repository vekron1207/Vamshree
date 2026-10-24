"use client";

import { useState, useTransition } from "react";
import { useSubmit } from "@/lib/use-submit";
import { FormAlert, SubmitButton, TextInput } from "@/components/ui/fields";
import { submitEnquiry } from "./actions";

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
      <div role="status" className="animate-rise-in rounded-2xl border border-gold/30 bg-paper px-6 py-10 text-center">
        <p className="font-display text-2xl text-forest">Thank you</p>
        <p className="mt-3 font-tagline text-lg italic text-ink/70">
          We&rsquo;ve received your message and will get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 sm:grid-cols-2">
      <TextInput label="Your name" name="name" required htmlInput={{ autoComplete: "name", maxLength: 80 }} />
      <TextInput label="Email" name="email" type="email" required htmlInput={{ autoComplete: "email", maxLength: 120 }} />
      <TextInput label="Mobile (optional)" name="phone" type="tel" placeholder="98765 43210" htmlInput={{ inputMode: "tel", autoComplete: "tel" }} sx={{ gridColumn: { sm: "1 / -1" } }} />
      <TextInput label="Your question" name="message" required multiline minRows={4} htmlInput={{ minLength: 10, maxLength: 2000 }} sx={{ gridColumn: { sm: "1 / -1" } }} />

      {/* Spam trap: real visitors never see or fill this */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="sm:col-span-2">
        <FormAlert>{error}</FormAlert>
      </div>

      <div className="sm:col-span-2">
        <SubmitButton pending={pending} pendingText="Sending..." size="large">
          Send message
        </SubmitButton>
      </div>
    </form>
  );
}
