"use client";

import { useSubmit } from "@/lib/use-submit";
import { useActionState } from "react";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import { LinkButton } from "@/components/ui/link-button";
import { FormAlert, SelectInput, SubmitButton, TextInput } from "@/components/ui/fields";
import { INDIAN_STATES } from "../../ui";
import type { FormState } from "../actions";
import { useSamplePhone } from "@/lib/use-sample-phone";

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
  const samplePhone = useSamplePhone();

  return (
    <form onSubmit={onSubmit} className="mt-8 grid max-w-2xl gap-6 sm:grid-cols-2" noValidate>
      <TextInput label="Label" name="label" error={e.label} hint="e.g. Home, Work" defaultValue={initial?.label ?? "Home"} htmlInput={{ maxLength: 30 }} sx={{ gridColumn: { sm: "1 / -1" } }} />
      <TextInput label="Recipient name" name="fullName" required error={e.fullName} defaultValue={initial?.fullName} htmlInput={{ autoComplete: "name" }} />
      <TextInput label="Mobile number" name="phone" type="tel" required error={e.phone} defaultValue={initial?.phone} placeholder={samplePhone} htmlInput={{ autoComplete: "tel", inputMode: "tel" }} />
      <TextInput label="Address" name="line1" required error={e.line1} defaultValue={initial?.line1} htmlInput={{ autoComplete: "address-line1" }} sx={{ gridColumn: { sm: "1 / -1" } }} />
      <TextInput label="Apartment, landmark (optional)" name="line2" defaultValue={initial?.line2 ?? ""} htmlInput={{ autoComplete: "address-line2" }} sx={{ gridColumn: { sm: "1 / -1" } }} />
      <TextInput label="City" name="city" required error={e.city} defaultValue={initial?.city} htmlInput={{ autoComplete: "address-level2" }} />
      <SelectInput label="State" name="state" required error={e.state} defaultValue={initial?.state ?? ""}>
        <MenuItem value="" disabled>
          Choose a state
        </MenuItem>
        {INDIAN_STATES.map((s) => (
          <MenuItem key={s} value={s}>
            {s}
          </MenuItem>
        ))}
      </SelectInput>
      <TextInput label="PIN code" name="postalCode" required error={e.postalCode} defaultValue={initial?.postalCode} htmlInput={{ inputMode: "numeric", maxLength: 6, autoComplete: "postal-code" }} />
      <div className="flex items-end">
        <FormControlLabel
          control={<Checkbox name="isDefault" defaultChecked={initial?.isDefault || isFirst} disabled={initial?.isDefault} />}
          label="Use as my default address"
        />
        {initial?.isDefault ? <input type="hidden" name="isDefault" value="on" /> : null}
      </div>

      <div className="sm:col-span-2">
        <FormAlert>{state.error}</FormAlert>
        <div className="mt-2 flex items-center gap-4">
          <SubmitButton pending={pending} pendingText="Saving...">
            Save address
          </SubmitButton>
          <LinkButton href="/account/addresses" color="inherit" variant="text" size="small">
            Cancel
          </LinkButton>
        </div>
      </div>
    </form>
  );
}
