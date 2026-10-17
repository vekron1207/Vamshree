import Image from "next/image";

// Trimmed brand artwork in public/brand. Sized by width with auto height so
// the marks keep their real proportions (the lotus is ~1.64:1, not square).
const MARK = { src: "/brand/logo-mark.png", width: 1200, height: 724 };
const WORDMARK = { src: "/brand/logo-wordmark.png", width: 1400, height: 546 };

const MARK_SIZES = {
  sm: "w-14", // admin chrome, mobile menu
  md: "w-20", // footer, sign-in
  lg: "w-28 sm:w-32", // page headers
  xl: "w-32 sm:w-40", // homepage hero
} as const;

export function BrandMark({
  size = "md",
  className = "",
  priority = false,
}: {
  size?: keyof typeof MARK_SIZES;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={MARK.src}
      alt=""
      width={MARK.width}
      height={MARK.height}
      unoptimized
      priority={priority}
      className={`h-auto ${MARK_SIZES[size]} ${className}`}
    />
  );
}

export function BrandWordmark({ className = "", priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src={WORDMARK.src}
      alt="Vaamshri"
      width={WORDMARK.width}
      height={WORDMARK.height}
      unoptimized
      priority={priority}
      className={`w-auto ${className}`}
    />
  );
}

export function InstagramQr({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-block rounded-xl bg-paper p-2.5 shadow-[0_1px_3px_rgba(18,20,15,0.08)] ring-1 ring-gold/40 ${className}`}>
      <Image
        src="/brand/instagram-qr.png"
        alt="QR code: scan to follow Vaamshri on Instagram"
        width={1056}
        height={1056}
        unoptimized
        className="h-auto w-32 sm:w-36"
      />
    </div>
  );
}
