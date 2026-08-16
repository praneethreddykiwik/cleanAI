import { getApp } from '@/server';
import { handleWithExpress } from '@/server/http-bridge';

// The Express stack needs Node APIs (streams, crypto, Prisma), so this cannot
// run on the Edge runtime. `force-dynamic` keeps Next from trying to cache or
// statically evaluate API responses at build time.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function handler(request: Request): Promise<Response> {
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
