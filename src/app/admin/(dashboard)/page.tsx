import Link from "next/link";
import { connection } from "next/server";
import { getDashboardStats } from "@/lib/admin-stats";
import { expireStalePendingOrders } from "@/lib/orders";
import { getStoreSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/format";
import { BarList, RevenueChart } from "./charts";
import { StatusBadge, statusLabel } from "./status-badge";

// Authenticated admin views always render fresh per request; navigations are
// allowed to wait for data rather than requiring a prerendered shell.
export const instant = false;

export default async function AdminDashboardPage() {
  await connection();
  await expireStalePendingOrders();
  const stats = await getDashboardStats(30);
  const { lowStockThreshold } = await getStoreSettings();
  const soldOut = await prisma.product.count({ where: { isActive: true, stock: 0 } });
  const lowStock = await prisma.product.findMany({
    where: { isActive: true, stock: { gt: 0, lte: lowStockThreshold } },
    orderBy: [{ stock: "asc" }, { name: "asc" }],
    take: 8,
    select: { id: true, name: true, stock: true },
  });

  const change = stats.revenueChange;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-gold">Last {stats.days} days</p>
          <h1 className="mt-1 font-display text-3xl text-forest">Overview</h1>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-forest px-5 py-2.5 text-sm text-cream transition-colors hover:bg-forest-deep"
        >
          Add product
        </Link>
      </header>

      {stats.needsPricing > 0 ? (
        <Link
          href="/admin/products?status=archived"
          className="flex items-center justify-between gap-4 rounded-xl border border-gold/40 bg-gold-soft/30 px-5 py-4 text-sm transition-colors hover:bg-gold-soft/50"
        >
          <span>
            <strong className="font-medium text-forest">{stats.needsPricing} products</strong>{" "}
            <span className="text-ink/70">still need a price before they can go live.</span>
          </span>
          <span className="shrink-0 text-forest">Review &rarr;</span>
        </Link>
      ) : null}

      {lowStock.length > 0 || soldOut > 0 ? (
        <section className="rounded-2xl border border-gold/40 bg-gold-soft/20 p-5 sm:p-6">
          <h2 className="font-medium text-ink">Running low</h2>
          <p className="mt-1 text-sm text-ink/55">
            Live products with {lowStockThreshold} or fewer left.{soldOut > 0 ? <> <Link href="/admin/products" className="text-forest underline underline-offset-4">{soldOut} live {soldOut === 1 ? "product is" : "products are"} sold out.</Link></> : null}
          </p>
          <ul className="mt-4 divide-y divide-ink/[0.06]">
            {lowStock.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/products/${p.id}`} className="flex items-center justify-between gap-4 py-2.5 text-sm hover:text-forest">
                  <span className="truncate">{p.name}</span>
                  <span className={`shrink-0 tabular-nums ${p.stock === 0 ? "text-rose-700" : "text-ink/70"}`}>
                    {p.stock === 0 ? "Sold out" : `${p.stock} left`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          label="Revenue"
          value={formatINR(stats.revenue)}
          detail={
            change === null
              ? "No earlier period to compare"
              : `${change >= 0 ? "▲" : "▼"} ${Math.abs(change * 100).toFixed(0)}% vs previous ${stats.days} days`
          }
          tone={change === null ? "neutral" : change >= 0 ? "up" : "down"}
        />
        <Kpi label="Paid orders" value={stats.orderCount.toLocaleString("en-IN")} detail={`Avg. ${formatINR(stats.averageOrder)} per order`} />
        <Kpi
          label="Awaiting payment"
          value={stats.pendingOrders.toLocaleString("en-IN")}
          detail="Checkouts started, not yet paid"
        />
        <Kpi
          label="Live products"
          value={stats.activeProducts.toLocaleString("en-IN")}
          detail={`${stats.draftProducts} archived or draft`}
        />
      </section>

      <section className="rounded-2xl bg-paper p-5 shadow-[0_1px_2px_rgba(18,20,15,0.06)] sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-medium text-ink">Revenue per day</h2>
          <p className="text-sm text-ink/50">Paid, processing, shipped and delivered orders</p>
        </div>
        <div className="mt-6">
          <RevenueChart data={stats.daily} />
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl bg-paper p-5 shadow-[0_1px_2px_rgba(18,20,15,0.06)] sm:p-6">
          <h2 className="font-medium text-ink">Orders by status</h2>
          <p className="mt-1 text-sm text-ink/50">All time</p>
          <div className="mt-6">
            <BarList
              rows={stats.statusCounts.map((s) => ({ label: statusLabel(s.status), value: s.count }))}
              emptyText="No orders yet"
            />
          </div>
        </section>

        <section className="rounded-2xl bg-paper p-5 shadow-[0_1px_2px_rgba(18,20,15,0.06)] sm:p-6">
          <h2 className="font-medium text-ink">Revenue by category</h2>
          <p className="mt-1 text-sm text-ink/50">Last {stats.days} days</p>
          <div className="mt-6">
            <BarList rows={stats.categoryRevenue} format="currency" emptyText="No sales in this period yet" />
          </div>
        </section>
      </div>

      <section className="rounded-2xl bg-paper shadow-[0_1px_2px_rgba(18,20,15,0.06)]">
        <div className="flex items-center justify-between px-5 pt-5 sm:px-6 sm:pt-6">
          <h2 className="font-medium text-ink">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm text-forest hover:underline">
            View all
          </Link>
        </div>
        {stats.recentOrders.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-ink/50">
            Orders appear here as soon as customers check out.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-ink/[0.06]">
            {stats.recentOrders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 text-sm transition-colors hover:bg-cream/60 sm:px-6"
                >
                  <span className="w-28 shrink-0 font-mono text-xs text-ink/60">{o.orderNumber}</span>
                  <span className="min-w-0 flex-1 truncate text-ink">{o.guestName ?? "Guest"}</span>
                  <span className="hidden sm:block">
                    <StatusBadge status={o.status} />
                  </span>
                  <span className="w-24 shrink-0 text-right tabular-nums">{formatINR(o.total)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  detail,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "neutral" | "up" | "down";
}) {
  return (
    <div className="rounded-2xl bg-paper p-5 shadow-[0_1px_2px_rgba(18,20,15,0.06)]">
      <p className="text-xs uppercase tracking-[0.12em] text-ink/50">{label}</p>
      {/* Body face, not Aboreto: Aboreto has no ₹ glyph */}
      <p className="mt-3 text-2xl font-light tabular-nums text-forest sm:text-[1.75rem]">{value}</p>
      <p
        className={`mt-2 text-xs ${
          tone === "up" ? "text-emerald-700" : tone === "down" ? "text-rose-700" : "text-ink/50"
        }`}
      >
        {detail}
      </p>
    </div>
  );
}
