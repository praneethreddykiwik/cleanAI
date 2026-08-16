/**
 * Reads a JSON body without letting a non-JSON response surface as
 * "Failed to execute 'json' on 'Response': Unexpected end of JSON input".
 *
 * A crashed server function replies with an empty body, and a proxy or
 * platform error page replies with HTML. Calling `res.json()` directly on
 * either throws a parser error that says nothing about what actually went
 * wrong, which is exactly when a useful message matters most.
 */
export async function readJson<T = unknown>(res: Response): Promise<T> {
  const text = await res.text();

  if (!text.trim()) {
    throw new Error(
      res.ok
        ? 'The server returned an empty response.'
        : `The server returned an empty response (HTTP ${res.status}). It may be misconfigured or still starting up.`
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    // Most often an HTML error page from the hosting platform.
    throw new Error(
      `The server returned an unexpected response (HTTP ${res.status}). Expected JSON.`
    );
  }
}
