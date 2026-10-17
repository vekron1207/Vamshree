import "server-only";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";

export const EDITABLE_PAGES = ["about", "contact"] as const;
export type EditablePageSlug = (typeof EDITABLE_PAGES)[number];

export type ContactDetails = {
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  hours: string;
};

export type SitePageContent = {
  slug: EditablePageSlug;
  title: string;
  intro: string;
  body: string;
  imageUrl: string | null;
  contact: ContactDetails;
  updatedAt: Date | null;
};

const EMPTY_CONTACT: ContactDetails = { email: "", phone: "", whatsapp: "", address: "", hours: "" };

const DEFAULTS: Record<EditablePageSlug, Omit<SitePageContent, "updatedAt">> = {
  about: {
    slug: "about",
    title: "About Vaamshri",
    intro: "At Vaamshri, we believe every story deserves more than to be told. It deserves to be adorned.",
    body: "The milestones, the quiet victories, the moments that made you who you are today. Your story isn’t ordinary; it’s yours, and that makes it beautiful. Just like the right piece of jewellery doesn’t just complete an outfit, it becomes a part of your story, worn close, carried with you, and remembered forever.",
    imageUrl: null,
    contact: EMPTY_CONTACT,
  },
  contact: {
    slug: "contact",
    title: "Contact Us",
    intro: "Questions about an order, a piece, or a gift? We'd love to hear from you.",
    body: "",
    imageUrl: null,
    contact: EMPTY_CONTACT,
  },
};

function asContact(value: unknown): ContactDetails {
  const v = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const str = (k: keyof ContactDetails) => (typeof v[k] === "string" ? (v[k] as string) : "");
  return { email: str("email"), phone: str("phone"), whatsapp: str("whatsapp"), address: str("address"), hours: str("hours") };
}

export function isEditablePage(slug: string): slug is EditablePageSlug {
  return (EDITABLE_PAGES as readonly string[]).includes(slug);
}

export async function getSitePage(slug: EditablePageSlug): Promise<SitePageContent> {
  await connection();
  const row = await prisma.sitePage.findUnique({ where: { slug } });
  const fallback = DEFAULTS[slug];
  if (!row) return { ...fallback, updatedAt: null };
  return {
    slug,
    title: row.title || fallback.title,
    intro: row.intro ?? "",
    body: row.body ?? "",
    imageUrl: row.imageUrl,
    contact: asContact(row.details),
    updatedAt: row.updatedAt,
  };
}

// Plain text in, paragraphs out. Content is rendered as text, never HTML.
export function toParagraphs(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
