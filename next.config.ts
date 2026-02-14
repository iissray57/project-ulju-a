import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Three.js SSR 방지
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
};

export default nextConfig;
