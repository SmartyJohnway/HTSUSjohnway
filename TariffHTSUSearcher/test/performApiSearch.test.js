const assert = require('assert');

global.window = {};

function createElement() {
  return {
    innerHTML: '',
    value: '',
    checked: false,
    classList: {
      add() {},
      remove() {},
      contains() { return false; }
    },
    addEventListener() {}
  };
}

const elements = {
  htsSearchInput: createElement(),
  htsSearchBtn: createElement(),
  htsResultsContainer: createElement(),
  htsLoader: createElement(),
  htsWelcomeMessage: createElement(),
  htsStatusContainer: createElement(),
  show232Only: createElement()
};

global.document = {
  getElementById: (id) => elements[id],
  addEventListener() {}
};

const { initializeHtsApiApp } = require('../js/app2.js');
const { performApiSearch } = initializeHtsApiApp();

elements.htsSearchInput.value = 'abcd';

global.fetch = async () => ({
  ok: true,
  status: 200,
  headers: { get: () => 'text/html' },
  text: async () => '<html>very long error page</html>'
});

(async () => {
  try {
    await performApiSearch();
    const html = elements.htsResultsContainer.innerHTML;
    assert(html.includes('查詢時發生錯誤'));
    assert(!html.includes('<html>'));
    console.log('performApiSearch non-JSON response test passed');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();