
(function() {
  if (window.__gappByokInjected) return;
  window.__gappByokInjected = true;

  var originalFetch = window.fetch;
  window.fetch = function(input, init) {
    return originalFetch.apply(this, arguments).then(function(response) {
      // Credit consumption notification for successful AI responses
      if (response.status >= 200 && response.status < 400) {
        var creditsUsed = response.headers.get('X-Credits-Used');
        var creditsRemaining = response.headers.get('X-Credits-Remaining');
        if (creditsUsed) {
          window.parent.postMessage({
            type: 'gapp:creditUsage',
            creditsUsed: parseInt(creditsUsed, 10),
            creditsRemaining: creditsRemaining ? parseInt(creditsRemaining, 10) : null,
          }, '*');
        }
      }

      // Rate limit notification
      if (response.status === 429 || response.status === 503) {
        var cloned = response.clone();
        cloned.json().then(function(data) {
          var err = data && data.error;
          if (!err) return;
          if (err.subscribe_cta) {
            window.parent.postMessage({
              type: 'gapp:rateLimit',
              ctaType: 'subscribe',
              cta: err.subscribe_cta,
              secondaryCta: err.byok_cta,
              shareCta: err.share_cta,
              monthlyLimitReached: err.monthly_limit_reached || false,
            }, '*');
          } else if (err.byok_cta) {
            window.parent.postMessage({
              type: 'gapp:rateLimit',
              ctaType: 'byok',
              cta: err.byok_cta,
            }, '*');
          } else if (err.upgrade_cta) {
            window.parent.postMessage({
              type: 'gapp:rateLimit',
              ctaType: 'upgrade',
              cta: err.upgrade_cta,
            }, '*');
          }
        }).catch(function() {});
      }
      return response;
    });
  };
})();

