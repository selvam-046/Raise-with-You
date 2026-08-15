import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  typedRoutes: true,
  allowedDevOrigins: ["test.kannantech.com", "10.47.156.84"],
  experimental: {
    useTypeScriptCli: true,
  },
};

export default nextConfig;
