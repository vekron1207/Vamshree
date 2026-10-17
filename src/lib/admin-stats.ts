import "server-only";
import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@/generated/prisma/client";

const PAID_STATUSES: OrderStatus[] = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"];
const DAY_MS = 24 * 60 * 60 * 1000;

export type DailyPoint = { date: string; revenue: number; orders: number };

// Local calendar day, matching how the window start is computed below
function dayKey(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export async function getDashboardStats(days = 30) {
  const now = new Date();
  const start = new Date(now.getTime() - (days - 1) * DAY_MS);
  start.setHours(0, 0, 0, 0);
  const prevStart = new Date(start.getTime() - days * DAY_MS);

  const [paidOrders, prevPaidAgg, statusGroups, itemsInRange, productCounts, recentOrders, needsPricing] =
    await Promise.all([
      prisma.order.findMany({
        where: { status: { in: PAID_STATUSES }, createdAt: { gte: start } },
        select: { createdAt: true, total: true },
      }),
      prisma.order.aggregate({
        where: { status: { in: PAID_STATUSES }, createdAt: { gte: prevStart, lt: start } },
        _sum: { total: true },
        _count: true,
      }),
      prisma.order.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.orderItem.findMany({
        where: { order: { status: { in: PAID_STATUSES }, createdAt: { gte: start } } },
        select: {
          quantity: true,
          priceSnapshot: true,
          product: { select: { category: { select: { name: true } } } },
        },
      }),
      prisma.product.groupBy({
        by: ["isActive"],
        _count: { _all: true },
      }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { id: true, orderNumber: true, guestName: true, total: true, status: true, createdAt: true },
      }),
      prisma.product.count({ where: { price: 0 } }),
    ]);

  // Fill every day in the window so the chart shows real gaps as zero
  const byDay = new Map<string, DailyPoint>();
  for (let i = 0; i < days; i++) {
    const d = new Date(start.getTime() + i * DAY_MS);
    byDay.set(dayKey(d), { date: dayKey(d), revenue: 0, orders: 0 });
  }
  for (const o of paidOrders) {
    const point = byDay.get(dayKey(o.createdAt));
    if (point) {
      point.revenue += Number(o.total);
      point.orders += 1;
    }
  }
  const daily = [...byDay.values()];

  const revenue = daily.reduce((s, d) => s + d.revenue, 0);
  const orderCount = paidOrders.length;
  const prevRevenue = Number(prevPaidAgg._sum.total ?? 0);

  const categoryTotals = new Map<string, number>();
  for (const item of itemsInRange) {
    const name = item.product.category?.name ?? "Uncategorised";
    categoryTotals.set(name, (categoryTotals.get(name) ?? 0) + Number(item.priceSnapshot) * item.quantity);
  }

  const statusOrder: OrderStatus[] = [
    "PENDING",
    "PAID",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "REFUNDED",
  ];
  const statusCounts = statusOrder.map((status) => ({
    status,
    count: statusGroups.find((g) => g.status === status)?._count._all ?? 0,
  }));

  const activeProducts = productCounts.find((p) => p.isActive)?._count._all ?? 0;
  const draftProducts = productCounts.find((p) => !p.isActive)?._count._all ?? 0;

  return {
    days,
    daily,
    revenue,
    orderCount,
    averageOrder: orderCount > 0 ? revenue / orderCount : 0,
    revenueChange: prevRevenue > 0 ? (revenue - prevRevenue) / prevRevenue : null,
    statusCounts,
    categoryRevenue: [...categoryTotals.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value),
    activeProducts,
    draftProducts,
    needsPricing,
    pendingOrders: statusCounts.find((s) => s.status === "PENDING")?.count ?? 0,
    recentOrders: recentOrders.map((o) => ({ ...o, total: Number(o.total) })),
  };
}
