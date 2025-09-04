async function safe(url, options = {}) {
  while (true) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        throw new Error(res.statusText || `HTTP ${res.status}`);
      }
      return res;
    } catch (err) {
      if (typeof window !== 'undefined' && window.confirm) {
        const retry = window.confirm('無法取得資料，是否要重試?');
        if (!retry) {
          if (window.alert) {
            window.alert('請稍後再試。');
          }
          throw err;
        }
      } else {
        throw err;
      }
    }
  }
}

if (typeof window !== 'undefined') {
  window.api = window.api || {};
  window.api.safe = safe;
}

if (typeof module !== 'undefined') {
  module.exports = { safe };
}