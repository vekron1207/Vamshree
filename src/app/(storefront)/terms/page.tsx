import type { Metadata } from "next";
import { PolicyPage } from "../policy-page";

export const metadata: Metadata = { title: "Terms & Conditions" };

export default function TermsPage() {
  return <PolicyPage slug="terms" />;
}
