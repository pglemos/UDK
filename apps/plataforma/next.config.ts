import path from "node:path";
import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [82, 84, 86, 88, 90],
    deviceSizes: [480, 640, 750, 828, 1080, 1200, 1600, 1920, 2400],
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default config;
