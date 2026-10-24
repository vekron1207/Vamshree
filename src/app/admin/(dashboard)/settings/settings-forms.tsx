"use client";

import { useState, useTransition, type ReactNode } from "react";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/AddRounded";
import { AdminInput, FormAlert, SubmitButton, SwitchRow } from "@/components/ui/fields";
import { useSubmit } from "@/lib/use-submit";
import type { Announcement, AnnouncementItem, BusinessInfo, SaleBanner, StoreSettings } from "@/lib/settings";
import type { ShippingRule } from "@/lib/shipping";
import { saveAnnouncement, saveBusiness, saveSaleBanner, saveShipping, saveStore, type SettingsResult } from "./actions";
import { ImageUploader } from "../image-uploader";

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
        <SubmitButton pending={pending} pendingText="Saving..." size="small">
          Save
        </SubmitButton>
        {msg ? <FormAlert severity={msg.ok ? "success" : "error"}>{msg.text}</FormAlert> : null}
      </div>
    </form>
  );
}

const wide = { gridColumn: { sm: "1 / -1" } } as const;

export function ShippingCard({ rule }: { rule: ShippingRule }) {
  return (
    <SettingsCard
      title="Shipping"
      description="A flat charge, optionally free above a spend. Set the fee to 0 for free shipping on everything."
      action={saveShipping}
    >
      <AdminInput label="Flat shipping fee (₹)" name="flatFee" type="number" defaultValue={rule.flatFee} htmlInput={{ min: 0 }} />
      <AdminInput label="Free above (₹)" name="freeAbove" type="number" defaultValue={rule.freeAbove ?? ""} hint="Leave blank for no free-shipping threshold." htmlInput={{ min: 0 }} />
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
      <AdminInput label="Business name" name="legalName" defaultValue={business.legalName} required sx={wide} />
      <AdminInput label="GSTIN (optional)" name="gstin" defaultValue={business.gstin} />
      <AdminInput label="Invoice prefix" name="invoicePrefix" defaultValue={business.invoicePrefix} hint="Letters and numbers, e.g. VA" htmlInput={{ maxLength: 8 }} />
      <AdminInput label="Address" name="address" defaultValue={business.address} multiline minRows={3} sx={wide} />
      <AdminInput label="Phone" name="phone" defaultValue={business.phone} />
      <AdminInput label="Email" name="email" type="email" defaultValue={business.email} />
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
      <AdminInput label="Low-stock level" name="lowStockThreshold" type="number" defaultValue={store.lowStockThreshold} htmlInput={{ min: 0 }} />
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
      <div className="sm:col-span-2">
        <SwitchRow name="enabled" defaultChecked={announcement.enabled} label="Show these messages" />
      </div>
      {items.map((item, i) => (
        <div key={i} className="grid gap-4 rounded-xl border border-ink/10 p-4 sm:col-span-2 sm:grid-cols-2">
          <AdminInput
            label={`Message ${i + 1}`}
            hint="Up to 140 characters, e.g. Festive Season Sale"
            value={item.text}
            onChange={(e) => update(i, { text: e.target.value })}
            htmlInput={{ maxLength: 140 }}
            sx={wide}
          />
          <AdminInput
            label="Coupon code (optional)"
            hint="Shown as a tap-to-copy badge after the message"
            value={item.code}
            onChange={(e) => update(i, { code: e.target.value.toUpperCase() })}
            placeholder="VSFAM20"
            htmlInput={{ maxLength: 24, style: { textTransform: "uppercase" } }}
          />
          <AdminInput
            label="Link (optional)"
            hint="/products or /collections/golden-hour-story"
            value={item.link}
            onChange={(e) => update(i, { link: e.target.value })}
          />
          {items.length > 1 ? (
            <Button
              size="small"
              variant="text"
              color="error"
              onClick={() => setItems((list) => list.filter((_, j) => j !== i))}
              sx={{ justifySelf: "start", gridColumn: { sm: "1 / -1" } }}
            >
              Remove this message
            </Button>
          ) : null}
        </div>
      ))}
      {items.length < 4 ? (
        <Button
          size="small"
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setItems((list) => [...list, { text: "", code: "", link: "" }])}
          sx={{ justifySelf: "start", gridColumn: { sm: "1 / -1" } }}
        >
          Add a message
        </Button>
      ) : null}
    </SettingsCard>
  );
}

export function SaleBannerCard({ banner }: { banner: SaleBanner }) {
  return (
    <SettingsCard
      title="Sale banner"
      description="A picture banner on the homepage, just below the categories. Switched off, the homepage shows a simple text banner for any collection sale that is running."
      action={saveSaleBanner}
    >
      <div className="sm:col-span-2">
        <SwitchRow name="enabled" defaultChecked={banner.enabled} label="Show the banner" />
      </div>
      <div className="sm:col-span-2">
        <ImageUploader
          name="imageUrl"
          kind="pages"
          initial={banner.imageUrl ? [banner.imageUrl] : []}
          aspect="aspect-[3/2]"
          hint="Best at 3:2, such as 1800 × 1200 pixels. It is shown whole, never cropped. JPG, PNG or WebP."
        />
      </div>
      <AdminInput label="Describe the picture" name="alt" defaultValue={banner.alt} hint="Read out for people who can't see it, e.g. Festive Season Sale, flat 50% off" htmlInput={{ maxLength: 200 }} sx={wide} />
      <AdminInput label="Link (optional)" name="link" defaultValue={banner.link} placeholder="/products" hint="Where a click goes, e.g. /products or /collections/golden-hour-story" sx={wide} />
    </SettingsCard>
  );
}
