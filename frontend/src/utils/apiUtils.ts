/**
 * Resilient fetch utility with exponential backoff retries.
 * Prevents transient "Failed to fetch" errors during server restarts or network blips.
 */
const inFlightRequests: Map<string, Promise<Response>> = new Map();

export async function safeFetch(
  url: string,
  options?: RequestInit,
  retries = 3,
  delay = 500,
): Promise<Response> {
  const method = (options && (options.method as string)) || "GET";
  const key = `${method}::${url}`;

  // Deduplicate concurrent identical requests
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key)!;
  }

  const promise = (async (): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(url, options);

        // If 429, do not retry to avoid request storms.
        if (res.status === 429) {
          return res;
        }

        if (res.status >= 500 && i < retries - 1) {
          await new Promise((r) => setTimeout(r, delay * Math.pow(2, i)));
          continue;
        }
        return res;
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise((r) => setTimeout(r, delay * Math.pow(2, i)));
      }
    }

    // final attempt
    return fetch(url, options);
  })();

  inFlightRequests.set(key, promise);
  try {
    const result = await promise;
    return result;
  } finally {
    inFlightRequests.delete(key);
  }
}
