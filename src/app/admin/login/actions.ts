"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createAdminSession } from "@/lib/session";
import { allow, clientIp, reset } from "@/lib/rate-limit";

export type LoginState = { error?: string };

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  // Slow down password guessing: per address and per account
  const ipKey = `admin-ip:${await clientIp()}`;
  const idKey = `admin-id:${email}`;
  if (!allow(ipKey, 20, 15 * 60 * 1000) || !allow(idKey, 8, 15 * 60 * 1000)) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }

  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) return { error: "Invalid email or password" };

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) return { error: "Invalid email or password" };

  reset(idKey);
  await createAdminSession({ adminId: admin.id, email: admin.email, role: admin.role });
  redirect("/admin");
}
