import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@svgo-jsx/shared"],
};

export default nextConfig;
