import type { Metadata } from "next";
import { PolicyPage } from "../policy-page";

export const metadata: Metadata = { title: "Shipping and Delivery" };

export default function ShippingPolicyPage() {
  return <PolicyPage slug="shipping-policy" />;
}
