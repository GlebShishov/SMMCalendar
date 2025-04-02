/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Отключаем строгий режим для Socket.IO
  images: {
    domains: ['localhost'],
  },
  // Настройка для Socket.IO
  webpack: (config, { isServer }) => {
    // Добавляем поддержку WebSockets
    if (!isServer) {
      config.externals = [...config.externals, 'bufferutil', 'utf-8-validate'];
    }
    return config;
  },
}

module.exports = nextConfig
