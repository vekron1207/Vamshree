import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    agentUpgrade: "security",
    // Shared hosting reports dozens of CPU cores but allows very few processes:
    // an unlimited worker pool gets the build killed (SIGABRT)
    cpus: 2,
    serverActions: {
      // Admin image uploads: 10 MB per image (enforced in lib/uploads.ts)
      // plus multipart overhead.
      bodySizeLimit: "11mb",
    },
  },
  // Addresses from the old WordPress shop, so links on Google, Instagram and in old
  // messages keep working after vaamshri.com moves to this site.
  async redirects() {
    const to = (source: string, destination: string) => ({ source, destination, permanent: true });
    const collections = [
      ["rare-story-collection", "rare-story"],
      ["golden-hour-story-collection", "golden-hour-story"],
      ["everyday-story-collection", "everyday-story"],
      ["moonlight-story-collection", "moonlight-story"],
    ] as const;
    return [
      to("/product/:slug", "/products/:slug"),
      // Categories
      to("/product-category/shop-by-category/bracelet", "/products?category=bracelets"),
      to("/product-category/shop-by-category/earrings-2", "/products?category=earrings"),
      to("/product-category/shop-by-category/pendant", "/products?category=pendants"),
      to("/product-category/shop-by-category/pendant-set", "/products?category=pendant-sets"),
      to("/product-category/shop-by-category/rings", "/products?category=rings"),
      // Collections, their sub-categories and the landing pages built for them
      ...collections.flatMap(([old, slug]) => [
        to(`/product-category/shop-by-collection/${old}`, `/collections/${slug}`),
        to(`/product-category/shop-by-collection/${old}/:rest*`, `/collections/${slug}`),
        to(`/${old}-:rest`, `/collections/${slug}`),
      ]),
      to("/golden-hour-story_all-products", "/collections/golden-hour-story"),
      to("/everyday-story-collection_all-products", "/collections/everyday-story"),
      to("/moonlight-story-collection_all-products", "/collections/moonlight-story"),
      to("/rare-story-collection_all-products", "/collections/rare-story"),
      to("/product-category/:rest*", "/products"),
      // Pages
      to("/about-us", "/about"),
      to("/contact-us", "/contact"),
      to("/shipping-and-delivery", "/shipping-policy"),
      to("/return-and-exchange-policy", "/returns-policy"),
      to("/orders-refund-policy", "/order-cancellation-policy"),
      to("/terms-conditions", "/terms"),
      to("/all-products", "/products"),
      to("/shop", "/products"),
      to("/wishlist-2", "/wishlist"),
      to("/my-account", "/account"),
    ];
  },
};

export default nextConfig;
