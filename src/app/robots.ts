import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  // Client preview builds must stay out of search results
  if (process.env.PREVIEW_MODE === "1") return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/account", "/api", "/checkout", "/cart", "/invoice", "/media/pages"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
