import { connection } from "next/server";
import { getAnnouncement, getBusinessInfo, getShippingRule, getStoreSettings } from "@/lib/settings";
import { AnnouncementCard, BusinessCard, ShippingCard, StoreCard } from "./settings-forms";

export const instant = false;

export default async function SettingsPage() {
  await connection();
  const [rule, business, store, announcement] = await Promise.all([getShippingRule(), getBusinessInfo(), getStoreSettings(), getAnnouncement()]);
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-forest">Settings</h1>
      <div className="grid max-w-3xl gap-6">
        <AnnouncementCard announcement={announcement} />
        <ShippingCard rule={rule} />
        <BusinessCard business={business} />
        <StoreCard store={store} />
      </div>
    </div>
  );
}
