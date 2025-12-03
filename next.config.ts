import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Turbopack is enabled by default in Next.js 16
  turbopack: {},
  // Ensure Prisma generated files are included in the serverless function output
  // This is critical for Vercel deployments where the query engine binary must be available
  experimental: {
    outputFileTracingIncludes: {
      '/**': ['./generated/**'],
    },
  },
};

export default nextConfig;
