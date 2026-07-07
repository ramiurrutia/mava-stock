import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "vlawyyrcllvzepdbxaxc.supabase.co",
        pathname: "/storage/v1/object/public/sources/**",
      },
      {
        protocol: "https",
        hostname: "vlawyyrcllvzepdbxaxc.storage.supabase.co",
        pathname: "/storage/v1/object/public/sources/**",
      },
    ],
  },
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
