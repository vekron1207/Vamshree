"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useSubmit } from "@/lib/use-submit";
import type { Announcement, AnnouncementItem, BusinessInfo, StoreSettings } from "@/lib/settings";
import type { ShippingRule } from "@/lib/shipping";
import { saveAnnouncement, saveBusiness, saveShipping, saveStore, type SettingsResult } from "./actions";

const inputClass =
  "w-full rounded-lg border border-ink/12 bg-paper px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-forest/60 focus:ring-2 focus:ring-forest/10";
const card = "rounded-2xl bg-paper p-5 shadow-[0_1px_2px_rgba(18,20,15,0.06)] sm:p-6";

function SettingsCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action: (fd: FormData) => Promise<SettingsResult>;
  children: ReactNode;
}) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const onSubmit = useSubmit((fd) =>
    startTransition(async () => {
      const res = await action(fd);
      setMsg(res.ok ? { ok: true, text: "Saved." } : { ok: false, text: res.error });
    })
  );
  return (
    <form onSubmit={onSubmit} className={card}>
      <h2 className="font-medium text-ink">{title}</h2>
      <p className="mt-1 text-xs text-ink/50">{description}</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div>
      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-forest px-6 py-2.5 text-sm text-cream hover:bg-forest-deep disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save"}
        </button>
        {msg ? (
          <span role={msg.ok ? "status" : "alert"} className={`text-sm ${msg.ok ? "text-forest" : "text-rose-700"}`}>
            {msg.text}
          </span>
        ) : null}
      </div>
    </form>
  );
}

function Field({ label, hint, className = "", children }: { label: string; hint?: string; className?: string; children: ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.08em] text-ink/55">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-xs text-ink/45">{hint}</span> : null}
    </label>
  );
}

export function ShippingCard({ rule }: { rule: ShippingRule }) {
  return (
    <SettingsCard
      title="Shipping"
      description="A flat charge, optionally free above a spend. Set the fee to 0 for free shipping on everything."
      action={saveShipping}
    >
      <Field label="Flat shipping fee (₹)">
        <input name="flatFee" type="number" min={0} defaultValue={rule.flatFee} className={inputClass} />
      </Field>
      <Field label="Free above (₹)" hint="Leave blank for no free-shipping threshold.">
        <input name="freeAbove" type="number" min={0} defaultValue={rule.freeAbove ?? ""} className={inputClass} />
      </Field>
    </SettingsCard>
  );
}

export function BusinessCard({ business }: { business: BusinessInfo }) {
  return (
    <SettingsCard
      title="Business details"
      description="Printed on invoices."
      action={saveBusiness}
    >
      <Field label="Business name" className="sm:col-span-2">
        <input name="legalName" defaultValue={business.legalName} required className={inputClass} />
      </Field>
      <Field label="GSTIN (optional)">
        <input name="gstin" defaultValue={business.gstin} className={inputClass} />
      </Field>
      <Field label="Invoice prefix" hint="Letters and numbers, e.g. VA">
        <input name="invoicePrefix" defaultValue={business.invoicePrefix} maxLength={8} className={inputClass} />
      </Field>
      <Field label="Address" className="sm:col-span-2">
        <textarea name="address" rows={3} defaultValue={business.address} className={inputClass} />
      </Field>
      <Field label="Phone">
        <input name="phone" defaultValue={business.phone} className={inputClass} />
      </Field>
      <Field label="Email">
        <input name="email" type="email" defaultValue={business.email} className={inputClass} />
      </Field>
    </SettingsCard>
  );
}

export function StoreCard({ store }: { store: StoreSettings }) {
  return (
    <SettingsCard
      title="Inventory"
      description="Products at or below this stock level are flagged as low on the dashboard and product list."
      action={saveStore}
    >
      <Field label="Low-stock level">
        <input name="lowStockThreshold" type="number" min={0} defaultValue={store.lowStockThreshold} className={inputClass} />
      </Field>
    </SettingsCard>
  );
}

export function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  const [items, setItems] = useState<AnnouncementItem[]>(
    announcement.items.length > 0 ? announcement.items : [{ text: "", code: "", link: "" }]
  );
  const update = (i: number, patch: Partial<AnnouncementItem>) =>
    setItems((list) => list.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  return (
    <SettingsCard
      title="Announcement bar"
      description="Slim messages above the header on every page, such as a sale or a coupon code. Switched off, the bar shows your best running collection sale automatically."
      action={saveAnnouncement}
    >
      <input type="hidden" name="items" value={JSON.stringify(items)} />
      <label className="flex items-center gap-2.5 text-sm text-ink sm:col-span-2">
        <input type="checkbox" name="enabled" defaultChecked={announcement.enabled} className="h-4 w-4 accent-forest" />
        Show these messages
      </label>
      {items.map((item, i) => (
        <div key={i} className="grid gap-3 rounded-xl border border-ink/10 p-4 sm:col-span-2 sm:grid-cols-[1fr_9rem]">
          <Field label={`Message ${i + 1}`} hint="Up to 140 characters, e.g. Festive Season Sale" className="sm:col-span-2">
            <input
              value={item.text}
              maxLength={140}
              onChange={(e) => update(i, { text: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Coupon code (optional)" hint="Shown as a tap-to-copy badge after the message">
            <input
              value={item.code}
              maxLength={24}
              onChange={(e) => update(i, { code: e.target.value.toUpperCase() })}
              placeholder="VSFAM20"
              className={`${inputClass} uppercase`}
            />
          </Field>
          <Field label="Link (optional)" hint="/products or /collections/golden-hour-story">
            <input value={item.link} onChange={(e) => update(i, { link: e.target.value })} className={inputClass} />
          </Field>
          {items.length > 1 ? (
            <button
              type="button"
              onClick={() => setItems((list) => list.filter((_, j) => j !== i))}
              className="justify-self-start text-xs text-rose-700 hover:underline sm:col-span-2"
            >
              Remove this message
            </button>
          ) : null}
        </div>
      ))}
      {items.length < 4 ? (
        <button
          type="button"
          onClick={() => setItems((list) => [...list, { text: "", code: "", link: "" }])}
          className="justify-self-start rounded-full border border-forest/30 px-4 py-1.5 text-xs text-forest hover:bg-forest hover:text-cream sm:col-span-2"
        >
          + Add a message
        </button>
      ) : null}
    </SettingsCard>
  );
}
