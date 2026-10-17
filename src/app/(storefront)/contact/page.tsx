import { Suspense } from "react";
import { getSitePage, toParagraphs } from "@/lib/site-pages";

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

  const hasDetails = methods.length > 0 || address || hours;

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
          {methods.map((m) => (
            <a
              key={m.label}
              href={m.href}
              {...(m.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="group bg-cream p-7 transition-colors hover:bg-paper"
            >
              <p className="text-[11px] uppercase tracking-[0.22em] text-gold">{m.label}</p>
              <p className="mt-3 break-words font-display text-lg text-forest group-hover:underline group-hover:underline-offset-4">
                {m.value}
              </p>
            </a>
          ))}
          {address ? (
            <div className="bg-cream p-7">
              <p className="text-[11px] uppercase tracking-[0.22em] text-gold">Visit</p>
              <address className="mt-3 whitespace-pre-line not-italic leading-relaxed text-ink/80">{address}</address>
            </div>
          ) : null}
          {hours ? (
            <div className="bg-cream p-7">
              <p className="text-[11px] uppercase tracking-[0.22em] text-gold">Hours</p>
              <p className="mt-3 leading-relaxed text-ink/80">{hours}</p>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="mt-14 text-center text-ink/50">Contact details are coming soon.</p>
      )}

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
