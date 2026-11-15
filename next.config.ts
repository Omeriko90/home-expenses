import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app is inherently dynamic (auth, cookies, DB per request), so the
  // experimental static-prerender features add friction without benefit.
  cacheComponents: false,
  partialPrefetching: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
