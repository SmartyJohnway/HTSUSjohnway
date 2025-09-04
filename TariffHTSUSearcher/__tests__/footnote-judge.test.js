import { initializeHtsApiApp } from '../js/app2.js';

class Element {
  constructor() {
    this.value = '';
    this.checked = false;
    this.innerHTML = '';
    this.classList = { add() {}, remove() {} };
  }
  addEventListener() {}
}

function setupDom() {
  const elements = {
    htsSearchInput: new Element(),
    htsSearchBtn: new Element(),
    htsResultsContainer: new Element(),
    htsLoader: new Element(),
    htsWelcomeMessage: new Element(),
    htsStatusContainer: new Element()
  };
  global.document = {
    getElementById: id => elements[id],
    addEventListener() {}
  };
  global.window = { currentSearchResults: [] };
}

describe('footnote-judge', () => {
  beforeEach(() => {
    setupDom();
  });

  test('detects U.S. Note 16 in item footnotes', () => {
    const { check232Applicability } = initializeHtsApiApp();
    const item = { htsno: '1111.11.11', footnotes: [{ value: 'See U.S. note 16 to subchapter III, chapter 99', columns: [] }] };
    const result = check232Applicability(item, [item]);
    expect(result).toBe(true);
  });

  test('detects Note 16 through parent item', () => {
    const { check232Applicability } = initializeHtsApiApp();
    const parent = { htsno: '1111.11', footnotes: [{ value: 'Referenced in note 16 to subchapter III, chapter 99', columns: [] }] };
    const child = { htsno: '1111.11.11', footnotes: [], statisticalSuffix: true };
    const result = check232Applicability(child, [parent, child]);
    expect(result).toBe(true);
  });
});