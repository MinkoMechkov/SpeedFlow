import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(fileURLToPath(import.meta.url));
const requestConfig = path.join(root, "src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Manual next-intl alias (avoids createNextIntlPlugin → @swc/core on this host).
  turbopack: {
    resolveAlias: {
      "next-intl/config": "./src/i18n/request.ts",
    },
  },
  webpack(config) {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...config.resolve.alias,
      "next-intl/config": requestConfig,
    };
    return config;
  },
};

export default nextConfig;
