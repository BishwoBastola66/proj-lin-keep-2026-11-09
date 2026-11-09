import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 's4.anilist.co' },
      { protocol: 'https', hostname: 'animesalt.ro' },
      { protocol: 'https', hostname: 'cdn.myanimelist.net' },
      { protocol: 'https', hostname: 'img.flawlessfiles.com' },
      { protocol: 'https', hostname: '**.anilist.co' },
      { protocol: 'https', hostname: '**.animesalt.ro' },
      { protocol: 'https', hostname: 'images.unsplash.com' }
    ],
    unoptimized: true
  }
};

export default nextConfig;
