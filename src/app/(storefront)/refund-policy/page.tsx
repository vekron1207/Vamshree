import type { Metadata } from "next";
import { PolicyPage } from "../policy-page";

export const metadata: Metadata = { title: "Refund Policy" };

export default function RefundPolicyPage() {
  return <PolicyPage slug="refund-policy" />;
}
