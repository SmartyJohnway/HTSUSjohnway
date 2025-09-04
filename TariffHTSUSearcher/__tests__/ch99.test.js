import '../js/app2.js';

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
  global.window = { currentSearchResults: [], safe: fn => fn };
}

describe('ch99', () => {
  beforeEach(() => {
    setupDom();
  });

  test('extracts 9903.91.01 and detects Note 19', () => {
    const { findChapter99References } = window.initializeHtsApiApp();
    const footnotes = [{ value: 'Refer to U.S. note 19 and 9903.91.01', columns: ['general'] }];
    const result = findChapter99References(footnotes, 'general');
    expect(result.refs).toContain('9903.91.01');
    expect(result.has232Note).toBe(true);
  });

  test('returns empty when no references present', () => {
    const { findChapter99References } = window.initializeHtsApiApp();
    const footnotes = [{ value: 'no relevant note', columns: ['general'] }];
    const result = findChapter99References(footnotes, 'general');
    expect(result.refs).toHaveLength(0);
    expect(result.has232Note).toBe(false);
  });
});