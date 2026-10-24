"use client";

import type { ReactNode } from "react";
import Alert from "@mui/material/Alert";
import Button, { type ButtonProps } from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import TextField, { type TextFieldProps } from "@mui/material/TextField";

type TextInputProps = Omit<TextFieldProps, "error" | "helperText"> & {
  /** Small grey help text under the field */
  hint?: ReactNode;
  /** An error message; turns the field red and replaces the hint */
  error?: string | boolean;
  /** Attributes for the real <input>, e.g. min, max, maxLength, autoComplete, inputMode */
  htmlInput?: Record<string, unknown>;
};

// Material text field in the shop's look: underlined, floating label
export function TextInput({ hint, error, htmlInput, slotProps, ...rest }: TextInputProps) {
  const message = typeof error === "string" ? error : undefined;
  return (
    <TextField
      {...rest}
      error={Boolean(error)}
      helperText={message ?? hint}
      slotProps={{
        ...slotProps,
        htmlInput: { ...(htmlInput ?? {}), ...((slotProps as { htmlInput?: object } | undefined)?.htmlInput ?? {}) },
        // A label that sits inside the field would collide with a placeholder or a value
        inputLabel: { shrink: rest.placeholder || rest.value !== undefined || rest.defaultValue !== undefined || rest.type === "date" ? true : undefined, ...((slotProps as { inputLabel?: object } | undefined)?.inputLabel ?? {}) },
      }}
    />
  );
}

// A dropdown with Material's animated menu. Submits with its form like a normal field.
export function SelectInput({ children, ...rest }: Omit<TextInputProps, "select"> & { children: ReactNode }) {
  return (
    <TextInput {...rest} select>
      {children}
    </TextInput>
  );
}

// Submit button that shows a spinner while saving
export function SubmitButton({
  pending,
  children,
  pendingText,
  ...rest
}: ButtonProps & { pending?: boolean; pendingText?: ReactNode }) {
  return (
    <Button type="submit" variant="contained" disabled={pending || rest.disabled} {...rest}>
      {pending ? (
        <>
          <CircularProgress size={14} color="inherit" sx={{ mr: 1 }} />
          {pendingText ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

export function FormAlert({ children, severity = "error" }: { children?: ReactNode; severity?: "error" | "success" | "info" | "warning" }) {
  if (!children) return null;
  return (
    <Alert severity={severity} role={severity === "error" ? "alert" : "status"} sx={{ alignItems: "center" }}>
      {children}
    </Alert>
  );
}

// Admin screens use outlined, compact fields
export function AdminInput(props: TextInputProps) {
  return <TextInput variant="outlined" size="small" {...props} />;
}

export function AdminSelect({ children, ...rest }: Omit<TextInputProps, "select"> & { children: ReactNode }) {
  return (
    <TextInput variant="outlined" size="small" {...rest} select slotProps={{ ...rest.slotProps, select: { displayEmpty: true, ...((rest.slotProps as { select?: object } | undefined)?.select ?? {}) } }}>
      {children}
    </TextInput>
  );
}

// A labelled on/off switch. Submits like a checkbox: `name` is present when on.
export function SwitchRow({
  name,
  label,
  description,
  defaultChecked,
  checked,
  onChange,
}: {
  name?: string;
  label: ReactNode;
  description?: ReactNode;
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <FormControlLabel
      labelPlacement="start"
      sx={{ display: "flex", justifyContent: "space-between", m: 0, width: "100%", gap: 2 }}
      control={
        <Switch
          name={name}
          defaultChecked={checked === undefined ? defaultChecked : undefined}
          checked={checked}
          onChange={onChange ? (e) => onChange(e.target.checked) : undefined}
        />
      }
      label={
        <span>
          <span className="block font-medium text-ink">{label}</span>
          {description ? <span className="block text-xs text-ink/50">{description}</span> : null}
        </span>
      }
    />
  );
}
