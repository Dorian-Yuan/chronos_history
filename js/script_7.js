(function() {
  'use strict';

  // Skip if already initialized
  if (window.gapp && window.gapp.state) return;

  // Initialize gapp namespace
  window.gapp = window.gapp || {};

  // Constants
  const API_BASE = '/api/apps/chronos/state';
  const DEVICE_ID_KEY = 'gapp_device_id';

  // State
  let deviceId = null;
  let currentUserId = null;
  let currentUserName = null;
  let currentUsername = null;
  let currentAvatarUrl = null;
  let isAuthenticated = false;

  // UUID v4 fallback for non-secure contexts
  function generateUUID() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    // Fallback using crypto.getRandomValues
    var bytes = new Uint8Array(16);
    (typeof crypto !== 'undefined' ? crypto : {getRandomValues: function(a){for(var i=0;i<a.length;i++)a[i]=Math.random()*256|0;return a}}).getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    var hex = Array.from(bytes, function(b){return b.toString(16).padStart(2,'0')}).join('');
    return hex.slice(0,8)+'-'+hex.slice(8,12)+'-'+hex.slice(12,16)+'-'+hex.slice(16,20)+'-'+hex.slice(20);
  }

  // Initialize device ID
  function getDeviceId() {
    if (deviceId) return deviceId;
    deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = generateUUID();
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  }

  // API helper
  async function apiCall(method, params = {}, pathSuffix = '') {
    const url = new URL(API_BASE + pathSuffix, window.location.origin);
    const isGet = method === 'GET';
    const isDelete = method === 'DELETE';

    if (isGet || isDelete) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    };

    if (!isGet && !isDelete) {
      options.body = JSON.stringify(params);
    }

    const response = await fetch(url.toString(), options);
    const data = await response.json();

    if (!data.success) {
      const error = new Error(data.error?.message || 'Unknown error');
      error.code = data.error?.code || 'UNKNOWN';
      throw error;
    }

    return data;
  }

  // Determine effective scope based on auth status
  function getEffectiveScope() {
    return isAuthenticated ? 'user' : 'session';
  }

  // Add device_id to params if needed
  function addDeviceId(params, scope) {
    if (scope === 'session') {
      params.device_id = getDeviceId();
    }
    return params;
  }

  // Create scope-specific API object
  function createScopeApi(scope) {
    return {
      async get(key) {
        const params = addDeviceId({ scope, key }, scope);
        try {
          const data = await apiCall('GET', params);
          return data.value;
        } catch (error) {
          if (error && error.code === 'NOT_FOUND') {
            return null;
          }
          throw error;
        }
      },

      async set(key, value) {
        const params = addDeviceId({ scope, key, value }, scope);
        await apiCall('POST', params);
      },

      async delete(key) {
        const params = addDeviceId({ scope, key }, scope);
        await apiCall('DELETE', params);
      },

      async list() {
        const params = addDeviceId({ scope }, scope);
        const data = await apiCall('GET', params, '/list');
        return data.keys.map(k => k.key);
      }
    };
  }

  // Main state API
  window.gapp.state = {
    // Auto-scope methods (user if authenticated, session otherwise)
    async get(key) {
      const scope = getEffectiveScope();
      return window.gapp.state[scope].get(key);
    },

    async set(key, value) {
      const scope = getEffectiveScope();
      return window.gapp.state[scope].set(key, value);
    },

    async delete(key) {
      const scope = getEffectiveScope();
      return window.gapp.state[scope].delete(key);
    },

    async list() {
      const scope = getEffectiveScope();
      return window.gapp.state[scope].list();
    },

    // Explicit scope APIs
    user: createScopeApi('user'),
    session: createScopeApi('session'),
    global: createScopeApi('global'),

    // Utility methods
    isAuthenticated() {
      return isAuthenticated;
    },

    getCurrentUserId() {
      return currentUserId;
    },

    async migrateSessionToUser() {
      if (!isAuthenticated) {
        throw new Error('Must be authenticated to migrate session data');
      }
      const data = await apiCall('POST', { device_id: getDeviceId() }, '/migrate');
      return {
        migratedCount: data.migrated_count,
        migratedKeys: data.migrated_keys
      };
    },

    // Internal: Update auth status (called by platform)
    _setAuthStatus(authenticated, userId = null) {
      isAuthenticated = authenticated;
      currentUserId = userId;
    }
  };

  // User API - provides user identity info
  window.gapp.user = {
    isAuthenticated() {
      return isAuthenticated;
    },

    getId() {
      return currentUserId;
    },

    getName() {
      return currentUserName;
    },

    getUsername() {
      return currentUsername;
    },

    getAvatarUrl() {
      return currentAvatarUrl;
    },

    getProfile() {
      if (!isAuthenticated) return null;
      return {
        id: currentUserId,
        name: currentUserName,
        username: currentUsername,
        avatarUrl: currentAvatarUrl
      };
    }
  };

  // Check authentication status and fetch user profile
  async function checkAuth() {
    try {
      const response = await fetch('/api/auth/session', { credentials: 'include' });
      const session = await response.json();
      if (session?.user?.id) {
        isAuthenticated = true;
        currentUserId = session.user.id;
        currentUserName = session.user.displayName || session.user.name || null;
        currentUsername = session.user.username || null;
        currentAvatarUrl = session.user.avatarUrl || session.user.image || null;
      }
    } catch (e) {
      // Ignore auth check errors
    }
  }

  // Initialize
  getDeviceId();
  checkAuth().then(() => {
    // Dispatch ready event with user info
    window.dispatchEvent(new CustomEvent('gapp:ready', {
      detail: {
        isAuthenticated,
        user: isAuthenticated ? {
          id: currentUserId,
          name: currentUserName,
          username: currentUsername,
          avatarUrl: currentAvatarUrl
        } : null
      }
    }));
    // Also dispatch legacy event for backwards compatibility
    window.dispatchEvent(new CustomEvent('gapp:state:ready', {
      detail: { isAuthenticated, currentUserId }
    }));
  });
})();
