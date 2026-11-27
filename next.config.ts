import type { NextConfig } from "next";
import WebpackObfuscator from "webpack-obfuscator";

const nextConfig: NextConfig = {
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  productionBrowserSourceMaps: false,

  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/",
          destination: "/index.html",
        },
      ],
      fallback: [
        {
          source: "/:path((?!api/).*)/",
          destination: "/:path/index.html",
        },
      ],
    };
  },

  webpack: (config, { isServer, dev }) => {
    if (!dev && !isServer) {
      config.plugins.push(
        new WebpackObfuscator(
          {
            rotateStringArray: true,
            stringArray: true,
            stringArrayThreshold: 0.75,
            compact: true,
            controlFlowFlattening: false,
          },
          [
            "static/chunks/framework-*.js",
            "static/chunks/main-*.js",
            "static/chunks/polyfills-*.js",
            "static/chunks/webpack-*.js",
          ]
        )
      );
    }
    return config;
  },
};

export default nextConfig;
