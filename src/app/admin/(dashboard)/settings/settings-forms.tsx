"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useSubmit } from "@/lib/use-submit";
import type { Announcement, BusinessInfo, StoreSettings } from "@/lib/settings";
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
  return (
    <SettingsCard
      title="Announcement bar"
      description="A slim message above the header on every page. When it is off, the bar shows your best running collection sale automatically."
      action={saveAnnouncement}
    >
      <label className="flex items-center gap-2.5 text-sm text-ink sm:col-span-2">
        <input type="checkbox" name="enabled" defaultChecked={announcement.enabled} className="h-4 w-4 accent-forest" />
        Show my own message
      </label>
      <Field label="Message" hint="Up to 140 characters, e.g. Free shipping on orders above Rs 2,999" className="sm:col-span-2">
        <input name="text" maxLength={140} defaultValue={announcement.text} className={inputClass} />
      </Field>
      <Field label="Link (optional)" hint="Where the bar goes when clicked, e.g. /products or /collections/golden-hour-story" className="sm:col-span-2">
        <input name="link" defaultValue={announcement.link} className={inputClass} />
      </Field>
    </SettingsCard>
  );
}
