import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Shared hosting reports dozens of CPU cores but allows very few processes:
    // an unlimited worker pool gets the build killed (SIGABRT)
    cpus: 2,
    serverActions: {
      // Admin image uploads: 10 MB per image (enforced in lib/uploads.ts)
      // plus multipart overhead.
      bodySizeLimit: "11mb",
    },
  },
};

export default nextConfig;
