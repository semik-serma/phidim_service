const BACKEND_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "https://service.phidimservice.com.np";


const nextConfig = {
  reactStrictMode: true,
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return {
      afterFiles: [{
        source: "/api/realtime/:path*",
        destination: `${process.env.SOCKET_BACKEND_URL || process.env.NEXT_PUBLIC_SOCKET_URL || BACKEND_URL}/socket.io/:path*`,
      }],
      // Catch-all API route handlers must run before the legacy upstream rewrite.
      fallback: [{
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      }],
    };
  },
};

export default nextConfig;
