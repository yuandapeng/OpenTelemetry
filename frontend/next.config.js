/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/service-a/:path*',
        destination: 'http://localhost:3001/:path*',
      },
      {
        source: '/api/service-b/:path*',
        destination: 'http://localhost:3002/:path*',
      },
    ];
  },
};

module.exports = nextConfig;

