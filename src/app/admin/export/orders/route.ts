import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";
import { csvResponse, toCsv } from "@/lib/csv";

export async function GET() {
  await connection();
  if (!(await getAdminSession())) return new Response("Unauthorized", { status: 401 });

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 20000,
    include: { items: true },
  });

  const rows = orders.map((o) => {
    const a = o.shippingAddress as { line1?: string; line2?: string; city?: string; state?: string; postalCode?: string };
    return [
      o.orderNumber,
      o.createdAt,
      o.status,
      o.guestName,
      o.guestEmail,
      o.guestPhone,
      o.items.map((i) => `${i.nameSnapshot}${i.variantLabel ? ` (${i.variantLabel})` : ""} x${i.quantity}`).join("; "),
      Number(o.subtotal),
      Number(o.discountAmount),
      o.discountCode,
      Number(o.shippingFee),
      Number(o.total),
      [a?.line1, a?.line2].filter(Boolean).join(", "),
      a?.city,
      a?.state,
      a?.postalCode,
      o.isGift ? "Yes" : "",
      o.courier,
      o.trackingNumber,
      o.paidAt,
    ];
  });

  const header = [
    "Order", "Placed", "Status", "Customer", "Email", "Phone", "Items", "Subtotal", "Discount", "Code",
    "Shipping", "Total", "Address", "City", "State", "PIN", "Gift", "Courier", "Tracking", "Paid at",
  ];
  return csvResponse("vaamshri-orders.csv", toCsv(header, rows));
}
