import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  compress: true,
  poweredByHeader: false,

  // Enable PPR and experimental features for better performance
  experimental: {
    optimizePackageImports: ['recharts', '@heroicons/react'],
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
