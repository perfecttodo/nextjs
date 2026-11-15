import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. 强制所有路径末尾带斜杠（访问 /a 会自动跳转到 /a/）
  trailingSlash: true,

  async rewrites() {
    return {
      fallback: [
        {
          // 2. 适配带末尾斜杠的路径，映射到对应的 index.html
          source: "/:path((?!.*\\.).*)/",
          destination: "/:path/index.html",
        },
      ],
    };
  },
};

export default nextConfig;
