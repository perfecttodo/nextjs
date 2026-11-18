import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: false,
  // 關鍵設定：禁止 Next.js 自動對結尾斜杠做 308 重導向（保護 /api/webdav）
  skipTrailingSlashRedirect: true,

  async rewrites() {
    return {
      fallback: [
        {
          source: "/:path((?!api/).*)/",
          destination: "/:path/index.html",
        },
      ],
    };
  },
};

export default nextConfig;
