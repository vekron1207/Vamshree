import { notFound } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { getBusinessInfo } from "@/lib/settings";
import { Invoice } from "@/components/invoice";

export const instant = false;

export default async function AdminInvoicePage(props: PageProps<"/admin/invoice/[id]">) {
  await connection();
  await requireAdmin();
  const { id } = await props.params;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) notFound();
  return <Invoice order={order} business={await getBusinessInfo()} />;
}
