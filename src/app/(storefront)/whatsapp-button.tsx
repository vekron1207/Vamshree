import { getSitePage } from "@/lib/site-pages";

// Floating chat shortcut, shown once a WhatsApp number is set on the Contact page
export async function WhatsAppButton() {
  const { whatsapp } = (await getSitePage("contact")).contact;
  const digits = whatsapp.replace(/\D/g, "");
  if (digits.length < 8) return null;
  // A bare 10-digit number is an Indian mobile
  const number = digits.length === 10 ? `91${digits}` : digits;
  return (
    <a
      href={`https://wa.me/${number}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 print:hidden"
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 2.5a9.5 9.5 0 0 0-8.1 14.4L2.5 21.5l4.7-1.2A9.5 9.5 0 1 0 12 2.5Zm4.9 13.1c-.2.6-1.2 1.1-1.7 1.2-.4.1-1 .1-1.6-.1-.4-.1-.9-.3-1.5-.6-2.6-1.1-4.300-3.700-4.400-3.900-.1-.2-1-1.300-1-2.500s.6-1.800.9-2c.2-.2.5-.3.700-.3h.5c.2 0 .4 0 .6.5l.8 1.900c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.2-.3.3-.1.600.2.3.8 1.300 1.700 2.100 1.100 1 2 1.300 2.300 1.400.3.100.5.1.600-.1l.9-1.100c.2-.2.4-.2.600-.1l1.800.9c.2.1.4.2.4.3.1.1.1.600-.1 1.200Z" />
      </svg>
    </a>
  );
}
