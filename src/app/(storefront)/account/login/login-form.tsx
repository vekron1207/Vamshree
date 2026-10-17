"use client";

import { useSubmit } from "@/lib/use-submit";
import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type AuthState } from "../auth-actions";
import { Field, FormError, PrimaryButton } from "../ui";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(loginAction, {});
  const onSubmit = useSubmit(action);

  return (
    <form onSubmit={onSubmit} className="mt-10 space-y-6">
      <input type="hidden" name="next" value={next} />
      <Field label="Email or mobile number">
        <input name="identifier" required autoComplete="username" autoFocus />
      </Field>
      <Field label="Password">
        <input name="password" type="password" required autoComplete="current-password" />
      </Field>
      <FormError>{state.error}</FormError>
      <PrimaryButton pending={pending} pendingText="Signing in..." className="w-full">
        Sign in
      </PrimaryButton>
      <p className="text-center text-sm text-ink/60">
        New to Vaamshri?{" "}
        <Link
          href={`/account/signup${next !== "/account" ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="text-forest underline underline-offset-4"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
