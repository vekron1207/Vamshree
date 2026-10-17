"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customer-auth";
import { looksLikeEmail, normalizeIndianPhone, isValidPincode } from "@/lib/phone";
import { passwordProblem } from "@/lib/account-utils";
import { allow, clientIp } from "@/lib/rate-limit";

export type FormState = { error?: string; fieldErrors?: Record<string, string>; saved?: number };

const MAX_ADDRESSES = 10;

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await requireCustomer("/account/profile");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = normalizeIndianPhone(String(formData.get("phone") ?? ""));

  const fieldErrors: Record<string, string> = {};
  if (name.length < 2 || name.length > 80) fieldErrors.name = "Enter your full name.";
  if (!looksLikeEmail(email)) fieldErrors.email = "Enter a valid email address.";
  if (!phone) fieldErrors.phone = "Enter a 10-digit Indian mobile number.";
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const clash = await prisma.customer.findFirst({
    where: { id: { not: me.id }, OR: [{ email }, { phone: phone! }] },
    select: { email: true },
  });
  if (clash) {
    return clash.email === email
      ? { fieldErrors: { email: "Another account already uses this email." } }
      : { fieldErrors: { phone: "Another account already uses this mobile number." } };
  }

  try {
    await prisma.customer.update({ where: { id: me.id }, data: { name, email, phone } });
  } catch {
    return { error: "Couldn't save your details. Try again." };
  }
  revalidatePath("/account", "layout");
  return { saved: Date.now() };
}

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await requireCustomer("/account/profile");
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!allow(`pw-change:${me.id}`, 6, 15 * 60 * 1000) || !allow(`pw-ip:${await clientIp()}`, 20, 15 * 60 * 1000)) {
    return { error: "Too many attempts. Wait 15 minutes, then try again." };
  }

  const row = await prisma.customer.findUnique({ where: { id: me.id }, select: { passwordHash: true } });
  if (!row?.passwordHash || !(await bcrypt.compare(current, row.passwordHash))) {
    return { fieldErrors: { current: "That isn't your current password." } };
  }
  const problem = passwordProblem(next);
  if (problem) return { fieldErrors: { next: problem } };
  if (next !== confirm) return { fieldErrors: { confirm: "The passwords don't match." } };

  await prisma.customer.update({ where: { id: me.id }, data: { passwordHash: await bcrypt.hash(next, 11) } });
  return { saved: Date.now() };
}

function parseAddress(formData: FormData) {
  const get = (k: string) => String(formData.get(k) ?? "").trim();
  const phone = normalizeIndianPhone(get("phone"));
  const data = {
    label: get("label") || "Home",
    fullName: get("fullName"),
    phone: phone ?? "",
    line1: get("line1"),
    line2: get("line2") || null,
    city: get("city"),
    state: get("state"),
    postalCode: get("postalCode"),
    country: "India",
    isDefault: formData.get("isDefault") === "on",
  };

  const fieldErrors: Record<string, string> = {};
  if (data.fullName.length < 2) fieldErrors.fullName = "Enter the recipient's name.";
  if (!phone) fieldErrors.phone = "Enter a 10-digit Indian mobile number.";
  if (data.line1.length < 3) fieldErrors.line1 = "Enter the street address.";
  if (data.city.length < 2) fieldErrors.city = "Enter the city.";
  if (data.state.length < 2) fieldErrors.state = "Choose the state.";
  if (!isValidPincode(data.postalCode)) fieldErrors.postalCode = "Enter a 6-digit PIN code.";
  if (data.label.length > 30) fieldErrors.label = "Keep the label under 30 characters.";
  for (const [k, v] of Object.entries(data)) {
    if (typeof v === "string" && v.length > 200) fieldErrors[k] = "That's too long.";
  }
  return { data, fieldErrors };
}

export async function saveAddressAction(
  id: string | null,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const me = await requireCustomer("/account/addresses");
  const { data, fieldErrors } = parseAddress(formData);
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const count = await prisma.address.count({ where: { customerId: me.id } });
  if (!id && count >= MAX_ADDRESSES) {
    return { error: `You can save up to ${MAX_ADDRESSES} addresses. Delete one to add another.` };
  }

  // The first address is always the default
  const makeDefault = data.isDefault || (!id && count === 0);

  await prisma.$transaction(async (tx) => {
    if (makeDefault) {
      await tx.address.updateMany({ where: { customerId: me.id }, data: { isDefault: false } });
    }
    if (id) {
      // Scoped by customerId: a guessed id belonging to someone else matches nothing
      const res = await tx.address.updateMany({
        where: { id, customerId: me.id },
        data: { ...data, isDefault: makeDefault || undefined },
      });
      if (res.count === 0) throw new Error("not-found");
    } else {
      await tx.address.create({ data: { ...data, isDefault: makeDefault, customerId: me.id } });
    }
  }).catch((e) => {
    if (e instanceof Error && e.message === "not-found") return;
    throw e;
  });

  revalidatePath("/account/addresses");
  redirect("/account/addresses");
}

export async function deleteAddressAction(id: string) {
  const me = await requireCustomer("/account/addresses");
  const target = await prisma.address.findFirst({ where: { id, customerId: me.id } });
  if (!target) return;
  await prisma.address.delete({ where: { id } });
  if (target.isDefault) {
    const next = await prisma.address.findFirst({ where: { customerId: me.id }, orderBy: { createdAt: "asc" } });
    if (next) await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
  }
  revalidatePath("/account/addresses");
}

export async function setDefaultAddressAction(id: string) {
  const me = await requireCustomer("/account/addresses");
  const target = await prisma.address.findFirst({ where: { id, customerId: me.id }, select: { id: true } });
  if (!target) return;
  await prisma.$transaction([
    prisma.address.updateMany({ where: { customerId: me.id }, data: { isDefault: false } }),
    prisma.address.update({ where: { id }, data: { isDefault: true } }),
  ]);
  revalidatePath("/account/addresses");
}
