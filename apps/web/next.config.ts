import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ["@excalidraw/excalidraw"],
  reactCompiler: true,
  experimental: {
    globalNotFound: true,
  },
  cacheComponents: true,
  async redirects() {
    return [
      {
        source: "/home",
        destination: "/home/lists",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
