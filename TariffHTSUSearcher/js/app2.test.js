
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { initializeHtsApiApp } = require('./app2');

class Element {
  constructor() {
    this.value = '';
    this.checked = false;
    this.innerHTML = '';
    this.classList = {
      add() {},
      remove() {}
    };
  }
  addEventListener() {}
}

describe('performApiSearch', () => {
  let elements;
  beforeEach(() => {
    elements = {
      htsSearchInput: new Element(),
      htsSearchBtn: new Element(),
      show232Only: new Element(),
      htsResultsContainer: new Element(),
      htsLoader: new Element(),
      htsWelcomeMessage: new Element(),
      htsStatusContainer: new Element()
    };
    global.document = {
      getElementById: (id) => elements[id],
      addEventListener() {}
    };
    global.window = { currentSearchResults: [] };
  });

  test('does not call fetch when show232Only checked and search term empty', async () => {
    const { performApiSearch } = initializeHtsApiApp();
    elements.show232Only.checked = true;
    let fetchCalled = false;
    global.fetch = async () => { fetchCalled = true; };
    await performApiSearch();
    assert.equal(fetchCalled, false);
  });

  test('filters results to 232 items when show232Only is true', async () => {
    const { performApiSearch } = initializeHtsApiApp();
    elements.show232Only.checked = true;
    elements.htsSearchInput.value = 'ab';

    const sampleData = {
      results: [
        { htsno: '1111.11.11', footnotes: [{ value: 'note 16', columns: [] }] },
        { htsno: '2222.22.22', footnotes: [{ value: 'other', columns: [] }] }
      ]
    };

    let fetchCalled = false;
    global.fetch = async () => {
      fetchCalled = true;
      return {
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => sampleData
      };
    };

    await performApiSearch();
    assert.equal(fetchCalled, true);
    assert.equal(global.window.currentSearchResults.length, 1);
    assert.equal(global.window.currentSearchResults[0].htsno, '1111.11.11');
  });
});