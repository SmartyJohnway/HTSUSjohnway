const cacheMap = new Map();
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

function keyFromQuery(query) {
  try {
    return JSON.stringify(query);
  } catch {
    return String(query);
  }
}

function set(query, value, ttl = DEFAULT_TTL) {
  const key = keyFromQuery(query);
  const expires = Date.now() + ttl;
  cacheMap.set(key, { value, expires });
}

function get(query) {
  const key = keyFromQuery(query);
  const entry = cacheMap.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expires) {
    cacheMap.delete(key);
    return undefined;
  }
  return entry.value;
}

function clear() {
  cacheMap.clear();
}

const api = { get, set, clear };

if (typeof window !== 'undefined') {
  window.appCache = api;
}

export default api;