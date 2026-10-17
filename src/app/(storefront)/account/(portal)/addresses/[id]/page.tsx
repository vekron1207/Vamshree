import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customer-auth";
import { saveAddressAction } from "../../actions";
import { AddressForm } from "../address-form";

// Per-customer data, always fresh: navigations may wait rather than needing a prerendered shell.
export const instant = false;


export default async function EditAddressPage(props: PageProps<"/account/addresses/[id]">) {
  await connection();
  const { id } = await props.params;
  const me = await requireCustomer(`/account/addresses/${id}`);

  const address = await prisma.address.findFirst({ where: { id, customerId: me.id } });
  if (!address) notFound();

  return (
    <div>
      <Link href="/account/addresses" className="text-sm text-ink/50 hover:text-forest">
        &larr; Addresses
      </Link>
      <h1 className="mt-4 font-display text-3xl text-forest sm:text-4xl">Edit address</h1>
      <AddressForm
        action={saveAddressAction.bind(null, address.id)}
        initial={{
          label: address.label,
          fullName: address.fullName,
          phone: address.phone ?? "",
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          isDefault: address.isDefault,
        }}
      />
    </div>
  );
}
