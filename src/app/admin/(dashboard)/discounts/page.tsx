import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/format";
import { DiscountRowActions, NewDiscountForm } from "./discount-ui";

export const instant = false;

const day = (d: Date | null) => (d ? d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null);

export default async function DiscountsPage() {
  await connection();
  const codes = await prisma.discountCode.findMany({ orderBy: { createdAt: "desc" } });
  const now = new Date();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-forest">Discount codes</h1>
      <NewDiscountForm />

      <div className="overflow-x-auto rounded-2xl bg-paper shadow-[0_1px_2px_rgba(18,20,15,0.06)]">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.08em] text-ink/50">
            <tr>
              <th className="px-5 py-3 font-medium">Code</th>
              <th className="px-5 py-3 font-medium">Discount</th>
              <th className="px-5 py-3 font-medium">Used</th>
              <th className="px-5 py-3 font-medium">Conditions</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/[0.06]">
            {codes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-ink/50">
                  No codes yet.
                </td>
              </tr>
            ) : (
              codes.map((c) => {
                const expired = c.endsAt ? c.endsAt < now : false;
                const upcoming = c.startsAt ? c.startsAt > now : false;
                const exhausted = c.maxUses !== null && c.usedCount >= c.maxUses;
                const status = !c.isActive ? "Disabled" : expired ? "Expired" : exhausted ? "Used up" : upcoming ? "Scheduled" : "Live";
                return (
                  <tr key={c.id}>
                    <td className="px-5 py-3 font-mono">{c.code}</td>
                    <td className="px-5 py-3">{c.kind === "PERCENT" ? `${c.value}% off` : `${formatINR(c.value)} off`}</td>
                    <td className="px-5 py-3 tabular-nums">
                      {c.usedCount}
                      {c.maxUses !== null ? ` / ${c.maxUses}` : ""}
                    </td>
                    <td className="px-5 py-3 text-xs text-ink/60">
                      {[
                        c.minSubtotal ? `Min ${formatINR(c.minSubtotal)}` : null,
                        c.startsAt ? `From ${day(c.startsAt)}` : null,
                        c.endsAt ? `Until ${day(c.endsAt)}` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "None"}
                    </td>
                    <td className="px-5 py-3">{status}</td>
                    <td className="px-5 py-3">
                      <DiscountRowActions id={c.id} isActive={c.isActive} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
