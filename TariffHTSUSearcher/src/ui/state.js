function debounce(fn, delay = 500) {
  let timer;
  return function (...args) {
    const context = this;
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(context, args), delay);
  };
}

const api = { debounce };

if (typeof module !== 'undefined') {
  module.exports = api;
}
if (typeof window !== 'undefined') {
  window.uiState = api;
}