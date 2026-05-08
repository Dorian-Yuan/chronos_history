
(function() {
  if (window.__gappAiProxyInjected) return;
  window.__gappAiProxyInjected = true;

  // URL prefix → proxy routing rules (Gemini only — OpenAI/GLM handled by
  // injectIframeAuth's rewriter which routes them through /api/ai/openai/v1)
  var rules = [
    {
      // Gemini REST: https://generativelanguage.googleapis.com/v1beta/models/...
      re: /^https?:\/\/generativelanguage\.googleapis\.com(\/v1[a-z]*)?(\/.+)$/i,
      proxy: '/api/ai/gemini',
      pathFrom: function(m) { return (m[1] || '/v1beta') + m[2]; },
    },
  ];

  function matchRule(url) {
    for (var i = 0; i < rules.length; i++) {
      var m = String(url).match(rules[i].re);
      if (m) return { rule: rules[i], match: m };
    }
    return null;
  }

  var origFetch = window.fetch.bind(window);
  window.fetch = function(input, init) {
    try {
      // Resolve the URL string from input (may be Request, URL, or string)
      var url = typeof input === 'string' ? input
              : (input && input.url) ? input.url
              : (input && input.href) ? input.href
              : null;
      if (!url) return origFetch(input, init);

      var hit = matchRule(url);
      if (!hit) return origFetch(input, init);

      var path = hit.rule.pathFrom(hit.match);

      // Strip Google "?key=..." query param from the wrapped path so we don't
      // leak it through and don't confuse our proxy. We supply our own key.
      var qs = path.indexOf('?');
      if (qs >= 0) {
        var beforeQ = path.slice(0, qs);
        var query = path.slice(qs + 1);
        var keptParams = query.split('&').filter(function(p) {
          return p && p.indexOf('key=') !== 0;
        });
        path = keptParams.length ? beforeQ + '?' + keptParams.join('&') : beforeQ;
      }

      // Read the original body (only if POST and present)
      var newInit = init || {};
      var method = (newInit.method || (input && input.method) || 'GET').toUpperCase();
      var bodyPromise;
      if (method === 'POST' && newInit.body != null) {
        if (typeof newInit.body === 'string') {
          bodyPromise = Promise.resolve(newInit.body);
        } else if (newInit.body instanceof Blob) {
          bodyPromise = newInit.body.text();
        } else if (newInit.body instanceof FormData || newInit.body instanceof URLSearchParams) {
          // Non-JSON bodies — fall through, don't intercept
          return origFetch(input, init);
        } else if (newInit.body instanceof ArrayBuffer || ArrayBuffer.isView(newInit.body)) {
          bodyPromise = Promise.resolve(new TextDecoder().decode(newInit.body));
        } else {
          bodyPromise = Promise.resolve(JSON.stringify(newInit.body));
        }
      } else if (method === 'POST' && input && typeof input.text === 'function') {
        bodyPromise = input.text();
      } else {
        // GET or no body — proxy doesn't currently support GET; fall through
        return origFetch(input, init);
      }

      return bodyPromise.then(function(rawBody) {
        var parsed;
        try {
          parsed = rawBody ? JSON.parse(rawBody) : {};
        } catch (e) {
          // Body wasn't JSON — fall through, don't intercept
          return origFetch(input, init);
        }
        var wrappedBody = JSON.stringify(Object.assign({ path: path }, parsed));
        var proxyHeaders = Object.assign({}, newInit.headers || {});
        // Strip Authorization headers — proxy uses platform key
        delete proxyHeaders['Authorization'];
        delete proxyHeaders['authorization'];
        delete proxyHeaders['x-goog-api-key'];
        delete proxyHeaders['X-Goog-Api-Key'];
        proxyHeaders['Content-Type'] = 'application/json';
        proxyHeaders['X-Gapp-App-Slug'] = 'chronos';
        return origFetch(hit.rule.proxy, {
          method: 'POST',
          headers: proxyHeaders,
          body: wrappedBody,
          credentials: 'same-origin',
        });
      });
    } catch (err) {
      // Any unexpected interceptor error → fall through to original fetch so
      // we never silently break user apps.
      console.warn('[gapp ai-proxy] interceptor error, falling through:', err);
      return origFetch(input, init);
    }
  };
})();

