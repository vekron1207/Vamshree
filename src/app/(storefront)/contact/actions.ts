"use server";

import { prisma } from "@/lib/prisma";
import { allow, clientIp } from "@/lib/rate-limit";
import { looksLikeEmail, normalizeIndianPhone } from "@/lib/phone";

export type EnquiryResult = { ok: true } | { ok: false; error: string };

const clean = (v: FormDataEntryValue | null, max: number) => String(v ?? "").trim().slice(0, max);

export async function submitEnquiry(formData: FormData): Promise<EnquiryResult> {
  // Hidden field only bots fill in: pretend it worked
  if (clean(formData.get("website"), 200)) return { ok: true };

  if (!allow(`enquiry:${await clientIp()}`, 5, 60 * 60 * 1000)) {
    return { ok: false, error: "You've sent a few messages already. Please try again in a little while." };
  }

  const name = clean(formData.get("name"), 80);
  const email = clean(formData.get("email"), 120).toLowerCase();
  const phoneRaw = clean(formData.get("phone"), 30);
  const message = clean(formData.get("message"), 2000);

  if (name.length < 2) return { ok: false, error: "Please enter your name." };
  if (!looksLikeEmail(email)) return { ok: false, error: "Please enter a valid email address." };
  let phone: string | null = null;
  if (phoneRaw) {
    phone = normalizeIndianPhone(phoneRaw);
    if (!phone) return { ok: false, error: "Enter a valid 10-digit Indian mobile number, or leave it blank." };
  }
  if (message.length < 10) return { ok: false, error: "Please tell us a little more (at least 10 characters)." };

  try {
    await prisma.enquiry.create({ data: { name, email, phone, message } });
  } catch (err) {
    console.error("submitEnquiry failed:", err);
    return { ok: false, error: "We couldn't send that just now. Please try again in a moment." };
  }
  return { ok: true };
}
