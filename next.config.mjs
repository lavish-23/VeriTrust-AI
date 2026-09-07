/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: '/Users/ketkeebhosale/Documents/VeriTrust-AI',
  },
}

export default nextConfig
