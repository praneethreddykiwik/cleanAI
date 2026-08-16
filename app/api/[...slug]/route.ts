// The Express stack needs Node APIs (streams, crypto, Prisma), so this cannot
// run on the Edge runtime. `force-dynamic` keeps Next from trying to cache or
// statically evaluate API responses at build time.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The server modules are imported dynamically, INSIDE the handler, on purpose.
 *
 * Next evaluates every route module during the "Collecting page data" build
 * step. A static import would pull in the whole Express app at that moment —
 * connecting Redis, constructing BullMQ queues, and validating environment
 * variables that only exist at runtime — and any failure there fails the build.
 * Deferring the import means nothing server-side runs until a real request
 * arrives, so the build only ever type-checks this code.
 */
async function handler(request: Request): Promise<Response> {
  const [{ getApp }, { handleWithExpress }] = await Promise.all([
    import('@/server'),
    import('@/server/http-bridge'),
  ]);
  return handleWithExpress(getApp(), request);
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
  handler as HEAD,
  handler as OPTIONS,
};
