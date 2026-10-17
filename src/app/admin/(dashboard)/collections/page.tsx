import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { activeSalePercent } from "@/lib/pricing";
import { endCollectionSale } from "./actions";

// Authenticated admin views always render fresh per request; navigations are
// allowed to wait for data rather than requiring a prerendered shell.
export const instant = false;

function formatWhen(d: Date) {
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export default async function AdminCollectionsPage() {
  await connection();
  const collections = await prisma.collection.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { products: true } },
      products: { where: { isActive: true }, select: { id: true } },
    },
  });
  const now = new Date();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-gold">Catalogue</p>
          <h1 className="mt-1 font-display text-3xl text-forest">Collections</h1>
        </div>
        <Link
          href="/admin/collections/new"
          className="rounded-full bg-forest px-5 py-2.5 text-sm text-cream transition-colors hover:bg-forest-deep"
        >
          New collection
        </Link>
      </header>

      {collections.length === 0 ? (
        <div className="rounded-2xl bg-paper px-6 py-16 text-center shadow-[0_1px_2px_rgba(18,20,15,0.06)]">
          <p className="text-ink/60">Group products into stories customers can browse.</p>
          <Link href="/admin/collections/new" className="mt-4 inline-block text-sm text-forest underline">
            Create your first collection
          </Link>
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2">
          {collections.map((c) => {
            const live = activeSalePercent(c, now);
            const scheduled = c.saleEnabled && !live && c.saleStartsAt && now < c.saleStartsAt;
            return (
              <li
                key={c.id}
                className="overflow-hidden rounded-2xl bg-paper shadow-[0_1px_2px_rgba(18,20,15,0.06)] transition-shadow hover:shadow-md"
              >
                <Link href={`/admin/collections/${c.id}`} className="block">
                  <div className="relative aspect-[1200/630] bg-cream">
                    {c.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-sm text-ink/40">
                        No banner yet
                      </span>
                    )}
                    {!c.isVisible ? (
                      <span className="absolute left-3 top-3 rounded-full bg-ink/80 px-2.5 py-0.5 text-xs text-cream">
                        Hidden
                      </span>
                    ) : null}
                  </div>
                  <div className="px-5 pb-2 pt-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-display text-lg text-forest">{c.name}</p>
                      <p className="shrink-0 text-xs text-ink/50">
                        {c.products.length} live &middot; {c._count.products} total
                      </p>
                    </div>
                  </div>
                </Link>
                <div className="flex min-h-12 items-center justify-between gap-3 px-5 pb-4">
                  {live ? (
                    <>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-terracotta/10 px-2.5 py-0.5 text-xs text-terracotta ring-1 ring-inset ring-terracotta/25">
                        <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                        Sale live: {live}% off
                        {c.saleEndsAt ? ` until ${formatWhen(c.saleEndsAt)}` : ""}
                      </span>
                      <form action={endCollectionSale.bind(null, c.id)}>
                        <button type="submit" className="text-xs text-ink/50 underline-offset-4 hover:text-rose-700 hover:underline">
                          End sale
                        </button>
                      </form>
                    </>
                  ) : scheduled ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs text-sky-800 ring-1 ring-inset ring-sky-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                      {c.salePercent}% off from {formatWhen(c.saleStartsAt!)}
                    </span>
                  ) : (
                    <span className="text-xs text-ink/40">No sale running</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
