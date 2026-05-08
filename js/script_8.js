(function() {
  'use strict';

  // Skip if already initialized
  if (window.__gappLsSyncInit) return;
  window.__gappLsSyncInit = true;

  // ===== Constants =====
  var SLUG = 'chronos';
  var HOT_PREFIX = '__gapp:' + SLUG + ':';  // v2 hot cache prefix (read-only, for migration)
  var META_KEY = 'gapp_ls_meta_' + SLUG;
  var DEVICE_ID_KEY = 'gapp_device_id';
  var SYNC_API = '/api/apps/' + SLUG + '/state/sync';
  var PRESIGN_API = '/api/apps/' + SLUG + '/state/presign';
  var SYNC_DEBOUNCE_MS = 500;
  var VMAP_SOFT_LIMIT = 50 * 1024 * 1024;
  var MAX_BEACON_VALUE = 64 * 1024;           // sendBeacon payload limit
  var LARGE_VALUE_THRESHOLD = 256 * 1024;     // values >256KB use presigned URL upload
  var BATCH_SIZE = 50;
  var MAX_RETRY_DELAY = 60000;

  // Key exclusion patterns — only affects cloud sync, NOT vMap/IndexedDB
  var EXCLUDE_PATTERNS = [
    /^gapp_/,
    /^_/,
    /cache/i,
    /token/i,
    /secret/i,
    /password/i,
    /^debug/i,
    /^__/
  ];

  // ===== Save native references BEFORE any override =====
  var nativeSetItem = Storage.prototype.setItem;
  var nativeGetItem = Storage.prototype.getItem;
  var nativeRemoveItem = Storage.prototype.removeItem;
  var nativeClear = Storage.prototype.clear;
  var nativeKeyFn = Storage.prototype.key;
  var nativeLengthDesc = Object.getOwnPropertyDescriptor(Storage.prototype, 'length');

  function originalSetItem(k, v) { nativeSetItem.call(localStorage, k, v); }
  function originalGetItem(k) { return nativeGetItem.call(localStorage, k); }
  function originalRemoveItem(k) { nativeRemoveItem.call(localStorage, k); }
  function nativeLength() { return nativeLengthDesc.get.call(localStorage); }
  function nativeKeyAt(i) { return nativeKeyFn.call(localStorage, i); }

  // ===== State =====
  var vMap = new Map();
  var vMapBytes = 0;
  var keysCache = null;
  var metadata = {};
  var dirtyKeys = new Set();
  var deletedKeys = new Set();
  var syncTimeout = null;
  var isSyncing = false;
  var isOnline = navigator.onLine;
  var retryDelay = 5000;
  var initialLoadComplete = false;

  function invalidateKeysCache() { keysCache = null; }

  // ===== IndexedDB Layer =====
  var DB_NAME = 'gapp_ls_' + SLUG;
  var DB_VERSION = 1;
  var STORE_NAME = 'kv';
  var IDB_GEN_KEY = '\x00__gapp_internal_gen';   // NUL-prefixed to avoid user key collision
  var idb = null;

  // Generation counter — prevents data resurrection after clear()
  var GEN_KEY = '__gapp_idb_gen_' + SLUG;
  var currentGen = parseInt(originalGetItem(GEN_KEY) || '0', 10);

  function openDB() {
    return new Promise(function(resolve) {
      try {
        var req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = function() {
          var db = req.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };
        req.onsuccess = function() { idb = req.result; resolve(idb); };
        req.onerror = function() { resolve(null); };
      } catch (e) { resolve(null); }
    });
  }

  function idbPut(key, value) {
    if (!idb) return;
    try {
      idb.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(value, key);
    } catch (e) {}
  }

  function idbWriteGen() {
    if (!idb) return;
    try {
      idb.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(currentGen, IDB_GEN_KEY);
    } catch (e) {}
  }

  function idbDelete(key) {
    if (!idb) return;
    try { idb.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(key); } catch (e) {}
  }

  function idbClear() {
    if (!idb) return;
    try { idb.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).clear(); } catch (e) {}
  }

  function idbGetAll() {
    if (!idb) return Promise.resolve({});
    return new Promise(function(resolve) {
      try {
        var tx = idb.transaction(STORE_NAME, 'readonly');
        var store = tx.objectStore(STORE_NAME);
        var keys = store.getAllKeys();
        var values = store.getAll();
        tx.oncomplete = function() {
          var result = {};
          for (var i = 0; i < keys.result.length; i++) {
            result[keys.result[i]] = values.result[i];
          }
          resolve(result);
        };
        tx.onerror = function() { resolve({}); };
      } catch (e) { resolve({}); }
    });
  }

  // UUID v4 fallback
  function generateUUID() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    var bytes = new Uint8Array(16);
    (typeof crypto !== 'undefined' ? crypto : { getRandomValues: function(a) { for (var i = 0; i < a.length; i++) a[i] = Math.random() * 256 | 0; return a; } }).getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    var hex = Array.from(bytes, function(b) { return b.toString(16).padStart(2, '0'); }).join('');
    return hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' + hex.slice(12, 16) + '-' + hex.slice(16, 20) + '-' + hex.slice(20);
  }

  // Get device ID from real localStorage (platform key, never in vMap)
  function getDeviceId() {
    var deviceId = originalGetItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = generateUUID();
      try {
        originalSetItem(DEVICE_ID_KEY, deviceId);
      } catch (e) {
        // Quota full — use in-memory only
      }
    }
    return deviceId;
  }

  // Only controls cloud sync, NOT vMap/IndexedDB
  function shouldSync(key) {
    if (!key || typeof key !== 'string') return false;
    return !EXCLUDE_PATTERNS.some(function(p) { return p.test(key); });
  }

  // ===== Metadata (platform key, uses originalXxx) =====
  function loadMetadata() {
    try {
      var stored = originalGetItem(META_KEY);
      if (stored) metadata = JSON.parse(stored);
    } catch (e) {
      metadata = {};
    }
  }

  function saveMetadata() {
    try {
      originalSetItem(META_KEY, JSON.stringify(metadata));
    } catch (e) {
      // Quota full — metadata lost on refresh, but vMap/cloud still work
    }
  }

  // ===== Phase 1: Migrate v2 hot cache + legacy keys into vMap (BEFORE override) =====
  function fmtSize(bytes) { return bytes < 1024 ? bytes + 'B' : (bytes / 1024 / 1024).toFixed(2) + 'MB'; }
  console.log('[gapp:ls] init, gen=' + currentGen);
  loadMetadata();

  // Track keys for deferred cleanup (after IDB write succeeds)
  var v2HotCacheKeys = [];
  var legacyKeysToRemove = [];

  // Migrate v2 hot cache (__gapp:{slug}:* → vMap)
  // Don't delete yet — wait until data is safely in IndexedDB
  (function migrateV2HotCache() {
    var len = nativeLength();
    for (var i = 0; i < len; i++) {
      var k = nativeKeyAt(i);
      if (k && k.startsWith(HOT_PREFIX)) {
        var originalKey = k.slice(HOT_PREFIX.length);
        var v = originalGetItem(k);
        if (v !== null) {
          vMap.set(originalKey, v);
          vMapBytes += v.length;
          v2HotCacheKeys.push(k);
        }
      }
    }
    if (v2HotCacheKeys.length > 0) console.log('[gapp:ls] v2 hot cache: ' + v2HotCacheKeys.length + ' keys migrated');
  })();

  // Migrate legacy keys (no __gapp: prefix, no gapp_ prefix → vMap)
  (function migrateLegacyKeys() {
    var keysToMigrate = [];
    var len = nativeLength();
    for (var i = 0; i < len; i++) {
      var k = nativeKeyAt(i);
      // Migrate ALL non-platform keys, NOT filtered by shouldSync
      // Skip __gapp_ prefix (includes GEN_KEY) to avoid breaking generation counter
      if (k && !k.startsWith('__gapp:') && !k.startsWith('__gapp_') && !k.startsWith('gapp_')) {
        keysToMigrate.push(k);
      }
    }
    for (var j = 0; j < keysToMigrate.length; j++) {
      var key = keysToMigrate[j];
      var v = originalGetItem(key);
      if (v !== null) {
        vMap.set(key, v);
        vMapBytes += v.length;
        // Defer removal until data is safely in IndexedDB (same pattern as v2 hot cache)
        legacyKeysToRemove.push(key);
        // Do NOT mark dirty or set timestamp here!
        // Cloud merge must run first — cloud may have newer data.
        // After cloud merge, loadFromCloud will detect local-only keys and push them.
      }
    }
    if (legacyKeysToRemove.length > 0) console.log('[gapp:ls] legacy keys: ' + legacyKeysToRemove.length + ' keys migrated');
  })();

  console.log('[gapp:ls] Phase 1 done: vMap=' + vMap.size + ' keys, ' + fmtSize(vMapBytes));

  // ===== Phase 2: Override Storage.prototype =====

  Storage.prototype.setItem = function(key, value) {
    // sessionStorage guard
    if (this !== localStorage) {
      nativeSetItem.call(this, key, value);
      return;
    }

    var strValue = String(value);
    var oldValue = vMap.get(key);
    var oldLen = oldValue !== undefined ? oldValue.length : 0;
    var delta = strValue.length - oldLen;

    // Soft limit: reject new keys if vMap too large
    if (vMapBytes + delta > VMAP_SOFT_LIMIT && oldValue === undefined) {
      return;
    }

    vMap.set(key, strValue);
    vMapBytes += delta;
    invalidateKeysCache();

    // Write to IndexedDB (fire-and-forget)
    idbPut(key, strValue);

    // Notify parent page for save status feedback
    try {
      if (window.parent !== window) {
        window.parent.postMessage({ type: 'gapp:saving', key: key, size: strValue.length }, '*');
      }
    } catch (e) {}

    // Cloud sync (shouldSync only affects cloud)
    if (shouldSync(key)) {
      metadata[key] = Date.now();
      saveMetadata();
      dirtyKeys.add(key);
      deletedKeys.delete(key);
      scheduleSyncToCloud();
    }
  };

  Storage.prototype.getItem = function(key) {
    if (this !== localStorage) return nativeGetItem.call(this, key);
    return vMap.has(key) ? vMap.get(key) : null;
  };

  Storage.prototype.removeItem = function(key) {
    if (this !== localStorage) {
      nativeRemoveItem.call(this, key);
      return;
    }

    var oldValue = vMap.get(key);
    if (oldValue !== undefined) {
      console.warn('[gapp:ls] removeItem(' + key + ') size=' + fmtSize(oldValue.length));
      vMapBytes = Math.max(0, vMapBytes - oldValue.length);
    }
    vMap.delete(key);
    invalidateKeysCache();
    idbDelete(key);

    if (shouldSync(key) && metadata[key]) {
      delete metadata[key];
      saveMetadata();
      deletedKeys.add(key);
      dirtyKeys.delete(key);
      scheduleSyncToCloud();
    }
  };

  Storage.prototype.clear = function() {
    if (this !== localStorage) {
      nativeClear.call(this);
      return;
    }

    console.warn('[gapp:ls] ⚠️ localStorage.clear() called! All ' + vMap.size + ' keys (' + fmtSize(vMapBytes) + ') will be wiped.');
    console.warn('[gapp:ls] Keys being cleared:', Array.from(vMap.keys()));
    console.trace('[gapp:ls] clear() call stack:');

    // Collect shouldSync keys for cloud deletion
    vMap.forEach(function(_v, key) {
      if (shouldSync(key) && metadata[key]) {
        deletedKeys.add(key);
      }
    });

    vMap.clear();
    vMapBytes = 0;
    invalidateKeysCache();

    // Clean up any leftover v2 hot cache entries from real localStorage
    var len = nativeLength();
    for (var i = len - 1; i >= 0; i--) {
      var k = nativeKeyAt(i);
      if (k && k.startsWith(HOT_PREFIX)) {
        originalRemoveItem(k);
      }
    }

    // Increment generation counter to prevent data resurrection from stale IndexedDB
    currentGen++;
    try { originalSetItem(GEN_KEY, String(currentGen)); } catch (e) {}
    idbClear();
    idbWriteGen();

    metadata = {};
    saveMetadata();

    dirtyKeys.clear();
    if (deletedKeys.size > 0) {
      scheduleSyncToCloud();
    }
  };

  Object.defineProperty(Storage.prototype, 'length', {
    configurable: true,
    get: function() {
      if (this === localStorage) return vMap.size;
      return nativeLengthDesc.get.call(this);
    }
  });

  Storage.prototype.key = function(index) {
    if (this !== localStorage) return nativeKeyFn.call(this, index);
    if (!keysCache) keysCache = Array.from(vMap.keys());
    return index >= 0 && index < keysCache.length ? keysCache[index] : null;
  };

  // ===== Cloud Sync =====

  function scheduleSyncToCloud() {
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(syncToCloud, SYNC_DEBOUNCE_MS);
  }

  async function syncToCloud() {
    if (isSyncing || (!dirtyKeys.size && !deletedKeys.size)) return;
    if (!isOnline) {
      scheduleRetry();
      return;
    }

    isSyncing = true;
    var smallItems = [];
    var largeItems = [];

    // Snapshot timestamps at sync start for race condition fix
    var syncTimestamps = {};

    // Collect dirty items, partition by size
    dirtyKeys.forEach(function(key) {
      var value = vMap.get(key);
      if (value !== undefined) {
        syncTimestamps[key] = metadata[key] || Date.now();
        var item = {
          key: key,
          value: { _raw: value },
          timestamp: syncTimestamps[key]
        };
        if (value.length > LARGE_VALUE_THRESHOLD) {
          largeItems.push(item);
        } else {
          smallItems.push(item);
        }
      }
    });

    // Collect deleted items (always small)
    deletedKeys.forEach(function(key) {
      smallItems.push({
        key: key,
        value: null,
        timestamp: Date.now(),
        deleted: true
      });
    });

    if (smallItems.length === 0 && largeItems.length === 0) {
      isSyncing = false;
      return;
    }

    try {
      // === Handle large items via presigned URLs ===
      if (largeItems.length > 0) {
        try {
          var presignReq = largeItems.map(function(item) {
            return { key: item.key, size_bytes: item.value._raw.length };
          });
          var presignRes = await fetch(PRESIGN_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ device_id: getDeviceId(), keys: presignReq })
          });

          if (presignRes.ok) {
            var presignData = await presignRes.json();
            if (presignData.success && presignData.urls) {
              // Upload each large value directly to R2
              for (var li = 0; li < presignData.urls.length; li++) {
                var urlInfo = presignData.urls[li];
                var largeItem = largeItems.find(function(i) { return i.key === urlInfo.key; });
                if (!largeItem) continue;

                try {
                  var putRes = await fetch(urlInfo.upload_url, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(largeItem.value)
                  });

                  if (putRes.ok) {
                    // Add metadata-only sync item
                    // Use a sentinel value so server knows this is a direct-upload item
                    smallItems.push({
                      key: largeItem.key,
                      value: { _r2_direct: true },
                      timestamp: largeItem.timestamp,
                      r2_direct: {
                        storage_key: urlInfo.storage_key,
                        size_bytes: largeItem.value._raw.length,
                        state_id: urlInfo.state_id
                      }
                    });
                    console.log('[gapp:ls-sync] Direct R2 upload OK: ' + largeItem.key + ' (' + fmtSize(largeItem.value._raw.length) + ')');
                  } else {
                    // PUT failed — fall back to normal sync
                    console.warn('[gapp:ls-sync] Direct PUT failed for ' + largeItem.key + ', falling back');
                    smallItems.push(largeItem);
                  }
                } catch (putErr) {
                  console.warn('[gapp:ls-sync] Direct PUT error for ' + largeItem.key + ':', putErr.message);
                  smallItems.push(largeItem);
                }
              }
            } else {
              // Presign failed — fall back all large items to normal sync
              for (var fi = 0; fi < largeItems.length; fi++) {
                smallItems.push(largeItems[fi]);
              }
            }
          } else {
            // Presign request failed — fall back
            for (var fi2 = 0; fi2 < largeItems.length; fi2++) {
              smallItems.push(largeItems[fi2]);
            }
          }
        } catch (presignErr) {
          console.warn('[gapp:ls-sync] Presign failed:', presignErr.message);
          for (var fi3 = 0; fi3 < largeItems.length; fi3++) {
            smallItems.push(largeItems[fi3]);
          }
        }
      }

      // === Batch sync all items (small + metadata-only for large) ===
      var batches = [];
      for (var i = 0; i < smallItems.length; i += BATCH_SIZE) {
        batches.push(smallItems.slice(i, i + BATCH_SIZE));
      }

      for (var b = 0; b < batches.length; b++) {
        var batch = batches[b];
        var response = await fetch(SYNC_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            device_id: getDeviceId(),
            items: batch
          })
        });

        if (!response.ok) {
          var error = {};
          try { error = await response.json(); } catch (e) {}
          throw new Error(error.error?.message || 'Sync failed');
        }

        var result = await response.json();

        // Handle conflicts — cloud wins: update vMap + IndexedDB
        if (result.conflicts) {
          result.conflicts.forEach(function(conflict) {
            if (conflict.winner === 'cloud' && result.cloud_state) {
              var cloudItem = result.cloud_state.find(function(s) { return s.key === conflict.key; });
              if (cloudItem) {
                var valueStr = cloudValueToString(cloudItem.value);
                var oldVal = vMap.get(conflict.key);
                var oldLen = oldVal !== undefined ? oldVal.length : 0;
                vMap.set(conflict.key, valueStr);
                vMapBytes += valueStr.length - oldLen;
                invalidateKeysCache();
                idbPut(conflict.key, valueStr);
                metadata[conflict.key] = conflict.cloud_timestamp;
              }
            }
          });
          saveMetadata();
        }

        // Clear synced items — only if timestamp hasn't changed since sync started
        batch.forEach(function(item) {
          if (item.deleted) {
            deletedKeys.delete(item.key);
          } else {
            var currentTs = metadata[item.key] || 0;
            var snapshotTs = syncTimestamps[item.key] || 0;
            if (currentTs <= snapshotTs) {
              dirtyKeys.delete(item.key);
            }
            // If currentTs > snapshotTs, key was modified during sync — stays dirty
          }
        });
      }

      retryDelay = 5000;

      // If dirty keys remain (modified during sync), schedule another sync
      if (dirtyKeys.size > 0 || deletedKeys.size > 0) {
        scheduleSyncToCloud();
      }
    } catch (e) {
      console.warn('[gapp:ls-sync] Sync failed:', e.message);
      scheduleRetry();
    } finally {
      isSyncing = false;
    }
  }

  function scheduleRetry() {
    setTimeout(function() {
      if (dirtyKeys.size || deletedKeys.size) {
        syncToCloud();
      }
    }, retryDelay);
    retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY);
  }

  // Convert cloud JSON value back to string for vMap
  function cloudValueToString(value) {
    if (typeof value === 'string') return value;
    if (value && value._raw !== undefined) return String(value._raw);
    return JSON.stringify(value);
  }

  // ===== Phase 3: Recover from parent preload (sync, includes IDB + Cloud merged data) =====
  var preloadUsed = false;
  var cloudPreloaded = false; // true if parent already fetched cloud data
  try {
    if (window.parent !== window && window.parent.__gappPreloaded) {
      var preloaded = window.parent.__gappPreloaded;
      var preloadMeta = window.parent.__gappPreloadMeta || null;
      var preloadGen = preloaded[IDB_GEN_KEY];
      var preloadKeyCount = Object.keys(preloaded).length;
      console.log('[gapp:ls] Phase 3: parent preload found, ' + preloadKeyCount + ' keys, gen=' + preloadGen + ', cloudMeta=' + !!preloadMeta);

      var genOk = preloadGen === undefined || preloadGen === currentGen || currentGen === 0;
      if (genOk) {
        if (currentGen === 0 && preloadGen !== undefined && preloadGen !== 0) {
          currentGen = preloadGen;
          try { originalSetItem(GEN_KEY, String(currentGen)); } catch (e) {}
          console.log('[gapp:ls] Phase 3: adopted preload gen=' + currentGen);
        }
        var pKeys = Object.keys(preloaded);
        for (var pi = 0; pi < pKeys.length; pi++) {
          var pk = pKeys[pi];
          if (pk === IDB_GEN_KEY) continue;
          var pv = preloaded[pk];
          if (typeof pv === 'string') {
            // Preload always wins over migration data (it includes cloud-merged values)
            var oldVal = vMap.get(pk);
            if (oldVal === undefined) {
              vMap.set(pk, pv);
              vMapBytes += pv.length;
            } else if (preloadMeta && preloadMeta[pk] && pv !== oldVal) {
              // Cloud-merged value differs from migration value → use preloaded (cloud wins)
              vMapBytes += pv.length - oldVal.length;
              vMap.set(pk, pv);
            }
            // Use cloud timestamps if available, otherwise mark for potential sync
            if (preloadMeta && preloadMeta[pk]) {
              metadata[pk] = preloadMeta[pk];
            } else if (shouldSync(pk) && !metadata[pk]) {
              metadata[pk] = Date.now();
            }
          }
        }
        preloadUsed = true;
        cloudPreloaded = !!preloadMeta && Object.keys(preloadMeta).length > 0;
        saveMetadata();
        console.log('[gapp:ls] Phase 3: preload merged, vMap=' + vMap.size + ' keys, ' + fmtSize(vMapBytes) + (cloudPreloaded ? ' (cloud included)' : ''));
      } else {
        console.warn('[gapp:ls] Phase 3: preload SKIPPED, gen mismatch (preload=' + preloadGen + ', current=' + currentGen + ')');
      }
      window.parent.__gappPreloaded = null;
      try { window.parent.__gappPreloadMeta = null; } catch (e) {}
    }
  } catch (e) {}

  // ===== Phase 4: Async cloud load =====

  async function loadFromCloud() {
    try {
      var url = new URL(SYNC_API, window.location.origin);
      url.searchParams.set('device_id', getDeviceId());

      var response = await fetch(url.toString(), {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) return;

      var result = await response.json();
      if (!result.success || !result.cloud_state) return;

      var cloudTotalBytes = result.cloud_state.reduce(function(s, i) { return s + (i.size_bytes || 0); }, 0);
      console.log('[gapp:ls] Cloud: ' + result.cloud_state.length + ' keys, ' + fmtSize(cloudTotalBytes));

      // Merge cloud state into vMap
      result.cloud_state.forEach(function(item) {
        // Skip null/undefined cloud values (R2 read failure — don't corrupt local data)
        if (item.value === null || item.value === undefined) {
          console.warn('[gapp:ls] Cloud skip (null value): ' + item.key);
          return;
        }

        var localTimestamp = metadata[item.key] || 0;
        var cloudTimestamp = item.timestamp || 0;
        var localValue = vMap.get(item.key);
        var localSize = localValue !== undefined ? localValue.length : 0;

        // Cloud wins if:
        // 1. Cloud timestamp is newer, OR
        // 2. Timestamps match but local value is suspiciously small compared to cloud
        //    (detects corruption from previous failed merge that saved null/"null" with correct timestamp)
        var cloudSizeBytes = item.size_bytes || 0;
        var localCorrupted = cloudTimestamp === localTimestamp && cloudSizeBytes > 100 && localSize < cloudSizeBytes * 0.1;
        var cloudWins = cloudTimestamp > localTimestamp || localCorrupted;

        if (cloudWins) {
          var valueStr = cloudValueToString(item.value);
          // Skip if values are identical (avoid unnecessary IDB writes)
          if (localValue === valueStr) {
            metadata[item.key] = cloudTimestamp;
            return;
          }
          if (localCorrupted) {
            console.warn('[gapp:ls] Cloud repair: ' + item.key + ' local=' + fmtSize(localSize) + ' cloud=' + fmtSize(cloudSizeBytes));
          } else {
            console.log('[gapp:ls] Cloud merge: ' + item.key + ' cloud_ts=' + cloudTimestamp + ' local_ts=' + localTimestamp + ' len=' + valueStr.length);
          }
          var oldLen = localValue !== undefined ? localValue.length : 0;
          vMap.set(item.key, valueStr);
          vMapBytes += valueStr.length - oldLen;
          invalidateKeysCache();
          idbPut(item.key, valueStr);
          metadata[item.key] = cloudTimestamp;
        } else {
          if (localTimestamp > cloudTimestamp && !dirtyKeys.has(item.key)) {
            dirtyKeys.add(item.key);
          }
        }
      });

      saveMetadata();

      // Check for local-only keys that need syncing (scan vMap, not just metadata,
      // because legacy migration doesn't set metadata — cloud merge runs first)
      vMap.forEach(function(_v, mkey) {
        if (!shouldSync(mkey)) return;
        var inCloud = result.cloud_state.some(function(s) { return s.key === mkey; });
        if (!inCloud && !dirtyKeys.has(mkey)) {
          if (!metadata[mkey]) metadata[mkey] = Date.now();
          dirtyKeys.add(mkey);
        }
      });

      if (dirtyKeys.size > 0) {
        scheduleSyncToCloud();
      }
    } catch (e) {
      console.warn('[gapp:ls-sync] Failed to load from cloud:', e.message);
    } finally {
      initialLoadComplete = true;
      console.log('[gapp:ls] ✅ Ready: vMap=' + vMap.size + ' keys, ' + fmtSize(vMapBytes));
      window.dispatchEvent(new CustomEvent('gapp:localstorage:ready'));
    }
  }

  // ===== Event listeners =====

  window.addEventListener('online', function() {
    isOnline = true;
    if (dirtyKeys.size || deletedKeys.size) syncToCloud();
  });

  window.addEventListener('offline', function() {
    isOnline = false;
  });

  // Best-effort sync before page unload
  window.addEventListener('beforeunload', function() {
    if (!dirtyKeys.size && !deletedKeys.size) return;

    var items = [];
    dirtyKeys.forEach(function(key) {
      var value = vMap.get(key);
      if (value !== undefined && value.length <= MAX_BEACON_VALUE) {
        items.push({
          key: key,
          value: { _raw: value },
          timestamp: metadata[key] || Date.now()
        });
      }
    });
    deletedKeys.forEach(function(key) {
      items.push({ key: key, value: null, timestamp: Date.now(), deleted: true });
    });

    if (items.length > 0) {
      var payload = JSON.stringify({
        device_id: getDeviceId(),
        items: items.slice(0, BATCH_SIZE)
      });
      navigator.sendBeacon(SYNC_API, new Blob([payload], { type: 'application/json' }));
    }
  });

  // Pre-emptive sync when page goes hidden (handles large values that can't use beacon)
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden' && (dirtyKeys.size || deletedKeys.size)) {
      syncToCloud();
    }
  });

  // ===== Kick off =====

  // Open IndexedDB (for writes + fallback recovery), then cloud sync
  openDB().then(function() {
    console.log('[gapp:ls] IndexedDB opened: ' + (idb ? 'OK' : 'FAILED'));
    // Flush migrated data to IndexedDB, then clean up from real localStorage
    if (v2HotCacheKeys.length > 0 || legacyKeysToRemove.length > 0) {
      if (!idb) {
        // IDB not available — keep data in real localStorage as safety net
        console.warn('[gapp:ls] IDB unavailable, keeping legacy keys in real localStorage');
        v2HotCacheKeys = [];
        legacyKeysToRemove = [];
      } else {
        // Batch all writes into a SINGLE transaction, only delete from real localStorage on commit
        try {
          var flushTx = idb.transaction(STORE_NAME, 'readwrite');
          var flushStore = flushTx.objectStore(STORE_NAME);
          vMap.forEach(function(v, k) { flushStore.put(v, k); });
          flushStore.put(currentGen, IDB_GEN_KEY);
          // Capture arrays before clearing (closure safety)
          var v2ToRemove = v2HotCacheKeys.slice();
          var legacyToRemove = legacyKeysToRemove.slice();
          flushTx.oncomplete = function() {
            // IDB commit succeeded — safe to remove from real localStorage now
            for (var hi = 0; hi < v2ToRemove.length; hi++) {
              try { originalRemoveItem(v2ToRemove[hi]); } catch (e) {}
            }
            for (var li = 0; li < legacyToRemove.length; li++) {
              try { originalRemoveItem(legacyToRemove[li]); } catch (e) {}
            }
            console.log('[gapp:ls] Migration flush committed, cleaned ' + (v2ToRemove.length + legacyToRemove.length) + ' legacy keys');
          };
          flushTx.onerror = function() {
            console.warn('[gapp:ls] Migration flush FAILED, keeping legacy keys in real localStorage');
          };
        } catch (e) {
          console.warn('[gapp:ls] Migration flush error:', e);
        }
        v2HotCacheKeys = [];
        legacyKeysToRemove = [];
      }
    }

    if (!preloadUsed) {
      console.log('[gapp:ls] No preload, falling back to IndexedDB async restore...');
      // No parent preload → async restore from IndexedDB
      return idbGetAll().then(function(data) {
        var storedGen = data[IDB_GEN_KEY];
        var idbKeyCount = Object.keys(data).length;
        console.log('[gapp:ls] IndexedDB has ' + idbKeyCount + ' keys, gen=' + storedGen);
        // Recovery logic:
        // - currentGen === 0: GEN_KEY lost (our bug) or fresh install → always recover
        // - gen match or no gen stored: normal recovery
        // - currentGen > 0 and mismatch: user called clear() → skip stale IDB data
        if (storedGen !== undefined && storedGen !== currentGen && currentGen !== 0) {
          console.warn('[gapp:ls] IndexedDB SKIPPED, gen mismatch (idb=' + storedGen + ', current=' + currentGen + ')');
          return;
        }
        if (currentGen === 0 && storedGen !== undefined && storedGen !== 0) {
          // Adopt IDB's gen to restore correct generation counter
          currentGen = storedGen;
          try { originalSetItem(GEN_KEY, String(currentGen)); } catch (e) {}
          console.log('[gapp:ls] Adopted IDB gen=' + currentGen + ' (GEN_KEY was lost)');
        }
        var dKeys = Object.keys(data);
        var recoveredCount = 0;
        for (var di = 0; di < dKeys.length; di++) {
          var dk = dKeys[di];
          if (dk === IDB_GEN_KEY) continue;
          if (!vMap.has(dk) && typeof data[dk] === 'string') {
            vMap.set(dk, data[dk]);
            vMapBytes += data[dk].length;
            invalidateKeysCache();
            recoveredCount++;
            if (shouldSync(dk) && !metadata[dk]) {
              metadata[dk] = Date.now();
            }
          }
        }
        if (recoveredCount > 0) {
          console.log('[gapp:ls] IDB recovered ' + recoveredCount + ' keys, vMap=' + vMap.size + ' keys, ' + fmtSize(vMapBytes));
        }
      });
    }
  }).then(function() {
    if (cloudPreloaded) {
      // Parent page already fetched and merged cloud data — skip redundant download
      console.log('[gapp:ls] Cloud sync skipped (parent preloaded). Checking local-only keys...');
      initialLoadComplete = true;
      // Check for local-only keys that need pushing to cloud
      vMap.forEach(function(_v, mkey) {
        if (!shouldSync(mkey)) return;
        if (!metadata[mkey]) {
          metadata[mkey] = Date.now();
          dirtyKeys.add(mkey);
        }
      });
      saveMetadata();
      if (dirtyKeys.size > 0) scheduleSyncToCloud();
      window.dispatchEvent(new CustomEvent('gapp:localstorage:ready'));
      return;
    }
    // No parent preload or parent didn't fetch cloud → fetch now
    return loadFromCloud();
  }).catch(function(e) {
    console.warn('[gapp:ls-sync] Recovery error:', e);
    initialLoadComplete = true;
    window.dispatchEvent(new CustomEvent('gapp:localstorage:ready'));
  });
})();
