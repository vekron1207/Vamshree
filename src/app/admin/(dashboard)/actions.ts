"use server";

import { redirect } from "next/navigation";
import { destroyAdminSession } from "@/lib/session";

export async function logoutAction() {
  await destroyAdminSession();
  redirect("/admin/login");
}
