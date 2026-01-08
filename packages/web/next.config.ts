import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@svgo-jsx/shared"],
  // Required for pnpm monorepo - trace from monorepo root to properly resolve symlinks
  outputFileTracingRoot: path.join(__dirname, "../../"),
};

export default nextConfig;
