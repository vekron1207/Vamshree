"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  {
    href: "/admin",
    label: "Overview",
    exact: true,
    icon: "M3 10.5 10 4l7 6.5V17a1 1 0 0 1-1 1h-3.5v-4.5h-5V18H4a1 1 0 0 1-1-1v-6.5Z",
  },
  {
    href: "/admin/products",
    label: "Products",
    icon: "M10 3 3 6.5v7L10 17l7-3.5v-7L10 3Zm0 0v14M3 6.5l7 3.5 7-3.5",
  },
  {
    href: "/admin/collections",
    label: "Collections",
    icon: "M4 5.5h12M4 10h12M4 14.5h7m2.5-1 1.5 1.5 3-3",
  },
  {
    href: "/admin/orders",
    label: "Orders",
    icon: "M5 3h10l1 14H4L5 3Zm2.5 4.5a2.5 2.5 0 0 0 5 0",
  },
  {
    href: "/admin/customers",
    label: "Customers",
    icon: "M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-6.5 8c.6-3.3 3.1-5 6.5-5s5.9 1.7 6.5 5",
  },
  {
    href: "/admin/enquiries",
    label: "Enquiries",
    icon: "M3.5 5h13v9h-7l-3.5 3v-3h-2.5V5Z",
  },
  {
    href: "/admin/discounts",
    label: "Discounts",
    icon: "M4 10 10 4h6v6l-6 6-6-6Zm9-3.5h.01",
  },
  {
    href: "/admin/pages",
    label: "Pages",
    icon: "M6 3h6l4 4v10H6V3Zm6 0v4h4M8.5 11h5M8.5 14h5",
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: "M10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm0-4v2m0 10v2m7-7h-2M5 10H3m11.9-4.9-1.4 1.4M6.5 13.5l-1.4 1.4m0-9.8 1.4 1.4m7 7 1.4 1.4",
  },
  {
    href: "/admin/account",
    label: "My account",
    icon: "M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-6.5 8c.6-3.3 3.1-5 6.5-5s5.9 1.7 6.5 5",
  },
];

export function AdminNav({ orientation = "vertical" }: { orientation?: "vertical" | "horizontal" }) {
  const pathname = usePathname();

  return (
    <nav
      className={
        orientation === "vertical"
          ? "flex flex-col gap-1"
          : "flex gap-1 overflow-x-auto [scrollbar-width:none]"
      }
    >
      {LINKS.map((link) => {
        const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-200 ${
              active
                ? "bg-cream/10 text-cream"
                : "text-cream/60 hover:bg-cream/5 hover:text-cream"
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path d={link.icon} stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
            {link.label}
            {active && orientation === "vertical" ? (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gold" aria-hidden />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
