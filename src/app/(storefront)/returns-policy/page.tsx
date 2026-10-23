import type { Metadata } from "next";
import { PolicyPage } from "../policy-page";

export const metadata: Metadata = { title: "Return and Exchange Policy" };

export default function ReturnsPolicyPage() {
  return <PolicyPage slug="returns-policy" />;
}
