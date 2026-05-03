'use client';
import { useEffect } from 'react';

const BASE_PATH = '/ws/02-family';

export default function FetchBasePathPatch() {
  useEffect(() => {
    const originalFetch = window.fetch;
    if (!(originalFetch as any).__patched) {
      window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
        let url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
        // Patch: prepend basePath for /api/ calls
        if (url.startsWith('/api/')) {
          url = BASE_PATH + url;
          if (typeof input === 'string') {
            input = url;
          } else if (input instanceof URL) {
            input = new URL(url);
          } else {
            // Request object — reconstruct
            input = new Request(url, init);
            init = undefined; // init is already in the new Request
          }
        }
        return originalFetch.call(this, input, init);
      };
      (window.fetch as any).__patched = true;
    }
  }, []);
  return null;
}
