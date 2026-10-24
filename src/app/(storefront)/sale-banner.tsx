import Image from "next/image";
import Link from "next/link";
import { getActiveSales } from "@/lib/promo";
import { getSaleBanner } from "@/lib/settings";
import { Countdown } from "@/components/countdown";

// Homepage sale banner. The owner's picture comes first (Admin > Settings > Sale banner).
// Without one, a text banner appears for the best running collection sale and
// disappears when it ends. Only ever one banner, never a slider.
export async function SaleBanner() {
  const banner = await getSaleBanner();

  if (banner.enabled) {
    const external = banner.link.startsWith("https://");
    const pic = (
      // Uploaded pictures can come from anywhere, so this stays a plain <img>
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={banner.imageUrl}
        alt={banner.alt || "Sale"}
        className="mx-auto block h-auto w-full max-w-[900px] rounded-2xl"
        loading="lazy"
      />
    );
    return (
      <section className="px-6 py-10 sm:py-14" aria-label="Sale">
        <div className="mx-auto max-w-6xl">
          {banner.link ? (
            external ? (
              <a href={banner.link} target="_blank" rel="noopener noreferrer" className="block">
                {pic}
              </a>
            ) : (
              <Link href={banner.link} className="block">
                {pic}
              </Link>
            )
          ) : (
            pic
          )}
        </div>
      </section>
    );
  }

  const [sale] = await getActiveSales();
  if (!sale) return null;

  return (
    <section className="px-6 py-10 sm:py-14" aria-label="Sale">
      <div className="mx-auto max-w-6xl">
        <article className="relative overflow-hidden rounded-[2rem] bg-forest-deep px-6 py-12 text-center sm:px-12 sm:py-16">
          <Image
            src="/brand/logo-mark.png"
            alt=""
            width={1200}
            height={724}
            unoptimized
            className="pointer-events-none absolute -right-16 -top-10 h-auto w-[420px] max-w-none opacity-[0.07]"
          />
          <span className="absolute left-5 top-5 -rotate-6 rounded-full bg-gold px-4 py-1.5 text-[11px] uppercase tracking-[0.16em] text-forest-deep shadow-lg sm:left-10 sm:top-8">
            &#10022; Sale is on
          </span>
          <p className="relative mt-8 text-[11px] uppercase tracking-[0.28em] text-gold sm:mt-4">{sale.name}</p>
          <p className="relative mt-3 font-display text-[clamp(3rem,11vw,7rem)] uppercase leading-none text-cream">{sale.label}</p>
          <p className="relative mx-auto mt-4 max-w-md font-tagline text-lg italic text-cream/70">
            Prices already marked down. No code needed.
          </p>
          {sale.endsAt ? (
            <div className="relative mt-7 flex flex-col items-center gap-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-cream/60">Ends in</p>
              <Countdown endsAt={sale.endsAt} />
            </div>
          ) : null}
          <Link
            href={`/collections/${sale.slug}`}
            className="relative mt-9 inline-block rounded-full bg-gold px-9 py-3.5 text-[12px] uppercase tracking-[0.18em] text-forest-deep transition-[background-color,transform] duration-300 hover:-translate-y-0.5 hover:bg-gold-soft"
          >
            Shop the sale
          </Link>
        </article>
      </div>
    </section>
  );
}
