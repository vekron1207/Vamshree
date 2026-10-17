"use client";

import { useSubmit } from "@/lib/use-submit";
import Link from "next/link";
import { useActionState, useState, useSyncExternalStore, type ReactNode } from "react";
import { formatINR } from "@/lib/format";
import { activeSalePercent, applyDiscount } from "@/lib/pricing";
import { ImageUploader } from "../image-uploader";
import type { CollectionFormState } from "./actions";

const inputClass =
  "w-full rounded-lg border border-ink/12 bg-paper px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-forest/60 focus:ring-2 focus:ring-forest/10";
const card = "rounded-2xl bg-paper p-5 shadow-[0_1px_2px_rgba(18,20,15,0.06)] sm:p-6";

export type CollectionInitial = {
  name?: string;
  slug?: string;
  tagline?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  sortOrder?: number;
  isVisible?: boolean;
  saleEnabled?: boolean;
  salePercent?: number;
  saleLabel?: string | null;
  saleStartsAt?: string | null; // ISO
  saleEndsAt?: string | null; // ISO
};

const noopSubscribe = () => () => {};

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// datetime-local has no timezone. The admin's browser converts what they
// typed into an exact instant (ISO) so the server never has to guess.
function DateTimeField({
  name,
  label,
  value,
  onChange,
}: {
  name: string;
  label: string;
  value: string | null;
  onChange: (iso: string | null) => void;
}) {
  // Local time only exists in the browser; render blank on the server, then
  // remount with the real value once hydrated.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  return (
    <Field label={label}>
      <input type="hidden" name={name} value={value ?? ""} />
      <input
        key={mounted ? "client" : "server"}
        type="datetime-local"
        defaultValue={mounted ? toLocalInput(value) : ""}
        onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
        className={inputClass}
      />
    </Field>
  );
}

export function CollectionForm({
  action,
  initial,
  productCount,
  samplePrice,
  deleteSlot,
}: {
  action: (prev: CollectionFormState, formData: FormData) => Promise<CollectionFormState>;
  initial?: CollectionInitial;
  productCount?: number;
  samplePrice?: number | null;
  deleteSlot?: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const onSubmit = useSubmit(formAction);
  const [saleEnabled, setSaleEnabled] = useState(initial?.saleEnabled ?? false);
  const [percent, setPercent] = useState(initial?.salePercent || 10);
  const [label, setLabel] = useState(initial?.saleLabel ?? "");
  const [startsAt, setStartsAt] = useState<string | null>(initial?.saleStartsAt ?? null);
  const [endsAt, setEndsAt] = useState<string | null>(initial?.saleEndsAt ?? null);

  const example = samplePrice && samplePrice > 0 ? samplePrice : 2499;
  const sale = {
    saleEnabled,
    salePercent: percent,
    saleLabel: label || null,
    saleStartsAt: startsAt ? new Date(startsAt) : null,
    saleEndsAt: endsAt ? new Date(endsAt) : null,
  };
  const now = new Date();
  const liveNow = activeSalePercent(sale, now) > 0;
  const status = !saleEnabled
    ? { text: "Off", tone: "bg-ink/5 text-ink/60 ring-ink/10" }
    : percent < 1 || percent > 90
      ? { text: "Discount must be 1-90%", tone: "bg-rose-50 text-rose-800 ring-rose-200" }
      : liveNow
        ? { text: "Live now", tone: "bg-emerald-50 text-emerald-800 ring-emerald-200" }
        : sale.saleStartsAt && now < sale.saleStartsAt
          ? { text: "Scheduled", tone: "bg-sky-50 text-sky-800 ring-sky-200" }
          : { text: "Ended", tone: "bg-amber-50 text-amber-800 ring-amber-200" };

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div className="space-y-6">
        <section className={card}>
          <div className="space-y-5">
            <Field label="Name">
              <input name="name" defaultValue={initial?.name} required className={inputClass} />
            </Field>
            <Field label="Tagline" hint="One short line shown under the name, e.g. Inspired by moonlit evenings.">
              <input name="tagline" defaultValue={initial?.tagline ?? ""} maxLength={120} className={inputClass} />
            </Field>
            <Field label="Story">
              <textarea
                name="description"
                defaultValue={initial?.description ?? ""}
                rows={6}
                className={`${inputClass} leading-relaxed`}
              />
            </Field>
          </div>
        </section>

        <section className={card}>
          <h2 className="font-medium text-ink">Banner</h2>
          <div className="mt-4">
            <ImageUploader
              name="imageUrl"
              kind="collections"
              initial={initial?.imageUrl ? [initial.imageUrl] : []}
              aspect="aspect-[1200/630]"
              hint="Wide images work best - around 1200 × 630 or larger."
            />
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <section className={card}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-medium text-ink">Collection sale</h2>
            <span className={`rounded-full px-2.5 py-0.5 text-xs ring-1 ring-inset ${status.tone}`}>
              {status.text}
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-ink/50">
            Discounts every product in this collection only. Other collections keep their normal prices.
          </p>

          <Toggle
            name="saleEnabled"
            checked={saleEnabled}
            onChange={setSaleEnabled}
            label="Run a sale on this collection"
          />

          {/* inert rather than disabled: disabled fields aren't submitted, which
              would erase a saved schedule just by switching the sale off */}
          <fieldset
            inert={!saleEnabled}
            className={`mt-4 space-y-4 transition-opacity ${saleEnabled ? "" : "opacity-40"}`}
          >
            <div className="grid grid-cols-2 gap-4">
              <Field label="Discount %">
                <input
                  name="salePercent"
                  type="number"
                  min={1}
                  max={90}
                  step={1}
                  value={percent}
                  onChange={(e) => setPercent(Number(e.target.value))}
                  className={inputClass}
                />
              </Field>
              <Field label="Badge text">
                <input
                  name="saleLabel"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder={`${percent}% off`}
                  maxLength={40}
                  className={inputClass}
                />
              </Field>
            </div>
            <DateTimeField name="saleStartsAt" label="Starts (optional)" value={startsAt} onChange={setStartsAt} />
            <DateTimeField name="saleEndsAt" label="Ends (optional)" value={endsAt} onChange={setEndsAt} />

            <div className="rounded-lg bg-cream/70 px-4 py-3 text-sm">
              <p className="text-xs uppercase tracking-[0.08em] text-ink/50">Example</p>
              <p className="mt-1">
                <span className="text-ink/40 line-through">{formatINR(example)}</span>{" "}
                <span className="font-medium text-terracotta">
                  {formatINR(applyDiscount(example, percent >= 1 && percent <= 90 ? percent : 0))}
                </span>
                {productCount !== undefined ? (
                  <span className="text-ink/50"> &middot; applies to {productCount} products</span>
                ) : null}
              </p>
            </div>
          </fieldset>
        </section>

        <section className={card}>
          <h2 className="font-medium text-ink">Display</h2>
          <div className="mt-4 space-y-4">
            <Toggle
              name="isVisible"
              checked={undefined}
              defaultChecked={initial?.isVisible ?? true}
              label="Show on storefront"
            />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Order" hint="Lower shows first.">
                <input
                  name="sortOrder"
                  type="number"
                  step={1}
                  defaultValue={initial?.sortOrder ?? 0}
                  className={inputClass}
                />
              </Field>
              <Field label="URL slug" hint="Blank = from name.">
                <input name="slug" defaultValue={initial?.slug} className={inputClass} />
              </Field>
            </div>
          </div>
        </section>

        {state.error ? (
          <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {state.error}
          </p>
        ) : null}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={pending}
            className="flex-1 rounded-full bg-forest px-6 py-3 text-sm text-cream transition-colors hover:bg-forest-deep disabled:opacity-50"
          >
            {pending ? "Saving..." : "Save collection"}
          </button>
          <Link href="/admin/collections" className="rounded-full px-5 py-3 text-sm text-ink/60 hover:text-ink">
            Cancel
          </Link>
        </div>
        {deleteSlot}
      </div>
    </form>
  );
}

function Toggle({
  name,
  label,
  checked,
  defaultChecked,
  onChange,
}: {
  name: string;
  label: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (value: boolean) => void;
}) {
  return (
    <label className="mt-4 flex cursor-pointer items-center justify-between gap-4 text-sm text-ink">
      {label}
      <input
        type="checkbox"
        name={name}
        className="peer sr-only"
        {...(checked !== undefined
          ? { checked, onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.checked) }
          : { defaultChecked })}
      />
      <span className="relative h-6 w-11 shrink-0 rounded-full bg-ink/15 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-paper after:shadow after:transition-transform peer-checked:bg-forest peer-checked:after:translate-x-5 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold" />
    </label>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.08em] text-ink/55">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-xs leading-relaxed text-ink/45">{hint}</span> : null}
    </label>
  );
}
