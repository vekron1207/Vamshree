import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customer-auth";
import { formatINR } from "@/lib/format";
import { CustomerStatusBadge } from "@/lib/order-display";

// Per-customer data, always fresh: navigations may wait rather than needing a prerendered shell.
export const instant = false;


export default async function AccountOrdersPage() {
  await connection();
  const me = await requireCustomer("/account/orders");

  // Unpaid checkouts are hidden: they're abandoned carts, not orders
  const orders = await prisma.order.findMany({
    where: { customerId: me.id, status: { not: "PENDING" } },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        take: 4,
        include: { product: { select: { images: { orderBy: { position: "asc" }, take: 1 } } } },
      },
      _count: { select: { items: true } },
    },
  });

  return (
    <div>
      <h1 className="font-display text-3xl text-forest sm:text-4xl">Orders</h1>

      {orders.length === 0 ? (
        <div className="mt-10 border border-dashed border-gold/40 p-10 text-center">
          <p className="font-tagline text-xl italic text-ink/70">You haven&rsquo;t placed an order yet.</p>
          <Link href="/products" className="mt-5 inline-block text-[12px] uppercase tracking-[0.18em] text-forest underline underline-offset-8">
            Shop jewellery
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                href={`/account/orders/${o.orderNumber}`}
                className="block border border-gold/30 bg-paper p-5 transition-colors hover:border-gold"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm text-forest">{o.orderNumber}</p>
                    <p className="mt-0.5 text-xs text-ink/50">
                      {o.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <CustomerStatusBadge status={o.status} />
                </div>
                <div className="mt-4 flex items-center justify-between gap-4">
                  <div className="flex -space-x-2">
                    {o.items.map((item) => {
                      const img = item.product.images[0]?.url;
                      return (
                        <span key={item.id} className="h-12 w-10 overflow-hidden rounded-t-full bg-cream ring-2 ring-paper">
                          {img ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={img} alt="" className="h-full w-full object-cover" />
                          ) : null}
                        </span>
                      );
                    })}
                    {o._count.items > o.items.length ? (
                      <span className="flex h-12 w-10 items-center justify-center rounded-t-full bg-cream text-xs text-ink/60 ring-2 ring-paper">
                        +{o._count.items - o.items.length}
                      </span>
                    ) : null}
                  </div>
                  <p className="tabular-nums text-ink">{formatINR(Number(o.total))}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
