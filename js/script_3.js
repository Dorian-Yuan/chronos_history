
(function() {
  // Store original fetch
  const originalFetch = window.fetch;

  // AI API endpoints to intercept
  const GEMINI_HOST = 'generativelanguage.googleapis.com';
  const OPENAI_HOST = 'api.openai.com';

  // Proxy endpoints
  const PROXY_BASE = window.location.origin;

  // Helper to safely parse body from various formats
  async function parseBody(init) {
    if (!init?.body) return {};

    const body = init.body;

    // Already an object
    if (typeof body === 'object' && !(body instanceof Blob) && !(body instanceof ArrayBuffer) && !(body instanceof ReadableStream)) {
      return body;
    }

    // String - parse as JSON
    if (typeof body === 'string') {
      try {
        return JSON.parse(body);
      } catch {
        console.warn('[gapp.so] Failed to parse body as JSON');
        return {};
      }
    }

    // Blob - read as text then parse
    if (body instanceof Blob) {
      try {
        const text = await body.text();
        return JSON.parse(text);
      } catch {
        console.warn('[gapp.so] Failed to parse Blob body');
        return {};
      }
    }

    // ArrayBuffer - decode and parse
    if (body instanceof ArrayBuffer) {
      try {
        const text = new TextDecoder().decode(body);
        return JSON.parse(text);
      } catch {
        console.warn('[gapp.so] Failed to parse ArrayBuffer body');
        return {};
      }
    }

    return {};
  }

  window.fetch = async function(input, init) {
    let url;
    let requestInit = init;

    // Handle Request objects
    if (input instanceof Request) {
      url = new URL(input.url);
      // Clone the request to read its body
      if (!init) {
        requestInit = {
          method: input.method,
          headers: input.headers,
          body: input.body,
        };
      }
    } else {
      try {
        url = new URL(input);
      } catch {
        // Relative URL, use original fetch
        return originalFetch.apply(this, arguments);
      }
    }

    // Intercept Gemini API calls
    if (url.hostname === GEMINI_HOST) {
      const path = url.pathname;
      const body = await parseBody(requestInit);

      console.log('[gapp.so] Proxying Gemini request:', path);

      return originalFetch(PROXY_BASE + '/api/ai/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, ...body }),
      });
    }

    // Intercept OpenAI API calls (future support)
    if (url.hostname === OPENAI_HOST) {
      console.log('[gapp.so] OpenAI proxy not yet implemented');
    }

    // Pass through other requests
    return originalFetch.apply(this, arguments);
  };

  console.log('[gapp.so] AI API proxy interceptor loaded');
})();

