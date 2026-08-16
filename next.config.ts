import type { NextConfig } from "next";

// Next.js detects the project root from package-lock.json. Do NOT set
// `turbopack.root` here: Vercel sets `outputFileTracingRoot` to the deployment
// root, and the two must match or the build warns and ignores one of them.
const nextConfig: NextConfig = {
  // Prisma loads a native query engine (.node) via runtime require. Bundling it
  // breaks that lookup, so it has to stay an external CommonJS dependency.
  serverExternalPackages: ["@prisma/client", "prisma"],

  // File tracing follows `import`/`require`, so it never sees the engine binary
  // that Prisma resolves by filename at runtime. Without this the function
  // deploys without an engine and every query throws
  // "could not locate the Query Engine for runtime rhel-openssl-3.0.x",
  // which surfaces as an empty HTTP 500. Keys are route globs, so the
  // brackets in /api/[...slug] must be escaped.
  outputFileTracingIncludes: {
    "/api/\\[\\.\\.\\.slug\\]": [
      "./node_modules/.prisma/client/**/*",
      "./node_modules/@prisma/client/**/*",
    ],
    "/*": ["./node_modules/.prisma/client/**/*"],
  },
};

export default nextConfig;
