import Link from "next/link";
import { connection } from "next/server";
import { getSitePage, isEditablePage, type EditablePageSlug } from "@/lib/site-pages";
import { PageForm } from "./page-form";
import { saveSitePage } from "./actions";

// Authenticated admin views always render fresh per request; navigations are
// allowed to wait for data rather than requiring a prerendered shell.
export const instant = false;

const TABS: { slug: EditablePageSlug; label: string }[] = [
  { slug: "about", label: "About Us" },
  { slug: "contact", label: "Contact Us" },
  { slug: "shipping-policy", label: "Shipping and Delivery" },
  { slug: "returns-policy", label: "Return and Exchange Policy" },
  { slug: "refund-policy", label: "Refund Policy" },
  { slug: "order-cancellation-policy", label: "Order and Cancellation Policy" },
  { slug: "privacy-policy", label: "Privacy Policy" },
  { slug: "terms", label: "Terms & Conditions" },
];

export default async function AdminPagesPage(props: PageProps<"/admin/pages">) {
  await connection();
  const { page } = await props.searchParams;
  const slug: EditablePageSlug = typeof page === "string" && isEditablePage(page) ? page : "about";
  const content = await getSitePage(slug);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] uppercase tracking-[0.2em] text-gold">Storefront</p>
        <h1 className="mt-1 font-display text-3xl text-forest">Pages</h1>
      </header>

      <nav className="flex flex-wrap gap-1 rounded-2xl bg-paper p-1 shadow-[0_1px_2px_rgba(18,20,15,0.06)] sm:w-fit">
        {TABS.map((tab) => (
          <Link
            key={tab.slug}
            href={`/admin/pages?page=${tab.slug}`}
            aria-current={tab.slug === slug ? "page" : undefined}
            className={`rounded-full px-4 py-1.5 text-center text-sm transition-colors ${
              tab.slug === slug ? "bg-forest text-cream" : "text-ink/60 hover:text-ink"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <p className="text-xs text-ink/45">
        {content.updatedAt
          ? `Last saved ${content.updatedAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`
          : "Showing the default text - save to customise it."}
      </p>

      {/* key: remount the form when switching tabs so fields reset */}
      <PageForm
        key={slug}
        action={saveSitePage.bind(null, slug)}
        initial={{
          slug,
          title: content.title,
          intro: content.intro,
          body: content.body,
          imageUrl: content.imageUrl,
          contact: content.contact,
        }}
      />
    </div>
  );
}
