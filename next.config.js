/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Serverless-friendly configuration
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs', 'jsonwebtoken'],
  },
}

module.exports = nextConfig

