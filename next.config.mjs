/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // ESLint runs explicitly in `npm run check`; avoid Next 15's deprecated
  // build-time lint worker duplicating that validation.
  eslint: { ignoreDuringBuilds: true },
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
