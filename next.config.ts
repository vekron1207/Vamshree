import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    serverActions: {
      // Admin image uploads: 10 MB per image (enforced in lib/uploads.ts)
      // plus multipart overhead.
      bodySizeLimit: "11mb",
    },
  },
};

export default nextConfig;
