"use client";

import { useSubmit } from "@/lib/use-submit";
import Link from "next/link";
import { useActionState } from "react";
import { Field, FormError, INDIAN_STATES, PrimaryButton } from "../../ui";
import type { FormState } from "../actions";

export type AddressInitial = {
  label?: string;
  fullName?: string;
  phone?: string;
  line1?: string;
  line2?: string | null;
  city?: string;
  state?: string;
  postalCode?: string;
  isDefault?: boolean;
};

export function AddressForm({
  action,
  initial,
  isFirst,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial?: AddressInitial;
  isFirst?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const onSubmit = useSubmit(formAction);
  const e = state.fieldErrors ?? {};

  return (
    <form onSubmit={onSubmit} className="mt-8 grid max-w-2xl gap-6 sm:grid-cols-2" noValidate>
      <Field label="Label" error={e.label} hint="e.g. Home, Work" className="sm:col-span-2">
        <input name="label" defaultValue={initial?.label ?? "Home"} maxLength={30} />
      </Field>
      <Field label="Recipient name" error={e.fullName}>
        <input name="fullName" required defaultValue={initial?.fullName} autoComplete="name" />
      </Field>
      <Field label="Mobile number" error={e.phone}>
        <input name="phone" type="tel" required defaultValue={initial?.phone} autoComplete="tel" inputMode="tel" placeholder="98765 43210" />
      </Field>
      <Field label="Address" error={e.line1} className="sm:col-span-2">
        <input name="line1" required defaultValue={initial?.line1} autoComplete="address-line1" />
      </Field>
      <Field label="Apartment, landmark (optional)" className="sm:col-span-2">
        <input name="line2" defaultValue={initial?.line2 ?? ""} autoComplete="address-line2" />
      </Field>
      <Field label="City" error={e.city}>
        <input name="city" required defaultValue={initial?.city} autoComplete="address-level2" />
      </Field>
      <Field label="State" error={e.state}>
        <select name="state" required defaultValue={initial?.state ?? ""} autoComplete="address-level1">
          <option value="" disabled>
            Choose a state
          </option>
          {INDIAN_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>
      <Field label="PIN code" error={e.postalCode}>
        <input name="postalCode" required defaultValue={initial?.postalCode} inputMode="numeric" maxLength={6} autoComplete="postal-code" />
      </Field>
      <div className="flex items-end pb-2">
        <label className="flex items-center gap-2.5 text-sm text-ink">
          <input
            type="checkbox"
            name="isDefault"
            defaultChecked={initial?.isDefault || isFirst}
            disabled={initial?.isDefault}
            className="h-4 w-4 accent-forest"
          />
          Use as my default address
        </label>
        {initial?.isDefault ? <input type="hidden" name="isDefault" value="on" /> : null}
      </div>

      <div className="sm:col-span-2">
        <FormError>{state.error}</FormError>
        <div className="mt-2 flex items-center gap-5">
          <PrimaryButton pending={pending} pendingText="Saving...">
            Save address
          </PrimaryButton>
          <Link href="/account/addresses" className="text-sm text-ink/55 hover:text-ink">
            Cancel
          </Link>
        </div>
      </div>
    </form>
  );
}
