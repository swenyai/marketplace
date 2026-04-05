import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: ["yaml"],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // @sweny-ai/core/dist/skills/index.js uses node:fs + node:path for
      // custom skill discovery. Replace it with a browser-safe shim that
      // exports only the static builtin skill objects.
      config.resolve.alias = {
        ...config.resolve.alias,
        [path.resolve(__dirname, "node_modules/@sweny-ai/core/dist/skills/index.js")]:
          path.resolve(__dirname, "src/lib/skills-browser-shim.js"),
      };
    }
    return config;
  },
};

export default nextConfig;
