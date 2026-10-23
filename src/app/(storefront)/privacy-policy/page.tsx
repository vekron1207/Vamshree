import type { Metadata } from "next";
import { PolicyPage } from "../policy-page";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPolicyPage() {
  return <PolicyPage slug="privacy-policy" />;
}
