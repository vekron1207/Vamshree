import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customer-auth";
import { formatINR } from "@/lib/format";
import { formatIndianPhone } from "@/lib/phone";
import { CustomerStatusBadge } from "@/lib/order-display";

// Per-customer data, always fresh: navigations may wait rather than needing a prerendered shell.
export const instant = false;


export default async function AccountOverviewPage() {
  await connection();
  const me = await requireCustomer("/account");

  const [recent, orderCount, defaultAddress] = await Promise.all([
    prisma.order.findFirst({
      where: { customerId: me.id, status: { not: "PENDING" } },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { items: true } } },
    }),
    prisma.order.count({ where: { customerId: me.id, status: { not: "PENDING" } } }),
    prisma.address.findFirst({ where: { customerId: me.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] }),
  ]);

  const firstName = me.name.split(" ")[0];

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-display text-3xl text-forest sm:text-4xl">Hello, {firstName}</h1>
        <p className="mt-2 text-ink/60">
          {orderCount > 0
            ? `You've placed ${orderCount} ${orderCount === 1 ? "order" : "orders"} with us.`
            : "Your orders will appear here once you've placed one."}
        </p>
      </header>

      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="text-[11px] uppercase tracking-[0.22em] text-gold">Latest order</h2>
          {orderCount > 0 ? (
            <Link href="/account/orders" className="text-sm text-forest underline underline-offset-4">
              All orders
            </Link>
          ) : null}
        </div>
        {recent ? (
          <Link
            href={`/account/orders/${recent.orderNumber}`}
            className="mt-4 flex flex-wrap items-center justify-between gap-4 border border-gold/30 bg-paper p-5 transition-colors hover:border-gold"
          >
            <div>
              <p className="font-mono text-sm text-forest">{recent.orderNumber}</p>
              <p className="mt-1 text-sm text-ink/55">
                {recent.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} &middot;{" "}
                {recent._count.items} {recent._count.items === 1 ? "item" : "items"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <CustomerStatusBadge status={recent.status} />
              <span className="tabular-nums">{formatINR(Number(recent.total))}</span>
            </div>
          </Link>
        ) : (
          <div className="mt-4 border border-dashed border-gold/40 p-8 text-center">
            <p className="font-tagline text-lg italic text-ink/70">No orders yet.</p>
            <Link href="/products" className="mt-4 inline-block text-[12px] uppercase tracking-[0.18em] text-forest underline underline-offset-8">
              Shop jewellery
            </Link>
          </div>
        )}
      </section>

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="border border-gold/30 bg-paper p-5">
          <h2 className="text-[11px] uppercase tracking-[0.22em] text-gold">Default address</h2>
          {defaultAddress ? (
            <address className="mt-3 text-sm not-italic leading-relaxed text-ink/75">
              <strong className="font-medium text-ink">{defaultAddress.fullName}</strong>
              <br />
              {defaultAddress.line1}
              {defaultAddress.line2 ? `, ${defaultAddress.line2}` : ""}
              <br />
              {defaultAddress.city}, {defaultAddress.state} {defaultAddress.postalCode}
            </address>
          ) : (
            <p className="mt-3 text-sm text-ink/60">Save an address and checkout fills it in for you.</p>
          )}
          <Link href="/account/addresses" className="mt-4 inline-block text-sm text-forest underline underline-offset-4">
            {defaultAddress ? "Manage addresses" : "Add an address"}
          </Link>
        </section>

        <section className="border border-gold/30 bg-paper p-5">
          <h2 className="text-[11px] uppercase tracking-[0.22em] text-gold">Your details</h2>
          <dl className="mt-3 space-y-1 text-sm text-ink/75">
            <dd>{me.name}</dd>
            <dd className="break-all">{me.email}</dd>
            <dd>{formatIndianPhone(me.phone)}</dd>
          </dl>
          <Link href="/account/profile" className="mt-4 inline-block text-sm text-forest underline underline-offset-4">
            Edit profile &amp; password
          </Link>
        </section>
      </div>
    </div>
  );
}
