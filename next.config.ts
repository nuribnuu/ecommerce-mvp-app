/** @type {import('next').NextConfig} */
const nextConfig = {
  // config lain yang sudah ada
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fakestoreapi.com",
      },
    ],
  },
};

module.exports = nextConfig;
