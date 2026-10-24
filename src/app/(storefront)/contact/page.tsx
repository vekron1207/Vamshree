import { Suspense } from "react";
import { getSitePage, toParagraphs } from "@/lib/site-pages";
import { EnquiryForm } from "./enquiry-form";

export default function ContactPage() {
  return (
    <Suspense fallback={<div className="mx-auto h-96 max-w-3xl animate-pulse" />}>
      <ContactContent />
    </Suspense>
  );
}

function digits(value: string) {
  return value.replace(/[^\d+]/g, "");
}

async function ContactContent() {
  const page = await getSitePage("contact");
  const { email, phone, whatsapp, address, hours } = page.contact;
  const paragraphs = toParagraphs(page.body);

  const methods = [
    email && { label: "Email", value: email, href: `mailto:${email}` },
    phone && { label: "Phone", value: phone, href: `tel:${digits(phone)}` },
    whatsapp && {
      label: "WhatsApp",
      value: whatsapp,
      href: `https://wa.me/${digits(whatsapp).replace(/^\+/, "")}`,
      external: true,
    },
  ].filter(Boolean) as { label: string; value: string; href: string; external?: boolean }[];

  // Only boxes with something in them; each box keeps its own place and the grid re-balances itself
  type Cell = { label: string; value: string; href?: string; external?: boolean; address?: boolean };
  const cells: Cell[] = [
    ...methods,
    ...(address.trim() ? [{ label: "Visit", value: address, address: true }] : []),
    ...(hours.trim() ? [{ label: "Hours", value: hours }] : []),
  ];
  const hasDetails = cells.length > 0;

  return (
    <div className="mx-auto max-w-4xl px-6 pb-24 pt-14">
      <header className="text-center">
        <h1 className="font-display text-4xl text-forest sm:text-5xl">{page.title}</h1>
        {page.intro ? (
          <p className="mx-auto mt-6 max-w-xl font-tagline text-xl italic leading-relaxed text-ink/75">{page.intro}</p>
        ) : null}
      </header>

      {page.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={page.imageUrl} alt="" className="mt-12 aspect-[16/9] w-full rounded-t-[2.5rem] object-cover" />
      ) : null}

      {hasDetails ? (
        <div className="mt-14 grid gap-px overflow-hidden border border-gold/30 bg-gold/30 sm:grid-cols-2">
          {cells.map((c, i) => {
            // An odd number of boxes would leave a hole in the grid: the last one stretches across
            const wide = cells.length % 2 === 1 && i === cells.length - 1 ? "sm:col-span-2" : "";
            const label = <p className="text-[11px] uppercase tracking-[0.22em] text-gold">{c.label}</p>;
            return c.href ? (
              <a
                key={c.label}
                href={c.href}
                {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className={`group bg-cream p-7 transition-colors hover:bg-paper ${wide}`}
              >
                {label}
                <p className="mt-3 break-words font-display text-lg text-forest group-hover:underline group-hover:underline-offset-4">
                  {c.value}
                </p>
              </a>
            ) : (
              <div key={c.label} className={`bg-cream p-7 ${wide}`}>
                {label}
                {c.address ? (
                  <address className="mt-3 whitespace-pre-line not-italic leading-relaxed text-ink/80">{c.value}</address>
                ) : (
                  <p className="mt-3 leading-relaxed text-ink/80">{c.value}</p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-14 text-center text-ink/50">Contact details are coming soon.</p>
      )}

      <section className="mx-auto mt-16 max-w-2xl">
        <h2 className="text-center font-display text-2xl text-forest sm:text-3xl">Send us a message</h2>
        <p className="mx-auto mt-3 max-w-md text-center text-sm text-ink/60">
          Questions about a piece, an order or a gift? Write to us here and we&rsquo;ll reply by email.
        </p>
        <div className="relative mt-8">
          <EnquiryForm />
        </div>
      </section>

      {paragraphs.length > 0 ? (
        <div className="mx-auto mt-14 max-w-2xl space-y-5 leading-relaxed text-ink/75">
          {paragraphs.map((p, i) => (
            <p key={i} className="whitespace-pre-line">
              {p}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
