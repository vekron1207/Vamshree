import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customer-auth";
import { saveAddressAction } from "../../actions";
import { AddressForm } from "../address-form";

// Per-customer data, always fresh: navigations may wait rather than needing a prerendered shell.
export const instant = false;


export default async function NewAddressPage() {
  await connection();
  const me = await requireCustomer("/account/addresses/new");
  const count = await prisma.address.count({ where: { customerId: me.id } });

  return (
    <div>
      <Link href="/account/addresses" className="text-sm text-ink/50 hover:text-forest">
        &larr; Addresses
      </Link>
      <h1 className="mt-4 font-display text-3xl text-forest sm:text-4xl">New address</h1>
      <AddressForm
        action={saveAddressAction.bind(null, null)}
        isFirst={count === 0}
        initial={{ fullName: me.name, phone: me.phone ?? "" }}
      />
    </div>
  );
}
