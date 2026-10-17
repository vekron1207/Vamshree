import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { updateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { markOrderPaid } from "@/lib/orders";

export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  if (!signature || expected !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === "payment.captured" || event.event === "order.paid") {
    const payment = event.payload?.payment?.entity;
    const razorpayOrderId: string | undefined = payment?.order_id;
    const razorpayPaymentId: string | undefined = payment?.id;

    if (razorpayOrderId) {
      const order = await prisma.order.findUnique({ where: { razorpayOrderId }, select: { id: true } });
      if (order) {
        await markOrderPaid(order.id, razorpayPaymentId);
        updateTag("products");
      }
    }
  }

  return NextResponse.json({ received: true });
}
