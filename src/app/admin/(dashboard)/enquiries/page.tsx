import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatIndianPhone } from "@/lib/phone";
import { EnquiryActions } from "./row-actions";

export const instant = false;

const FILTERS = [
  { key: "new", label: "New" },
  { key: "replied", label: "Replied" },
  { key: "all", label: "All" },
] as const;

export default async function EnquiriesPage(props: PageProps<"/admin/enquiries">) {
  await connection();
  const { view } = await props.searchParams;
  const active = FILTERS.find((f) => f.key === view)?.key ?? "new";

  const [enquiries, newCount] = await Promise.all([
    prisma.enquiry.findMany({
      where: active === "all" ? undefined : { isReplied: active === "replied" },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.enquiry.count({ where: { isReplied: false } }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] uppercase tracking-[0.2em] text-gold">Contact page</p>
        <h1 className="mt-1 font-display text-3xl text-forest">Enquiries</h1>
        <p className="mt-1 text-sm text-ink/50">
          Messages sent from the Contact page. Reply by email, then mark them as replied.
        </p>
      </header>

      <nav className="flex gap-1 rounded-full bg-paper p-1 shadow-[0_1px_2px_rgba(18,20,15,0.06)] sm:w-fit">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/admin/enquiries?view=${f.key}`}
            aria-current={f.key === active ? "page" : undefined}
            className={`flex-1 rounded-full px-5 py-1.5 text-center text-sm transition-colors sm:flex-none ${
              f.key === active ? "bg-forest text-cream" : "text-ink/60 hover:text-ink"
            }`}
          >
            {f.label}
            {f.key === "new" && newCount > 0 ? ` (${newCount})` : ""}
          </Link>
        ))}
      </nav>

      {enquiries.length === 0 ? (
        <p className="rounded-2xl bg-paper px-6 py-12 text-center text-sm text-ink/50 shadow-[0_1px_2px_rgba(18,20,15,0.06)]">
          {active === "new" ? "No new messages." : "Nothing here."}
        </p>
      ) : (
        <ul className="space-y-4">
          {enquiries.map((e) => {
            const subject = encodeURIComponent("Re: your message to Vaamshri");
            return (
              <li key={e.id} className="rounded-2xl bg-paper p-5 shadow-[0_1px_2px_rgba(18,20,15,0.06)] sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink">
                      {e.name}
                      {!e.isReplied ? (
                        <span className="ml-2 rounded-full bg-gold-soft/60 px-2 py-0.5 align-middle text-[10px] uppercase tracking-[0.12em] text-forest">
                          New
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-sm text-ink/60">
                      <a href={`mailto:${e.email}?subject=${subject}`} className="text-forest hover:underline">
                        {e.email}
                      </a>
                      {e.phone ? (
                        <>
                          {" "}
                          &middot;{" "}
                          <a href={`tel:${e.phone}`} className="text-forest hover:underline">
                            {formatIndianPhone(e.phone)}
                          </a>
                        </>
                      ) : null}
                    </p>
                  </div>
                  <p className="text-xs text-ink/45">
                    {e.createdAt.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
                <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink/80">{e.message}</p>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-ink/[0.06] pt-4">
                  <a
                    href={`mailto:${e.email}?subject=${subject}`}
                    className="rounded-full border border-forest/30 px-5 py-1.5 text-xs text-forest hover:bg-forest hover:text-cream"
                  >
                    Reply by email
                  </a>
                  <EnquiryActions id={e.id} isReplied={e.isReplied} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
