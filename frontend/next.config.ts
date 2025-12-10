import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async rewrites() {
    console.log('Backend URL for rewrites:', process.env.BACKEND_URL);
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5005';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/recordings/:path*',
        destination: `${backendUrl}/recordings/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
