import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import withBundleAnalyzerFactory from "@next/bundle-analyzer";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
const withBundleAnalyzer = withBundleAnalyzerFactory({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  experimental: {
    // nodeMiddleware is supported in Next.js 15.1+ but not yet typed
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    nodeMiddleware: true,
  },
  // When running via WSL2 (portless), redirect .next cache to native Linux fs to avoid NTFS lock issues
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  // Keep Neon driver out of the Turbopack/webpack bundle — it uses native bindings
  serverExternalPackages: ["@neondatabase/serverless"],
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    localPatterns: [
      { pathname: "/images/**" },
    ],
    remotePatterns: [
      { protocol: "https", hostname: "*.amazonaws.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default withBundleAnalyzer(withNextIntl(nextConfig));
