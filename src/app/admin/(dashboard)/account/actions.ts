"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { allow } from "@/lib/rate-limit";

export type PasswordResult = { ok: true } | { ok: false; error: string };

export async function changeAdminPassword(fd: FormData): Promise<PasswordResult> {
  const session = await requireAdmin();
  if (!allow(`admin-pw:${session.adminId}`, 6, 15 * 60 * 1000)) {
    return { ok: false, error: "Too many attempts. Please wait a few minutes and try again." };
  }
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  const confirm = String(fd.get("confirm") ?? "");

  if (next.length < 10) return { ok: false, error: "Use at least 10 characters for the new password." };
  if (next.length > 100) return { ok: false, error: "That password is too long." };
  if (next !== confirm) return { ok: false, error: "The two new passwords don't match." };
  if (next === current) return { ok: false, error: "Choose a password different from the current one." };

  const admin = await prisma.admin.findUnique({ where: { id: session.adminId } });
  if (!admin || !(await bcrypt.compare(current, admin.passwordHash))) {
    return { ok: false, error: "Your current password isn't right." };
  }
  await prisma.admin.update({ where: { id: admin.id }, data: { passwordHash: await bcrypt.hash(next, 10) } });
  return { ok: true };
}
