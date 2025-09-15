/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost', '192.168.1.92'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://192.168.1.92:5001',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'https://192.168.1.92:5001'}/api/:path*`,
      },
    ]
  },
  // HTTPS configuration for development
  ...(process.env.NODE_ENV === 'development' && {
    devServer: {
      https: {
        key: '/home/myuser/Projects/signsphere/certificates/signsphere.key',
        cert: '/home/myuser/Projects/signsphere/certificates/signsphere.crt',
      },
    },
  }),
  // Ignore self-signed certificate errors in development
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Set process environment variables for SSL
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    }
    return config
  },
}

module.exports = nextConfig
