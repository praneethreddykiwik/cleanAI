import type { NextConfig } from "next";

// Next.js detects the project root from frontend/package-lock.json. Do NOT set
// `turbopack.root` here: Vercel sets `outputFileTracingRoot` to the deployment
// root, and the two must match or the build warns and ignores one of them.
const nextConfig: NextConfig = {};

export default nextConfig;
