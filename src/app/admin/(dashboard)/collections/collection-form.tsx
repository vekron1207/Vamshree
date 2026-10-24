"use client";

import { useSubmit } from "@/lib/use-submit";
import { useActionState, useState, useSyncExternalStore, type ReactNode } from "react";
import Chip from "@mui/material/Chip";
import { AdminInput, FormAlert, SubmitButton, SwitchRow } from "@/components/ui/fields";
import { LinkButton } from "@/components/ui/link-button";
import { formatINR } from "@/lib/format";
import { activeSalePercent, applyDiscount } from "@/lib/pricing";
import { ImageUploader } from "../image-uploader";
import type { CollectionFormState } from "./actions";

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
    <>
      <input type="hidden" name={name} value={value ?? ""} />
      <AdminInput
        key={mounted ? "client" : "server"}
        label={label}
        type="datetime-local"
        defaultValue={mounted ? toLocalInput(value) : ""}
        onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
        slotProps={{ inputLabel: { shrink: true } }}
      />
    </>
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
  const status: { text: string; color: "default" | "error" | "success" | "info" | "warning" } = !saleEnabled
    ? { text: "Off", color: "default" }
    : percent < 1 || percent > 90
      ? { text: "Discount must be 1-90%", color: "error" }
      : liveNow
        ? { text: "Live now", color: "success" }
        : sale.saleStartsAt && now < sale.saleStartsAt
          ? { text: "Scheduled", color: "info" }
          : { text: "Ended", color: "warning" };

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div className="space-y-6">
        <section className={card}>
          <div className="space-y-5">
            <AdminInput label="Name" name="name" defaultValue={initial?.name} required />
            <AdminInput label="Tagline" name="tagline" defaultValue={initial?.tagline ?? ""} hint="One short line shown under the name, e.g. Inspired by moonlit evenings." htmlInput={{ maxLength: 120 }} />
            <AdminInput label="Story" name="description" defaultValue={initial?.description ?? ""} multiline minRows={6} />
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
            <Chip size="small" label={status.text} color={status.color} variant="outlined" sx={{ height: 26, textTransform: "none", letterSpacing: 0 }} />
          </div>
          <p className="mt-1 text-xs leading-relaxed text-ink/50">
            Discounts every product in this collection only. Other collections keep their normal prices.
          </p>

          <div className="mt-4">
            <SwitchRow name="saleEnabled" checked={saleEnabled} onChange={setSaleEnabled} label="Run a sale on this collection" />
          </div>

          {/* inert rather than disabled: disabled fields aren't submitted, which
              would erase a saved schedule just by switching the sale off */}
          <fieldset
            inert={!saleEnabled}
            className={`mt-4 space-y-4 transition-opacity ${saleEnabled ? "" : "opacity-40"}`}
          >
            <div className="grid grid-cols-2 gap-4">
              <AdminInput label="Discount %" name="salePercent" type="number" value={percent} onChange={(e) => setPercent(Number(e.target.value))} htmlInput={{ min: 1, max: 90, step: 1 }} />
              <AdminInput label="Badge text" name="saleLabel" value={label} onChange={(e) => setLabel(e.target.value)} placeholder={`${percent}% off`} htmlInput={{ maxLength: 40 }} />
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
            <SwitchRow name="isVisible" defaultChecked={initial?.isVisible ?? true} label="Show on storefront" />
            <div className="grid grid-cols-2 gap-4">
              <AdminInput label="Order" name="sortOrder" type="number" defaultValue={initial?.sortOrder ?? 0} hint="Lower shows first." htmlInput={{ step: 1 }} />
              <AdminInput label="URL slug" name="slug" defaultValue={initial?.slug} hint="Blank = from name." />
            </div>
          </div>
        </section>

        <FormAlert>{state.error}</FormAlert>

        <div className="flex items-center gap-3">
          <SubmitButton pending={pending} pendingText="Saving..." size="large" sx={{ flex: 1 }}>
            Save collection
          </SubmitButton>
          <LinkButton href="/admin/collections" variant="text" color="inherit">
            Cancel
          </LinkButton>
        </div>
        {deleteSlot}
      </div>
    </form>
  );
}
