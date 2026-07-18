/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  env: {
    NEXT_PUBLIC_PERSISTENCE_MODE:
      process.env.NEXT_PUBLIC_PERSISTENCE_MODE ??
      (process.env.VERCEL ? "file" : "database"),
  },
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
