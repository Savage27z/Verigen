/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Allow data: URIs for generated images
  webpack: (config) => {
    // Fallback for node modules not available in edge runtime
    config.resolve.fallback = {
      ...config.resolve.fallback,
      crypto: false,
    };
    return config;
  },
};

export default nextConfig;
