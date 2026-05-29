import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Increase server body size for large file uploads
  serverExternalPackages: ['sharp'],
};

export default nextConfig;
