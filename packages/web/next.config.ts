import type { NextConfig } from "next";
import path from "path";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@svgo-jsx/shared"],
  // Required for pnpm monorepo - trace from monorepo root to properly resolve symlinks
  outputFileTracingRoot: path.join(__dirname, "../../"),
  // Externalize native modules for server-side use
  serverExternalPackages: ["@resvg/resvg-js", "sharp"],
};

export default withNextIntl(nextConfig);
