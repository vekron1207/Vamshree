import "server-only";
import { getVisibleCollections } from "@/lib/collections";
import { getAnnouncement } from "@/lib/settings";

export type ActiveSale = {
  slug: string;
  name: string;
  percent: number;
  label: string;
  endsAt: string | null;
};

// Collections whose sale is running right now, biggest discount first.
// Driven by the sale settings on each collection, so there is nothing extra to maintain.
export async function getActiveSales(): Promise<ActiveSale[]> {
  const collections = await getVisibleCollections();
  return collections
    .filter((c) => c.salePercent > 0)
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      percent: c.salePercent,
      label: c.saleLabel ?? `${c.salePercent}% off`,
      endsAt: c.saleEndsAt ? c.saleEndsAt.toISOString() : null,
    }))
    .sort((a, b) => b.percent - a.percent);
}

export type BarItem = { text: string; code: string; href: string };

// What the slim bar above the header says: the owner's own messages if they are
// switched on, otherwise the best running collection sale.
export async function getBarContent(): Promise<BarItem[]> {
  const custom = await getAnnouncement();
  if (custom.enabled && custom.items.length > 0) {
    return custom.items.map((i) => ({ text: i.text, code: i.code, href: i.link || "/products" }));
  }
  const [top] = await getActiveSales();
  if (!top) return [];
  const ends = top.endsAt
    ? ` · Ends ${new Date(top.endsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })}`
    : "";
  return [{ text: `${top.name}: ${top.label}${ends}`, code: "", href: `/collections/${top.slug}` }];
}
