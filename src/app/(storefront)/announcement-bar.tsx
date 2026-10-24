import { getBarContent } from "@/lib/promo";
import { AnnouncementTicker } from "./announcement-ticker";

// Slim message strip above the header: the owner's announcements, or the best running sale
export async function AnnouncementBar() {
  const items = await getBarContent();
  if (items.length === 0) return null;
  return <AnnouncementTicker items={items} />;
}
