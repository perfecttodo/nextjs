import type { NextConfig } from "next";
import WebpackObfuscator from "webpack-obfuscator";

const nextConfig: NextConfig = {
  trailingSlash: false,
  // 關鍵設定：禁止 Next.js 自動對結尾斜杠做 308 重導向（保護 /api/webdav）
  skipTrailingSlashRedirect: true,

  // 明確關閉生產環境的瀏覽器 Source Maps，防止暴露原始 TS/React 結構
  productionBrowserSourceMaps: false,

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

  webpack: (config, { isServer, dev }) => {
    // 僅在生產環境構建（next build）且為客戶端（瀏覽器）代碼時進行混淆
    // 絕對不碰 isServer（保護 /api/webdav 等後端介面），也不影響本地 npm run dev 除錯
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
