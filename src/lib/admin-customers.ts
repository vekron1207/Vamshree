import "server-only";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import type { OrderStatus, Prisma } from "@/generated/prisma/client";
import { normalizeIndianPhone } from "@/lib/phone";

// Statuses where the customer actually paid
const PAID: OrderStatus[] = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"];
const PAGE_SIZE = 25;

export type CustomerRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: Date;
  orders: number;
  spent: number;
  lastOrderAt: Date | null;
};

export async function listCustomers(opts: { query?: string; page?: number }) {
  await connection();
  const q = (opts.query ?? "").trim();
  const page = Math.max(1, opts.page ?? 1);

  // A phone typed any common way matches the normalised stored number
  const phone = q ? normalizeIndianPhone(q) : null;
  let where: Prisma.CustomerWhereInput = {};
  if (q) {
    // COLLATE keeps LIKE working when the connection and column collations differ
    const escape = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);
    const like = `%${escape(q)}%`;
    const likePhone = `%${escape(q.replace(/[\s-]/g, ""))}%`;
    const hits = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM Customer
      WHERE name LIKE ${like} COLLATE utf8mb4_unicode_ci
         OR email LIKE ${like} COLLATE utf8mb4_unicode_ci
         OR phone LIKE ${likePhone} COLLATE utf8mb4_unicode_ci`;
    where = { OR: [{ id: { in: hits.map((h) => h.id) } }, ...(phone ? [{ phone }] : [])] };
  }

  const [total, customers, allCount] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, name: true, email: true, phone: true, createdAt: true },
    }),
    prisma.customer.count(),
  ]);

  const ids = customers.map((c) => c.id);
  const [paidAgg, allAgg] = ids.length
    ? await Promise.all([
        prisma.order.groupBy({
          by: ["customerId"],
          where: { customerId: { in: ids }, status: { in: PAID } },
          _sum: { total: true },
          _count: { _all: true },
        }),
        prisma.order.groupBy({
          by: ["customerId"],
          where: { customerId: { in: ids }, status: { not: "PENDING" } },
          _max: { createdAt: true },
          _count: { _all: true },
        }),
      ])
    : [[], []];

  const rows: CustomerRow[] = customers.map((c) => {
    const paid = paidAgg.find((a) => a.customerId === c.id);
    const any = allAgg.find((a) => a.customerId === c.id);
    return {
      ...c,
      orders: any?._count._all ?? 0,
      spent: Number(paid?._sum.total ?? 0),
      lastOrderAt: any?._max.createdAt ?? null,
    };
  });

  return { rows, total, allCount, page, pageSize: PAGE_SIZE, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getCustomerDetail(id: string) {
  await connection();
  const customer = await prisma.customer.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true,
      addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] },
      orders: {
        where: { status: { not: "PENDING" } },
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { _count: { select: { items: true } } },
      },
    },
  });
  if (!customer) return null;

  const spent = customer.orders
    .filter((o) => PAID.includes(o.status))
    .reduce((sum, o) => sum + Number(o.total), 0);
  const paidCount = customer.orders.filter((o) => PAID.includes(o.status)).length;

  return { customer, spent, paidCount };
}
