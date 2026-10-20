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

export type Announcement = { enabled: boolean; text: string; link: string };
export const DEFAULT_ANNOUNCEMENT: Announcement = { enabled: false, text: "", link: "" };

type Key = "shipping" | "business" | "store" | "announcement";

async function read<T>(key: Key, fallback: T): Promise<T> {
  await connection();
  const row = await prisma.siteSetting.findUnique({ where: { key } });
  if (!row || typeof row.value !== "object" || row.value === null || Array.isArray(row.value)) return fallback;
  return { ...fallback, ...(row.value as object) } as T;
}

export const getShippingRule = () => read<ShippingRule>("shipping", DEFAULT_SHIPPING);
export const getBusinessInfo = () => read<BusinessInfo>("business", DEFAULT_BUSINESS);
export const getStoreSettings = () => read<StoreSettings>("store", DEFAULT_STORE);
export const getAnnouncement = () => read<Announcement>("announcement", DEFAULT_ANNOUNCEMENT);

export async function writeSetting(key: Key, value: object) {
  await prisma.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
}
