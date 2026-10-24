import { connection } from "next/server";
import { DEFAULT_HERO, getAnnouncement, getBusinessInfo, getHeroVideos, getShippingRule, getStoreSettings } from "@/lib/settings";
import { AnnouncementCard, BusinessCard, ShippingCard, StoreCard } from "./settings-forms";
import { HeroVideoCard } from "./hero-video-card";

export const instant = false;

export default async function SettingsPage() {
  await connection();
  const [rule, business, store, announcement, hero] = await Promise.all([getShippingRule(), getBusinessInfo(), getStoreSettings(), getAnnouncement(), getHeroVideos()]);
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-forest">Settings</h1>
      <div className="grid max-w-3xl gap-6">
        <HeroVideoCard
          desktop={{ url: hero.desktop, custom: hero.customDesktop }}
          mobile={{ url: hero.mobile, custom: hero.customMobile }}
          defaults={DEFAULT_HERO}
        />
        <AnnouncementCard announcement={announcement} />
        <ShippingCard rule={rule} />
        <BusinessCard business={business} />
        <StoreCard store={store} />
      </div>
    </div>
  );
}
