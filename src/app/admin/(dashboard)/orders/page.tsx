import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/format";
import type { OrderStatus } from "@/generated/prisma/client";
import { StatusBadge, statusLabel } from "../status-badge";
import { expireStalePendingOrders } from "@/lib/orders";

// Authenticated admin views always render fresh per request; navigations are
// allowed to wait for data rather than requiring a prerendered shell.
export const instant = false;

const FILTERS: (OrderStatus | "ALL")[] = [
  "ALL",
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

export default async function AdminOrdersPage(props: PageProps<"/admin/orders">) {
  await connection();
  const { status } = await props.searchParams;
  await expireStalePendingOrders();
  const active = FILTERS.find((f) => f === status) ?? "ALL";

  const [orders, groups] = await Promise.all([
    prisma.order.findMany({
      where: active === "ALL" ? undefined : { status: active },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { _count: { select: { items: true } } },
    }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const total = groups.reduce((s, g) => s + g._count._all, 0);
  const countFor = (f: OrderStatus | "ALL") =>
    f === "ALL" ? total : (groups.find((g) => g.status === f)?._count._all ?? 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-gold">Fulfilment</p>
          <h1 className="mt-1 font-display text-3xl text-forest">Orders</h1>
        </div>
        <a href="/admin/export/orders" className="rounded-full border border-forest/30 px-5 py-2 text-sm text-forest hover:bg-forest hover:text-cream">
          Export CSV
        </a>
      </header>

      <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
        {FILTERS.map((f) => {
          const isActive = f === active;
          return (
            <Link
              key={f}
              href={f === "ALL" ? "/admin/orders" : `/admin/orders?status=${f}`}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm transition-colors ${
                isActive
                  ? "bg-forest text-cream"
                  : "bg-paper text-ink/60 shadow-[0_1px_2px_rgba(18,20,15,0.06)] hover:text-ink"
              }`}
            >
              {f === "ALL" ? "All" : statusLabel(f)}{" "}
              <span className={isActive ? "text-cream/60" : "text-ink/40"}>{countFor(f)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="overflow-hidden rounded-2xl bg-paper shadow-[0_1px_2px_rgba(18,20,15,0.06)]">
        {orders.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-ink/50">
            {active === "ALL"
              ? "Orders appear here as soon as customers check out."
              : `No orders are currently "${statusLabel(active)}".`}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b border-ink/[0.06] text-xs uppercase tracking-[0.08em] text-ink/50">
                <tr>
                  <th className="py-3 pl-5 font-normal">Order</th>
                  <th className="py-3 font-normal">Customer</th>
                  <th className="py-3 font-normal">Date</th>
                  <th className="py-3 font-normal">Status</th>
                  <th className="py-3 text-right font-normal">Items</th>
                  <th className="py-3 pr-5 text-right font-normal">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/[0.05]">
                {orders.map((o) => (
                  <tr key={o.id} className="group transition-colors hover:bg-cream/50">
                    <td className="py-3.5 pl-5">
                      <Link href={`/admin/orders/${o.id}`} className="font-mono text-xs text-forest group-hover:underline">
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="py-3.5">
                      <p className="text-ink">{o.guestName ?? "Guest"}</p>
                      <p className="text-xs text-ink/50">{o.guestEmail}</p>
                    </td>
                    <td className="py-3.5 text-ink/70">
                      {o.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="py-3.5">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="py-3.5 text-right tabular-nums text-ink/70">{o._count.items}</td>
                    <td className="py-3.5 pr-5 text-right tabular-nums">{formatINR(Number(o.total))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
