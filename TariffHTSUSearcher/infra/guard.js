function safe(fn, fallback) {
  return (...args) => {
    try {
      const result = fn(...args);
      if (result && typeof result.then === 'function') {
        return result.catch(err => {
          console.error(err);
          return typeof fallback === 'function' ? fallback(err, ...args) : fallback;
        });
      }
      return result;
    } catch (err) {
      console.error(err);
      return typeof fallback === 'function' ? fallback(err, ...args) : fallback;
    }
  };
}

if (typeof window !== 'undefined') {
  window.safe = safe;