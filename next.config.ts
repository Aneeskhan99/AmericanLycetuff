import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for deploying on our own server (node .next/standalone/server.js)
  output: "standalone",
  // Belt and braces: the admin and its API are never indexed, whatever a page says.
  async headers() {
    return [
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "Cache-Control", value: "no-store" }] },
      { source: "/api/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
  images: {
    qualities: [75, 85],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
