import Button from "@mui/material/Button";
import { BrandMark } from "@/components/brand";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { logoutAction } from "./actions";
import { AdminNav } from "./admin-nav";

// Entire admin area is authenticated and always dynamic - no static shell to
// preserve here, so opt the whole subtree out of prerender validation.
export const instant = false;

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();
  const initial = session.email.charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen bg-[#f3efe6] [--cream:#f6f1e7]">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-forest-deep px-4 py-6 lg:flex">
        <Link href="/admin" className="flex items-center gap-3 px-3">
          <BrandMark size="sm" />
          <span>
            <span className="block font-display text-sm tracking-[0.14em] text-cream">Vaamshri</span>
            <span className="block text-[10px] uppercase tracking-[0.2em] text-gold">Studio admin</span>
          </span>
        </Link>

        <div className="mt-10">
          <AdminNav />
        </div>

        <div className="mt-auto space-y-4">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2 px-3 text-xs text-cream/50 transition-colors hover:text-cream"
          >
            View storefront &#8599;
          </Link>
          <div className="flex items-center gap-3 rounded-lg bg-cream/5 px-3 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold text-sm text-forest-deep">
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-cream/80">{session.email}</p>
              <form action={logoutAction}>
                <Button type="submit" size="small" variant="text" sx={{ p: 0, minWidth: 0, fontSize: 11, color: "rgba(255,255,255,0.55)", "&:hover": { color: "#c9a355", backgroundColor: "transparent", transform: "none" } }}>
                  Sign out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 bg-forest-deep px-4 py-3 lg:hidden">
          <div className="flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2">
              <BrandMark size="sm" className="!w-11" />
              <span className="font-display text-sm tracking-[0.14em] text-cream">Vaamshri</span>
            </Link>
            <form action={logoutAction}>
              <Button type="submit" size="small" variant="text" sx={{ color: "rgba(255,255,255,0.7)" }}>
                Sign out
              </Button>
            </form>
          </div>
          <div className="mt-3">
            <AdminNav orientation="horizontal" />
          </div>
        </header>

        <main className="w-full flex-1 px-4 py-6 sm:px-8 sm:py-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
