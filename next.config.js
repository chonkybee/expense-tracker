/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Required for better-sqlite3 (native module) on Vercel
  serverExternalPackages: ["better-sqlite3"],
};

module.exports = nextConfig;
