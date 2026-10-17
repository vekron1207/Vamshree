"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createCustomerSession, destroyCustomerSession } from "@/lib/customer-session";
import { looksLikeEmail, normalizeIndianPhone } from "@/lib/phone";
import { allow, clientIp, reset } from "@/lib/rate-limit";
import { passwordProblem, safeNext } from "@/lib/account-utils";

export type AuthState = { error?: string; fieldErrors?: Record<string, string> };

// Compared against when no account matches, so a miss costs the same time as a hit
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

export async function signupAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phoneRaw = String(formData.get("phone") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const fieldErrors: Record<string, string> = {};
  if (name.length < 2) fieldErrors.name = "Enter your full name.";
  if (name.length > 80) fieldErrors.name = "Keep your name under 80 characters.";
  if (!looksLikeEmail(email)) fieldErrors.email = "Enter a valid email address.";
  const phone = normalizeIndianPhone(phoneRaw);
  if (!phone) fieldErrors.phone = "Enter a 10-digit Indian mobile number, e.g. 98765 43210.";
  const pwProblem = passwordProblem(password);
  if (pwProblem) fieldErrors.password = pwProblem;
  else if (password !== confirm) fieldErrors.confirm = "The passwords don't match.";
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  if (!allow(`signup:${await clientIp()}`, 6, 60 * 60 * 1000)) {
    return { error: "Too many sign-up attempts. Try again in an hour." };
  }

  const clash = await prisma.customer.findFirst({
    where: { OR: [{ email }, { phone: phone! }] },
    select: { email: true },
  });
  if (clash) {
    return clash.email === email
      ? { fieldErrors: { email: "An account with this email already exists. Sign in instead." } }
      : { fieldErrors: { phone: "An account with this mobile number already exists. Sign in instead." } };
  }

  let customerId: string;
  try {
    const customer = await prisma.customer.create({
      data: { name, email, phone, passwordHash: await bcrypt.hash(password, 11) },
      select: { id: true },
    });
    customerId = customer.id;
  } catch {
    // Lost a race with a concurrent sign-up for the same email/phone
    return { error: "That email or mobile number is already registered. Try signing in." };
  }

  await createCustomerSession(customerId);
  redirect(safeNext(formData.get("next")));
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!identifier || !password) return { error: "Enter your email or mobile number and your password." };

  const phone = normalizeIndianPhone(identifier);
  const email = identifier.toLowerCase();
  const key = phone ?? email;

  const ip = await clientIp();
  const ipKey = `login-ip:${ip}`;
  const idKey = `login-id:${key}`;
  if (!allow(ipKey, 20, 15 * 60 * 1000) || !allow(idKey, 8, 15 * 60 * 1000)) {
    return { error: "Too many sign-in attempts. Wait 15 minutes, then try again." };
  }

  const customer = await prisma.customer.findFirst({
    where: phone ? { phone } : looksLikeEmail(email) ? { email } : { id: "no-match" },
    select: { id: true, passwordHash: true },
  });

  const ok = await bcrypt.compare(password, customer?.passwordHash ?? DUMMY_HASH);
  if (!customer || !customer.passwordHash || !ok) {
    return { error: "That email, mobile number or password isn't right." };
  }

  reset(idKey);
  await createCustomerSession(customer.id);
  redirect(safeNext(formData.get("next")));
}

export async function logoutAction() {
  await destroyCustomerSession();
  redirect("/");
}
