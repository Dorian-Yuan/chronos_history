
(function() {
  if (window.__gappQverisInjected) return;
  window.__gappQverisInjected = true;

  window.gapp = window.gapp || {};

  // Internal: execute a curated tool
  async function _call(tool, params) {
    try {
      console.log('[gapp.so] ' + tool + ':', JSON.stringify(params));
      var res = await fetch('/api/qveris/tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: tool, params: params || {} })
      });
      if (!res.ok) {
        var errorText = await res.text();
        throw new Error(errorText || 'Tool call failed');
      }
      var result = await res.json();
      if (!result.success && result.error) {
        throw new Error(result.error);
      }
      return result;
    } catch (err) {
      console.error('[gapp.so] ' + tool + ' error:', err);
      throw err;
    }
  }

  // Store last searchId for advanced execute calls
  var lastSearchId = null;

  window.gapp.tools = {
    // ============================================
    // SIMPLE API - Curated tools with easy syntax
    // ============================================

    /** Weather tools */
    weather: {
      /** Get current weather: gapp.tools.weather.current({city: "Tokyo"}) */
      current: function(params) { return _call('weather.current', params); },
      /** Get forecast: gapp.tools.weather.forecast({city: "Tokyo"}) */
      forecast: function(params) { return _call('weather.forecast', params); },
      /** Get alerts (US): gapp.tools.weather.alerts({point: "38.9,-76.9"}) */
      alerts: function(params) { return _call('weather.alerts', params); }
    },

    /** Stock market tools */
    stocks: {
      /** Get stock quote: gapp.tools.stocks.quote({symbol: "AAPL.US"}) */
      quote: function(params) { return _call('stocks.quote', params); }
    },

    /** Cryptocurrency tools */
    crypto: {
      /** Get BTC exchange rates: gapp.tools.crypto.rates() */
      rates: function(params) { return _call('crypto.rates', params); }
    },

    /** News tools */
    news: {
      /** Search news: gapp.tools.news.search({query: "AI"}) */
      search: function(params) { return _call('news.search', params); }
    },

    /** Search tools */
    search: {
      /** Web search: gapp.tools.search.web({query: "..."}) */
      web: function(params) { return _call('search.web', params); },
      /** Academic search: gapp.tools.search.academic({query: "..."}) */
      academic: function(params) { return _call('search.academic', params); }
    },

    /** NASA tools */
    nasa: {
      /** Astronomy Picture of the Day: gapp.tools.nasa.apod() */
      apod: function(params) { return _call('nasa.apod', params); }
    },

    /** Earthquake data */
    earthquake: {
      /** Recent earthquakes: gapp.tools.earthquake.recent({minMagnitude: 5}) */
      recent: function(params) { return _call('earthquake.recent', params); }
    },

    // ============================================
    // ADVANCED API - Full Qveris access
    // ============================================

    /** List available curated tools */
    async list() {
      var res = await fetch('/api/qveris/tool');
      return res.json();
    },

    /** Advanced: Search all Qveris tools */
    async _search(query) {
      try {
        var res = await fetch('/api/qveris/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: query || '' })
        });
        if (!res.ok) throw new Error(await res.text());
        var data = await res.json();
        lastSearchId = data.searchId;
        return { tools: data.tools || [], searchId: data.searchId };
      } catch (err) {
        console.error('[gapp.so] Search error:', err);
        throw err;
      }
    },

    /** Advanced: Execute any Qveris tool */
    async _execute(toolId, params, searchId) {
      var sid = searchId || lastSearchId;
      if (!sid) throw new Error('Call _search() first or provide searchId');
      try {
        var res = await fetch('/api/qveris/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toolId: toolId, searchId: sid, params: params || {} })
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      } catch (err) {
        console.error('[gapp.so] Execute error:', err);
        throw err;
      }
    }
  };

  console.log('[gapp.so] Tools SDK loaded - gapp.tools.weather, stocks, crypto, news, search, nasa, earthquake');
})();

