import { LinkButton } from "@/components/ui/link-button";
import Button from "@mui/material/Button";
import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customer-auth";
import { formatIndianPhone } from "@/lib/phone";
import { deleteAddressAction, setDefaultAddressAction } from "../actions";

// Per-customer data, always fresh: navigations may wait rather than needing a prerendered shell.
export const instant = false;


export default async function AddressesPage() {
  await connection();
  const me = await requireCustomer("/account/addresses");
  const addresses = await prisma.address.findMany({
    where: { customerId: me.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-3xl text-forest sm:text-4xl">Addresses</h1>
        <LinkButton href="/account/addresses/new" variant="contained" size="small">
          Add address
        </LinkButton>
      </div>

      {addresses.length === 0 ? (
        <div className="mt-10 border border-dashed border-gold/40 p-10 text-center">
          <p className="font-tagline text-xl italic text-ink/70">No saved addresses yet.</p>
          <p className="mt-2 text-sm text-ink/55">Save one and checkout fills it in for you.</p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2">
          {addresses.map((a) => (
            <li key={a.id} className="flex flex-col border border-gold/30 bg-paper p-5">
              <div className="flex items-center gap-2">
                <p className="text-[11px] uppercase tracking-[0.2em] text-gold">{a.label}</p>
                {a.isDefault ? (
                  <span className="rounded-full bg-forest px-2 py-0.5 text-[10px] uppercase tracking-wider text-cream">Default</span>
                ) : null}
              </div>
              <address className="mt-3 flex-1 text-sm not-italic leading-relaxed text-ink/75">
                <strong className="font-medium text-ink">{a.fullName}</strong>
                <br />
                {a.line1}
                {a.line2 ? `, ${a.line2}` : ""}
                <br />
                {a.city}, {a.state} {a.postalCode}
                <br />
                {formatIndianPhone(a.phone)}
              </address>
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-gold/20 pt-4 text-sm">
                <Link href={`/account/addresses/${a.id}`} className="text-forest underline underline-offset-4">
                  Edit
                </Link>
                {!a.isDefault ? (
                  <form action={setDefaultAddressAction.bind(null, a.id)}>
                    <Button type="submit" size="small" variant="text">
                      Make default
                    </Button>
                  </form>
                ) : null}
                <form action={deleteAddressAction.bind(null, a.id)} className="ml-auto">
                  <Button type="submit" size="small" variant="text" color="error">
                    Delete
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
