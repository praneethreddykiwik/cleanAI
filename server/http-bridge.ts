import { IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';
import type { Application } from 'express';

/**
 * Runs an Express application inside a Next.js Route Handler.
 *
 * Next hands us a Web `Request` and wants a Web `Response`, while Express
 * expects Node's `IncomingMessage`/`ServerResponse`. This builds a detached
 * pair of those, feeds the request through the Express stack, captures what
 * the app writes, and converts it back.
 *
 * Express only ever sees the ORIGINAL path (e.g. `/api/v1/bookings`), so every
 * existing route keeps matching exactly as it did on the standalone server.
 */
export function handleWithExpress(app: Application, request: Request): Promise<Response> {
  return new Promise(async (resolve, reject) => {
    try {
      const url = new URL(request.url);
      const hasBody = !['GET', 'HEAD'].includes(request.method.toUpperCase());
      const body = hasBody ? Buffer.from(await request.arrayBuffer()) : null;

      // A socket is required for IncomingMessage; it is never connected. The
      // address matters because express-rate-limit and morgan read `req.ip`.
      //
      // X-Forwarded-For is only meaningful behind a proxy we trust. Vercel
      // appends the client address it actually observed, so the RIGHT-most entry
      // is authoritative there; anything the caller sent themselves sits to the
      // left of it. Off-platform there is no such guarantee, so the header is
      // ignored entirely rather than believed.
      //
      // Getting this wrong is a rate-limit bypass: reading the left-most value
      // (or trusting the header with no proxy present) lets a caller mint a new
      // identity per request and never exhaust their quota.
      const socket = new Socket();
      const behindTrustedProxy = Boolean(process.env.VERCEL);
      const forwarded = behindTrustedProxy
        ? (request.headers.get('x-forwarded-for')?.split(',') ?? [])
        : [];
      const clientIp = forwarded.length ? forwarded[forwarded.length - 1].trim() : '';
      Object.defineProperty(socket, 'remoteAddress', {
        value: clientIp || '127.0.0.1',
        writable: false,
        configurable: true,
      });

      const req = new IncomingMessage(socket);
      req.method = request.method;
      req.url = url.pathname + url.search;
      req.headers = {};
      request.headers.forEach((value, key) => {
        req.headers[key.toLowerCase()] = value;
      });
      if (body) {
        // Trust our own byte count over any inherited header.
        req.headers['content-length'] = String(body.byteLength);
      }

      // Express body parsers read this as a stream.
      if (body?.length) req.push(body);
      req.push(null);

      const res = new ServerResponse(req);
      const chunks: Buffer[] = [];
      let settled = false;

      const toBuffer = (chunk: unknown, encoding?: unknown): Buffer | null => {
        if (chunk === null || chunk === undefined || typeof chunk === 'function') return null;
        if (Buffer.isBuffer(chunk)) return chunk;
        if (chunk instanceof Uint8Array) return Buffer.from(chunk);
        return Buffer.from(
          String(chunk),
          (typeof encoding === 'string' ? encoding : 'utf8') as BufferEncoding
        );
      };

      const finish = () => {
        if (settled) return;
        settled = true;

        const headers = new Headers();
        for (const [key, value] of Object.entries(res.getHeaders())) {
          if (value === undefined) continue;
          if (Array.isArray(value)) {
            // Set-Cookie and friends must stay as separate header lines.
            value.forEach((entry) => headers.append(key, String(entry)));
          } else {
            headers.set(key, String(value));
          }
        }

        // These statuses must not carry a body, per fetch spec.
        const bodyless = res.statusCode === 204 || res.statusCode === 205 || res.statusCode === 304;
        const payload = bodyless || chunks.length === 0 ? null : Buffer.concat(chunks);

        resolve(
          new Response(payload as BodyInit | null, {
            status: res.statusCode,
            statusText: res.statusMessage || '',
            headers,
          })
        );
      };

      res.write = ((chunk: unknown, encoding?: unknown, callback?: unknown) => {
        const buf = toBuffer(chunk, encoding);
        if (buf) chunks.push(buf);
        const cb = typeof encoding === 'function' ? encoding : callback;
        if (typeof cb === 'function') (cb as () => void)();
        return true;
      }) as ServerResponse['write'];

      res.end = ((chunk?: unknown, encoding?: unknown, callback?: unknown) => {
        const buf = toBuffer(chunk, encoding);
        if (buf) chunks.push(buf);
        const cb = typeof chunk === 'function' ? chunk : typeof encoding === 'function' ? encoding : callback;
        if (typeof cb === 'function') (cb as () => void)();
        finish();
        return res;
      }) as ServerResponse['end'];

      res.on('error', reject);

      // Express's error handler already covers thrown route errors; this is the
      // last resort for a failure inside the middleware chain itself.
      app(req as never, res as never, (err?: unknown) => {
        if (err) reject(err);
        else finish();
      });
    } catch (error) {
      reject(error);
    }
  });
}
