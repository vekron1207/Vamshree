import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomerDetail } from "@/lib/admin-customers";
import { formatINR } from "@/lib/format";
import { formatIndianPhone } from "@/lib/phone";
import { StatusBadge } from "../../status-badge";

// Authenticated admin views always render fresh per request; navigations are
// allowed to wait for data rather than requiring a prerendered shell.
export const instant = false;

export default async function AdminCustomerDetailPage(props: PageProps<"/admin/customers/[id]">) {
  const { id } = await props.params;
  const data = await getCustomerDetail(id);
  if (!data) notFound();
  const { customer, spent, paidCount } = data;

  const card = "rounded-2xl bg-paper p-5 shadow-[0_1px_2px_rgba(18,20,15,0.06)] sm:p-6";
  const phone = formatIndianPhone(customer.phone);

  return (
    <div className="space-y-6">
      <Link href="/admin/customers" className="text-sm text-ink/50 hover:text-forest">
        &larr; Customers
      </Link>

      <header>
        <h1 className="font-display text-3xl text-forest">{customer.name}</h1>
        <p className="mt-1 text-sm text-ink/55">
          Joined {customer.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Stat label="Total spent" value={formatINR(spent)} />
        <Stat label="Paid orders" value={String(paidCount)} />
        <Stat label="Average order" value={paidCount > 0 ? formatINR(spent / paidCount) : "-"} className="col-span-2 lg:col-span-1" />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-6">
          <section className={card}>
            <h2 className="font-medium text-ink">Contact</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-[0.08em] text-ink/45">Email</dt>
                <dd>
                  <a href={`mailto:${customer.email}`} className="break-all text-forest hover:underline">
                    {customer.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.08em] text-ink/45">Mobile</dt>
                <dd>
                  {customer.phone ? (
                    <>
                      <a href={`tel:${customer.phone}`} className="text-forest hover:underline">
                        {phone}
                      </a>
                      <a
                        href={`https://wa.me/${customer.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-3 text-xs text-ink/55 underline underline-offset-4 hover:text-forest"
                      >
                        WhatsApp
                      </a>
                    </>
                  ) : (
                    "-"
                  )}
                </dd>
              </div>
            </dl>
          </section>

          <section className={card}>
            <h2 className="font-medium text-ink">Saved addresses</h2>
            {customer.addresses.length === 0 ? (
              <p className="mt-3 text-sm text-ink/50">None saved.</p>
            ) : (
              <ul className="mt-3 divide-y divide-ink/[0.06]">
                {customer.addresses.map((a) => (
                  <li key={a.id} className="py-3 first:pt-0 last:pb-0">
                    <p className="text-xs uppercase tracking-[0.08em] text-gold">
                      {a.label}
                      {a.isDefault ? <span className="ml-2 rounded-full bg-forest px-2 py-0.5 text-[10px] text-cream">Default</span> : null}
                    </p>
                    <address className="mt-1 text-sm not-italic leading-relaxed text-ink/75">
                      {a.fullName}
                      <br />
                      {a.line1}
                      {a.line2 ? `, ${a.line2}` : ""}
                      <br />
                      {a.city}, {a.state} {a.postalCode}
                    </address>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className={card}>
          <h2 className="font-medium text-ink">Orders</h2>
          {customer.orders.length === 0 ? (
            <p className="mt-3 text-sm text-ink/50">No orders yet.</p>
          ) : (
            <div className="-mx-1 mt-3 overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-sm">
                <tbody className="divide-y divide-ink/[0.06]">
                  {customer.orders.map((o) => {
                    const placed = o.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
                    return (
                      <tr key={o.id} className="hover:bg-cream/50">
                        <td className="px-1 py-3">
                          <Link href={`/admin/orders/${o.id}`} className="font-mono text-xs text-forest hover:underline">
                            {o.orderNumber}
                          </Link>
                          <span className="block text-xs text-ink/45">
                            {placed} &middot; {o._count.items} {o._count.items === 1 ? "item" : "items"}
                          </span>
                        </td>
                        <td className="px-1 py-3">
                          <StatusBadge status={o.status} />
                        </td>
                        <td className="px-1 py-3 text-right tabular-nums">{formatINR(Number(o.total))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`rounded-2xl bg-paper p-5 shadow-[0_1px_2px_rgba(18,20,15,0.06)] ${className}`}>
      <p className="text-xs uppercase tracking-[0.12em] text-ink/50">{label}</p>
      <p className="mt-3 text-2xl font-light tabular-nums text-forest">{value}</p>
    </div>
  );
}
