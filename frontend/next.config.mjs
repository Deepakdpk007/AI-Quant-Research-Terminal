/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Allow Next.js dev server to be reached from any host (Codespaces / Gitpod / Docker).
  // In production, requests are normally proxied so this isn't an issue.
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    return [{ source: '/api/proxy/:path*', destination: `${apiBase}/api/:path*` }];
  },
  experimental: {
    typedRoutes: false,
  },
};

export default nextConfig;
