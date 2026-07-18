/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  async redirects() {
    return [
      {
        source: "/docs",
        destination: "/docs/index.html",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
