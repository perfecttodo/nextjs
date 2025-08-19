import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async headers() {
    return [
      {
        // Apply this header to all routes
        source: '/(.*)',  // Adjust the regex if you want to target specific routes
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*', // Change '*' to your allowed origin
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,POST,OPTIONS,PUT', // Specify allowed methods
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type,Authorization', // Specify allowed headers
          },
        ],
      },
    ];
  },
};

export default nextConfig;
