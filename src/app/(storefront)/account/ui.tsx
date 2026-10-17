import type { ReactNode } from "react";

export function Field({
  label,
  error,
  hint,
  className = "",
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label
        className={`block border-b pb-1 transition-colors focus-within:border-forest ${
          error ? "border-terracotta" : "border-ink/20"
        }`}
      >
        <span className="block text-[11px] uppercase tracking-[0.12em] text-ink/50">{label}</span>
        <span className="block [&>input]:w-full [&>input]:bg-transparent [&>input]:py-1.5 [&>input]:text-ink [&>input]:outline-none [&>select]:w-full [&>select]:bg-transparent [&>select]:py-1.5 [&>select]:text-ink [&>select]:outline-none">
          {children}
        </span>
      </label>
      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-terracotta">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink/45">{hint}</p>
      ) : null}
    </div>
  );
}

export function FormError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="border-l-2 border-terracotta bg-terracotta/5 px-4 py-3 text-sm text-terracotta">
      {children}
    </p>
  );
}

export function PrimaryButton({
  pending,
  pendingText,
  children,
  className = "",
}: {
  pending: boolean;
  pendingText: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-full bg-forest px-8 py-3.5 text-[12px] uppercase tracking-[0.18em] text-cream transition-[background-color,transform] duration-300 hover:-translate-y-0.5 hover:bg-forest-deep disabled:translate-y-0 disabled:opacity-60 ${className}`}
    >
      {pending ? pendingText : children}
    </button>
  );
}

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];
