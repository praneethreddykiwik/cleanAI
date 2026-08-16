import rateLimit from 'express-rate-limit';

/**
 * Uptime probes must never be rate limited: a monitor polling /api/health would
 * otherwise consume the same budget as real traffic and eventually be told the
 * service is down when it is healthy.
 */
const isProbe = (path: string) =>
  path === '/health' || path === '/ready' || path === '/v1/version';

/**
 * General API traffic.
 *
 * The previous limit was 100 requests per 15 minutes per IP. One dashboard load
 * costs roughly six calls (profile, services, bookings, notifications,
 * addresses, wallet), so a normal user was locked out after ~16 page views and
 * then blocked for a quarter of an hour. This raises the ceiling to something a
 * real session can live within, while brute-force protection moves to the
 * dedicated auth limiter below — where it actually belongs.
 */
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 1000 : 10000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isProbe(req.path),
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});

/**
 * Credential endpoints get a much tighter budget, since these are the ones worth
 * attacking. Successful requests are not counted, so a legitimate user logging
 * in repeatedly is unaffected while password guessing is throttled quickly.
 *
 * Each endpoint gets its OWN limiter instance. Sharing one would mean failed
 * login attempts consume the registration budget, so anyone hammering a
 * password could block new signups from the same address as a side effect.
 */
export const makeAuthRateLimiter = () =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 30 : 10000,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: {
      success: false,
      message: 'Too many authentication attempts. Please try again in 15 minutes.',
    },
  });
