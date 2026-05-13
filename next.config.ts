import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  // Self-contained production bundle. CI ships .next/standalone/ to EC2;
  // EC2 runs `node server.js` directly without rebuilding. Cuts deploy
  // time from ~5min to ~60s. The CI step copies /public and /.next/static
  // into the bundle (Next doesn't auto-copy them).
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname),
  transpilePackages: ["@anchor-lang/core"],
  experimental: { serverActions: { bodySizeLimit: "2mb" } },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      "pino-pretty": false,
    };
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@farcaster/mini-app-solana": false,
      "@farcaster/frame-sdk": false,
      "@solana/wallet-adapter-react": false,
    };
    return config;
  },
};

export default nextConfig;
