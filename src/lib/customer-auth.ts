import "server-only";
import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/customer-session";

export async function requireCustomer(next = "/account") {
  const customer = await getCurrentCustomer();
  if (!customer) redirect(`/account/login?next=${encodeURIComponent(next)}`);
  return customer;
}
