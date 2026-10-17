"use client";

import { useSubmit } from "@/lib/use-submit";
import Link from "next/link";
import { useActionState } from "react";
import { signupAction, type AuthState } from "../auth-actions";
import { Field, FormError, PrimaryButton } from "../ui";

export function SignupForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signupAction, {});
  const onSubmit = useSubmit(action);
  const e = state.fieldErrors ?? {};

  return (
    <form onSubmit={onSubmit} className="mt-10 space-y-6" noValidate>
      <input type="hidden" name="next" value={next} />
      <Field label="Full name" error={e.name}>
        <input name="name" required autoComplete="name" autoFocus />
      </Field>
      <Field label="Email" error={e.email}>
        <input name="email" type="email" required autoComplete="email" inputMode="email" />
      </Field>
      <Field label="Mobile number" error={e.phone} hint="10-digit Indian number. We use it for delivery updates.">
        <span className="flex items-center gap-2">
          <span className="text-ink/60">+91</span>
          <input name="phone" type="tel" required autoComplete="tel-national" inputMode="numeric" placeholder="98765 43210" className="w-full bg-transparent py-1.5 text-ink outline-none" />
        </span>
      </Field>
      <Field label="Password" error={e.password} hint="At least 8 characters, with a letter and a number.">
        <input name="password" type="password" required autoComplete="new-password" />
      </Field>
      <Field label="Confirm password" error={e.confirm}>
        <input name="confirm" type="password" required autoComplete="new-password" />
      </Field>
      <FormError>{state.error}</FormError>
      <PrimaryButton pending={pending} pendingText="Creating account..." className="w-full">
        Create account
      </PrimaryButton>
      <p className="text-center text-sm text-ink/60">
        Already have an account?{" "}
        <Link
          href={`/account/login${next !== "/account" ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="text-forest underline underline-offset-4"
        >
          Sign in
        </Link>
      </p>
      <p className="text-center text-xs leading-relaxed text-ink/45">
        By creating an account you agree to our{" "}
        <Link href="/terms" className="underline">Terms</Link> and{" "}
        <Link href="/privacy-policy" className="underline">Privacy Policy</Link>.
      </p>
    </form>
  );
}
