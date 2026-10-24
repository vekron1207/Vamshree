"use client";

import { useSubmit } from "@/lib/use-submit";
import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type AuthState } from "../auth-actions";
import { FormAlert, SubmitButton, TextInput } from "@/components/ui/fields";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(loginAction, {});
  const onSubmit = useSubmit(action);

  return (
    <form onSubmit={onSubmit} className="mt-10 space-y-6">
      <input type="hidden" name="next" value={next} />
      <TextInput label="Email or mobile number" name="identifier" required autoFocus htmlInput={{ autoComplete: "username" }} />
      <TextInput label="Password" name="password" type="password" required htmlInput={{ autoComplete: "current-password" }} />
      <FormAlert>{state.error}</FormAlert>
      <SubmitButton pending={pending} pendingText="Signing in..." size="large" fullWidth>
        Sign in
      </SubmitButton>
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
