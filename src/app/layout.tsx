import type { Metadata } from "next";
import { Aboreto, Adamina, Roboto } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site-url";
import { MuiProvider } from "@/components/mui-provider";

const aboreto = Aboreto({
  variable: "--font-aboreto",
  weight: "400",
  subsets: ["latin"],
});

const adamina = Adamina({
  variable: "--font-adamina",
  weight: "400",
  subsets: ["latin"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Vaamshri | Adorne your story", template: "%s | Vaamshri" },
  description: "Adorne your story - fine jewellery by Vaamshri",
  ...(process.env.PREVIEW_MODE === "1" ? { robots: { index: false, follow: false } } : {}),
  openGraph: { siteName: "Vaamshri", type: "website", locale: "en_IN" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      data-scroll-behavior="smooth"
      lang="en"
      className={`${aboreto.variable} ${adamina.variable} ${roboto.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <MuiProvider>{children}</MuiProvider>
      </body>
    </html>
  );
}
