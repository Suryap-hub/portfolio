import type { NextConfig } from "next";

// Where the FastAPI backend runs when the browser calls this site's own /api/...
const backend = (process.env.BACKEND_URL || "http://localhost:8000").replace(/\/$/, "");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Don't gzip responses: compression buffers the streamed (SSE) chat answers.
  compress: false,
  async rewrites() {
    // If NEXT_PUBLIC_API_URL is set, the browser calls the backend directly instead.
    if (process.env.NEXT_PUBLIC_API_URL) return [];
    return [{ source: "/api/:path*", destination: `${backend}/api/:path*` }];
  },
};

export default nextConfig;
