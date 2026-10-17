"use client";

import { useSubmit } from "@/lib/use-submit";
import { useActionState } from "react";
import { Field, FormError, PrimaryButton } from "../../ui";
import { changePasswordAction, updateProfileAction, type FormState } from "../actions";

function Saved({ at }: { at?: number }) {
  if (!at) return null;
  return (
    <span key={at} role="status" className="animate-rise-in text-sm text-emerald-700">
      Saved &#10003;
    </span>
  );
}

export function ProfileForm({ name, email, phone }: { name: string; email: string; phone: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfileAction, {});
  const onSubmit = useSubmit(action);
  const e = state.fieldErrors ?? {};
  return (
    <form onSubmit={onSubmit} className="mt-6 grid max-w-xl gap-6" noValidate>
      <Field label="Full name" error={e.name}>
        <input name="name" required defaultValue={name} autoComplete="name" />
      </Field>
      <Field label="Email" error={e.email}>
        <input name="email" type="email" required defaultValue={email} autoComplete="email" />
      </Field>
      <Field label="Mobile number" error={e.phone} hint="10-digit Indian number.">
        <input name="phone" type="tel" required defaultValue={phone} autoComplete="tel" inputMode="tel" />
      </Field>
      <FormError>{state.error}</FormError>
      <div className="flex items-center gap-5">
        <PrimaryButton pending={pending} pendingText="Saving...">
          Save details
        </PrimaryButton>
        {!pending ? <Saved at={state.saved} /> : null}
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(changePasswordAction, {});
  const onSubmit = useSubmit(action);
  const e = state.fieldErrors ?? {};
  return (
    <form onSubmit={onSubmit} className="mt-6 grid max-w-xl gap-6" noValidate key={state.saved ?? "form"}>
      <Field label="Current password" error={e.current}>
        <input name="current" type="password" required autoComplete="current-password" />
      </Field>
      <Field label="New password" error={e.next} hint="At least 8 characters, with a letter and a number.">
        <input name="next" type="password" required autoComplete="new-password" />
      </Field>
      <Field label="Confirm new password" error={e.confirm}>
        <input name="confirm" type="password" required autoComplete="new-password" />
      </Field>
      <FormError>{state.error}</FormError>
      <div className="flex items-center gap-5">
        <PrimaryButton pending={pending} pendingText="Updating...">
          Change password
        </PrimaryButton>
        {!pending && state.saved ? <span role="status" className="text-sm text-emerald-700">Password updated &#10003;</span> : null}
      </div>
    </form>
  );
}
