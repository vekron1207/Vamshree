import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import SearchIcon from "@mui/icons-material/SearchRounded";
import Link from "next/link";
import { listCustomers } from "@/lib/admin-customers";
import { formatINR } from "@/lib/format";
import { formatIndianPhone } from "@/lib/phone";

// Authenticated admin views always render fresh per request; navigations are
// allowed to wait for data rather than requiring a prerendered shell.
export const instant = false;

export default async function AdminCustomersPage(props: PageProps<"/admin/customers">) {
  const sp = await props.searchParams;
  const query = typeof sp.q === "string" ? sp.q.slice(0, 100) : "";
  const page = Number(typeof sp.page === "string" ? sp.page : 1) || 1;
  const { rows, total, allCount, pages, pageSize } = await listCustomers({ query, page });

  const href = (p: number) =>
    `/admin/customers?${new URLSearchParams({ ...(query ? { q: query } : {}), page: String(p) })}`;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-gold">People</p>
          <h1 className="mt-1 font-display text-3xl text-forest">Customers</h1>
          <p className="mt-1 text-sm text-ink/50">
            {allCount} {allCount === 1 ? "registered customer" : "registered customers"}. Guest checkouts appear under Orders only.
          </p>
        </div>
        <Button component="a" href="/admin/export/customers" variant="outlined" size="small">
          Export CSV
        </Button>
        <form action="/admin/customers" className="w-full sm:w-80">
          <TextField
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search name, email or mobile"
            variant="outlined"
            size="small"
            hiddenLabel
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 999 } }}
            slotProps={{
              htmlInput: { "aria-label": "Search customers" },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
        </form>
      </header>

      <div className="overflow-hidden rounded-2xl bg-paper shadow-[0_1px_2px_rgba(18,20,15,0.06)]">
        {rows.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-ink/50">
            {query
              ? `No customers match "${query}".`
              : "Customers appear here when they create an account on the storefront."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-ink/[0.06] text-xs uppercase tracking-[0.08em] text-ink/50">
                <tr>
                  <th className="py-3 pl-5 font-normal">Customer</th>
                  <th className="py-3 font-normal">Mobile</th>
                  <th className="py-3 font-normal">Joined</th>
                  <th className="py-3 text-right font-normal">Orders</th>
                  <th className="py-3 text-right font-normal">Total spent</th>
                  <th className="py-3 pr-5 text-right font-normal">Last order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/[0.05]">
                {rows.map((c) => (
                  <tr key={c.id} className="group transition-colors hover:bg-cream/50">
                    <td className="py-3.5 pl-5">
                      <Link href={`/admin/customers/${c.id}`} className="block">
                        <span className="text-ink group-hover:text-forest group-hover:underline">{c.name}</span>
                        <span className="block text-xs text-ink/50">{c.email}</span>
                      </Link>
                    </td>
                    <td className="py-3.5 tabular-nums text-ink/75">{formatIndianPhone(c.phone)}</td>
                    <td className="py-3.5 text-ink/70">
                      {c.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="py-3.5 text-right tabular-nums">{c.orders}</td>
                    <td className="py-3.5 text-right tabular-nums">{c.spent > 0 ? formatINR(c.spent) : <span className="text-ink/35">-</span>}</td>
                    <td className="py-3.5 pr-5 text-right text-ink/70">
                      {c.lastOrderAt
                        ? c.lastOrderAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                        : <span className="text-ink/35">Never</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pages > 1 ? (
        <nav aria-label="Pages" className="flex items-center justify-between text-sm text-ink/60">
          <span>
            {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link href={href(page - 1)} className="rounded-full bg-paper px-4 py-1.5 shadow-[0_1px_2px_rgba(18,20,15,0.06)] hover:text-ink">
                &larr; Previous
              </Link>
            ) : null}
            {page < pages ? (
              <Link href={href(page + 1)} className="rounded-full bg-paper px-4 py-1.5 shadow-[0_1px_2px_rgba(18,20,15,0.06)] hover:text-ink">
                Next &rarr;
              </Link>
            ) : null}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
