/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ['*.vusercontent.net', 'localhost', '127.0.0.1'],
  turbopack: {
    root: process.cwd(),
  },
}

export default nextConfig
