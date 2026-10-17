import Link from "next/link";
import { Suspense, ViewTransition } from "react";
import { CartProvider } from "@/lib/cart-context";
import { WishlistProvider } from "@/lib/wishlist-context";
import { SiteHeader } from "./site-header";
import { CATEGORIES, POLICY_LINKS } from "@/lib/site-content";
import { BrandMark, InstagramQr } from "@/components/brand";
import { WhatsAppButton } from "./whatsapp-button";
import { DrawerCollectionLinks, FooterCollectionLinks } from "./collection-links";

const currentYear = new Date().getFullYear();

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <WishlistProvider>
      <SiteHeader
        drawerCollections={
          <Suspense fallback={<div className="mt-3 h-32 animate-pulse rounded bg-ink/5" />}>
            <DrawerCollectionLinks />
          </Suspense>
        }
      />

      <ViewTransition>
        <main className="flex-1">{children}</main>
      </ViewTransition>

      <footer className="border-t border-gold/30 bg-cream">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <BrandMark size="md" />
              <p className="mt-4 max-w-xs font-tagline text-lg italic leading-relaxed text-ink/70">
                Adorne your story.
              </p>
              <figure className="mt-7">
                <InstagramQr />
                <figcaption className="mt-3 text-xs uppercase tracking-[0.16em] text-ink/60">
                  Scan to follow us on Instagram
                </figcaption>
              </figure>
            </div>

            <FooterColumn title="Shop">
              {CATEGORIES.map((c) => (
                <FooterLink key={c.slug} href={`/products?category=${c.slug}`}>
                  {c.label}
                </FooterLink>
              ))}
            </FooterColumn>

            <FooterColumn title="Collections">
              <Suspense fallback={<li className="h-24 animate-pulse rounded bg-ink/5" />}>
                <FooterCollectionLinks />
              </Suspense>
            </FooterColumn>

            <FooterColumn title="Help">
              {POLICY_LINKS.map((link) => (
                <FooterLink key={link.slug} href={`/${link.slug}`}>
                  {link.label}
                </FooterLink>
              ))}
            </FooterColumn>
          </div>

          <div className="mt-14 flex flex-col gap-2 border-t border-gold/20 pt-6 text-[11px] uppercase tracking-[0.14em] text-ink/45 sm:flex-row sm:justify-between">
            <p>Copyright &copy;{currentYear} Vaamshri. All rights reserved.</p>
            <p>Payments secured by Razorpay</p>
          </div>
        </div>
      </footer>
      <Suspense fallback={null}>
        <WhatsAppButton />
      </Suspense>
      </WishlistProvider>
    </CartProvider>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-display text-sm tracking-[0.1em] text-forest">{title}</p>
      <ul className="mt-5 space-y-2.5 text-sm text-ink/65">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="transition-colors hover:text-forest">
        {children}
      </Link>
    </li>
  );
}
