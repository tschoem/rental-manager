import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Ensure Prisma generated files are included in the build
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Don't externalize Prisma generated client
      config.externals = config.externals || [];
      // Filter out any externals that might exclude our generated client
      if (Array.isArray(config.externals)) {
        config.externals = config.externals.filter((external: unknown) => {
          if (typeof external === 'function') {
            return true; // Keep function externals
          }
          if (typeof external === 'string' && external.includes('generated')) {
            return false; // Don't externalize generated files
          }
          return true;
        });
      }
    }
    return config;
  },
};

export default nextConfig;
