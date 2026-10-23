import type { Metadata } from "next";
import { PolicyPage } from "../policy-page";

export const metadata: Metadata = { title: "Order and Cancellation Policy" };

export default function OrderCancellationPolicyPage() {
  return <PolicyPage slug="order-cancellation-policy" />;
}
