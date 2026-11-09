import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proxify Supabase requests to shield direct domain exposure
  async rewrites() {
    return [
      {
        source: "/supabase-gateway/:path*",
        destination: "https://hipsfbtxlfykhproyqzx.supabase.co/:path*",
      },
    ];
  },
};

export default nextConfig;
