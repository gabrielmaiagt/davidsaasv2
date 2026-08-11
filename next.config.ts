import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Injetado automaticamente pela Vercel a cada deploy; 'dev' localmente.
    NEXT_PUBLIC_APP_VERSION: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'dev',
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
    proxyClientMaxBodySize: '50mb'
  },
};

export default nextConfig;
