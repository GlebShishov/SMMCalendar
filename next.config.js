/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/projects/**',
      },
    ],
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },
  // Добавляем обработку статических файлов из директории projects
  async rewrites() {
    return [
      {
        source: '/projects/:projectId/images/:path*',
        destination: '/api/static/:projectId/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
