"use client";

import { useSubmit } from "@/lib/use-submit";
import Link from "next/link";
import { useActionState } from "react";
import InputAdornment from "@mui/material/InputAdornment";
import { signupAction, type AuthState } from "../auth-actions";
import { FormAlert, SubmitButton, TextInput } from "@/components/ui/fields";
import { useSamplePhone } from "@/lib/use-sample-phone";

export function SignupForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signupAction, {});
  const onSubmit = useSubmit(action);
  const e = state.fieldErrors ?? {};
  const samplePhone = useSamplePhone();

  return (
    <form onSubmit={onSubmit} className="mt-10 space-y-6" noValidate>
      <input type="hidden" name="next" value={next} />
      <TextInput label="Full name" name="name" required autoFocus error={e.name} htmlInput={{ autoComplete: "name" }} />
      <TextInput label="Email" name="email" type="email" required error={e.email} htmlInput={{ autoComplete: "email", inputMode: "email" }} />
      <TextInput
        label="Mobile number"
        name="phone"
        type="tel"
        required
        placeholder={samplePhone}
        error={e.phone}
        hint="10-digit Indian number. We use it for delivery updates."
        htmlInput={{ autoComplete: "tel-national", inputMode: "numeric" }}
        slotProps={{ input: { startAdornment: <InputAdornment position="start">+91</InputAdornment> } }}
      />
      <TextInput label="Password" name="password" type="password" required error={e.password} hint="At least 8 characters, with a letter and a number." htmlInput={{ autoComplete: "new-password" }} />
      <TextInput label="Confirm password" name="confirm" type="password" required error={e.confirm} htmlInput={{ autoComplete: "new-password" }} />
      <FormAlert>{state.error}</FormAlert>
      <SubmitButton pending={pending} pendingText="Creating account..." size="large" fullWidth>
        Create account
      </SubmitButton>
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
