import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";
import { csvResponse, toCsv } from "@/lib/csv";

const PAID = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

export async function GET() {
  await connection();
  if (!(await getAdminSession())) return new Response("Unauthorized", { status: 401 });

  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    take: 20000,
    include: {
      orders: { where: { status: { in: [...PAID] } }, select: { total: true } },
    },
  });

  const rows = customers.map((c) => [
    c.name,
    c.email,
    c.phone,
    c.createdAt,
    c.orders.length,
    c.orders.reduce((s, o) => s + Number(o.total), 0),
  ]);
  return csvResponse("vaamshri-customers.csv", toCsv(["Name", "Email", "Phone", "Joined", "Paid orders", "Total spent"], rows));
}
