import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    domains: [
      // Instagram CDN domains
      'scontent.cdninstagram.com',
      'scontent-iad3-1.cdninstagram.com',
      'scontent-iad3-2.cdninstagram.com',
      'scontent.xx.fbcdn.net',
      'instagram.ftxl3-1.fna.fbcdn.net',
      // Add the specific domain from profile pictures
      'scontent-bom2-3.cdninstagram.com',
      // Add other common Instagram CDN domains
      'graph.instagram.com',
      'graph.facebook.com',
      // Avatar and media domains
      'api.dicebear.com',
      'res.cloudinary.com'
    ],
    remotePatterns: [
      {
        // This pattern covers all Instagram CDN subdomains regardless of region prefix (like scontent-boml-1)
        protocol: 'https',
        hostname: '**.cdninstagram.com',
        pathname: '**',
      },
      {
        // This pattern covers all Facebook CDN subdomains used by Instagram
        protocol: 'https',
        hostname: '**.fbcdn.net',
        pathname: '**',
      }
    ],
  },
  // Add any environment variables you want to expose to the client
  env: {
    NEXT_PUBLIC_SOCKET_SERVER_URL: process.env.NEXT_PUBLIC_SOCKET_SERVER_URL,
  },
  // Optional: Add webpack configuration if needed
  webpack: (config, { isServer }) => {
    // Add any custom webpack configuration here
    return config;
  },
};

export default nextConfig;
