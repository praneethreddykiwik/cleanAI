// The API is mounted inside this same Next.js app at /api/v1, so the default is
// always same-origin — including on localhost. It used to fall back to
// http://localhost:4000, which was the old standalone Express server; after the
// apps were merged nothing listens there, so every authenticated page failed its
// /auth/me call, cleared the stored session, and bounced back to /auth/login.
const getApiUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return '/api/v1';
};

const getAppUrl = (): string => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:3000';
};

// Same reasoning as the API URL: default to this origin rather than the retired
// port 4000. (Socket.IO itself does not run on serverless — see the transfer doc.)
const getSocketUrl = (): string => {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
};

export const APP_CONFIG = {
  get appUrl() { return getAppUrl(); },
  get apiUrl() { return getApiUrl(); },
  get socketUrl() { return getSocketUrl(); },
};

export default APP_CONFIG;
