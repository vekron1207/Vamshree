import Link from "next/link";
import { getBarContent } from "@/lib/promo";

// Slim message above the header: the owner's announcement, or the best running sale
export async function AnnouncementBar() {
  const bar = await getBarContent();
  if (!bar) return null;
  const external = bar.href.startsWith("https://");
  const cls =
    "block bg-forest px-4 py-2 text-center text-[11px] uppercase tracking-[0.18em] text-gold transition-colors hover:bg-forest-deep print:hidden";
  const inner = (
    <>
      <span aria-hidden className="mr-2">&#10022;</span>
      {bar.text}
      <span aria-hidden className="ml-2">&rarr;</span>
    </>
  );
  return external ? (
    <a href={bar.href} target="_blank" rel="noopener noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <Link href={bar.href} className={cls}>
      {inner}
    </Link>
  );
}
