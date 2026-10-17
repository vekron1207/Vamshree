import Link from "next/link";
import { getVisibleCollections } from "@/lib/collections";

export async function DrawerCollectionLinks() {
  const collections = await getVisibleCollections();
  return (
    <ul className="mt-3 space-y-1">
      {collections.map((c) => (
        <li key={c.id}>
          <Link
            href={`/collections/${c.slug}`}
            className="flex items-center gap-2 py-1.5 font-tagline text-lg italic text-ink/80"
          >
            {c.name}
            {c.saleLabel ? (
              <span className="rounded-full bg-terracotta px-2 py-0.5 font-sans text-[10px] not-italic uppercase tracking-[0.12em] text-cream">
                Sale
              </span>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export async function FooterCollectionLinks() {
  const collections = await getVisibleCollections();
  return collections.map((c) => (
    <li key={c.id}>
      <Link href={`/collections/${c.slug}`} className="transition-colors hover:text-forest">
        {c.name}
      </Link>
    </li>
  ));
}
