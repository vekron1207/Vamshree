"use client";

import { useSubmit } from "@/lib/use-submit";
import { useActionState } from "react";
import { FormAlert, SubmitButton, TextInput } from "@/components/ui/fields";
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
      <TextInput label="Full name" name="name" required error={e.name} defaultValue={name} htmlInput={{ autoComplete: "name" }} />
      <TextInput label="Email" name="email" type="email" required error={e.email} defaultValue={email} htmlInput={{ autoComplete: "email" }} />
      <TextInput label="Mobile number" name="phone" type="tel" required error={e.phone} hint="10-digit Indian number." defaultValue={phone} htmlInput={{ autoComplete: "tel", inputMode: "tel" }} />
      <FormAlert>{state.error}</FormAlert>
      <div className="flex items-center gap-5">
        <SubmitButton pending={pending} pendingText="Saving...">
          Save details
        </SubmitButton>
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
      <TextInput label="Current password" name="current" type="password" required error={e.current} htmlInput={{ autoComplete: "current-password" }} />
      <TextInput label="New password" name="next" type="password" required error={e.next} hint="At least 8 characters, with a letter and a number." htmlInput={{ autoComplete: "new-password" }} />
      <TextInput label="Confirm new password" name="confirm" type="password" required error={e.confirm} htmlInput={{ autoComplete: "new-password" }} />
      <FormAlert>{state.error}</FormAlert>
      <div className="flex items-center gap-5">
        <SubmitButton pending={pending} pendingText="Updating...">
          Change password
        </SubmitButton>
        {!pending && state.saved ? <span role="status" className="text-sm text-emerald-700">Password updated &#10003;</span> : null}
      </div>
    </form>
  );
}
