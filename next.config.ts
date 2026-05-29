import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  serverExternalPackages: ['mammoth', 'exceljs', 'pdf-parse', 'docx'],
};

export default nextConfig;
