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

export type BarContent = { text: string; href: string } | null;

// What the slim bar above the header says: the owner's own message if one is
// switched on, otherwise the best running sale.
export async function getBarContent(): Promise<BarContent> {
  const custom = await getAnnouncement();
  if (custom.enabled && custom.text.trim()) {
    return { text: custom.text.trim(), href: custom.link.trim() || "/products" };
  }
  const [top] = await getActiveSales();
  if (!top) return null;
  const ends = top.endsAt
    ? ` · Ends ${new Date(top.endsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })}`
    : "";
  return { text: `${top.name}: ${top.label}${ends}`, href: `/collections/${top.slug}` };
}
