"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function setEnquiryReplied(id: string, replied: boolean) {
  await requireAdmin();
  await prisma.enquiry.updateMany({
    where: { id },
    data: { isReplied: replied, repliedAt: replied ? new Date() : null },
  });
  revalidatePath("/admin/enquiries");
  revalidatePath("/admin");
}

export async function deleteEnquiry(id: string) {
  await requireAdmin();
  await prisma.enquiry.deleteMany({ where: { id } });
  revalidatePath("/admin/enquiries");
  revalidatePath("/admin");
}
