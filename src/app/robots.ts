import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/account", "/api", "/checkout", "/cart", "/invoice", "/media/pages"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
