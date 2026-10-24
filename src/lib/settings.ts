import "server-only";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_SHIPPING, type ShippingRule } from "@/lib/shipping";

export type BusinessInfo = {
  legalName: string;
  gstin: string;
  address: string;
  phone: string;
  email: string;
  invoicePrefix: string;
};

export const DEFAULT_BUSINESS: BusinessInfo = {
  legalName: "Vaamshri Styles",
  gstin: "",
  address: "",
  phone: "",
  email: "",
  invoicePrefix: "VA",
};

export type StoreSettings = { lowStockThreshold: number };
export const DEFAULT_STORE: StoreSettings = { lowStockThreshold: 3 };

export type AnnouncementItem = { text: string; code: string; link: string };
export type Announcement = { enabled: boolean; items: AnnouncementItem[] };
export const DEFAULT_ANNOUNCEMENT: Announcement = { enabled: false, items: [] };

type Key = "shipping" | "business" | "store" | "announcement" | "hero";

async function read<T>(key: Key, fallback: T): Promise<T> {
  await connection();
  const row = await prisma.siteSetting.findUnique({ where: { key } });
  if (!row || typeof row.value !== "object" || row.value === null || Array.isArray(row.value)) return fallback;
  return { ...fallback, ...(row.value as object) } as T;
}

export const getShippingRule = () => read<ShippingRule>("shipping", DEFAULT_SHIPPING);
export const getBusinessInfo = () => read<BusinessInfo>("business", DEFAULT_BUSINESS);
export const getStoreSettings = () => read<StoreSettings>("store", DEFAULT_STORE);
// Older saves held a single {text, link}; read both shapes
export async function getAnnouncement(): Promise<Announcement> {
  const raw = await read<Record<string, unknown>>("announcement", {});
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  let items: AnnouncementItem[] = [];
  if (Array.isArray(raw.items)) {
    items = raw.items
      .map((i) => (i && typeof i === "object" ? (i as Record<string, unknown>) : {}))
      .map((i) => ({ text: str(i.text).trim(), code: str(i.code).trim(), link: str(i.link).trim() }))
      .filter((i) => i.text);
  } else if (str(raw.text).trim()) {
    items = [{ text: str(raw.text).trim(), code: "", link: str(raw.link).trim() }];
  }
  return { enabled: Boolean(raw.enabled) && items.length > 0, items };
}

export async function writeSetting(key: Key, value: object) {
  await prisma.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
}

// Homepage film. Empty means "use the built-in one".
export const DEFAULT_HERO = {
  desktop: "/brand/home-video-wide.mp4",
  mobile: "/brand/home-video-mobile.mp4",
};
const HERO_URL = /^\/media\/videos\/[0-9a-f-]{36}\.(mp4|webm)$/;

export type HeroVideos = { desktop: string; mobile: string; customDesktop: boolean; customMobile: boolean };

export async function getHeroVideos(): Promise<HeroVideos> {
  const raw = await read<Record<string, unknown>>("hero", {});
  const pick = (v: unknown) => (typeof v === "string" && HERO_URL.test(v) ? v : "");
  const desktop = pick(raw.desktop);
  const mobile = pick(raw.mobile);
  return {
    desktop: desktop || DEFAULT_HERO.desktop,
    mobile: mobile || DEFAULT_HERO.mobile,
    customDesktop: Boolean(desktop),
    customMobile: Boolean(mobile),
  };
}
