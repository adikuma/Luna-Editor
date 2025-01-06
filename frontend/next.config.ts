/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['api.getimg.ai'], // Add this if you're displaying images from getimg.ai
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // We don't need experimental.appDir anymore in Next.js 13.4+ 
  // as the App Router is now stable
};

export default nextConfig;