import { notFound } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customer-auth";
import { getBusinessInfo } from "@/lib/settings";
import { Invoice } from "@/components/invoice";

export const instant = false;

export default async function CustomerInvoicePage(props: PageProps<"/invoice/[orderNumber]">) {
  await connection();
  const { orderNumber } = await props.params;
  const me = await requireCustomer(`/invoice/${orderNumber}`);
  // Matching customerId stops one customer opening another's invoice
  const order = await prisma.order.findFirst({
    where: { orderNumber, customerId: me.id },
    include: { items: true },
  });
  if (!order) notFound();
  return <Invoice order={order} business={await getBusinessInfo()} />;
}
