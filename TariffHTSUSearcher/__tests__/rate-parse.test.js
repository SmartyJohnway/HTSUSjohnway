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

describe('rate-parse', () => {
  beforeEach(() => {
    setupDom();
  });

  test('parses "applicable subheading + 25%" as 25', () => {
    const { parseChapter99Rate } = window.initializeHtsApiApp();
    expect(parseChapter99Rate('applicable subheading + 25%')).toBe(25);
  });

  test('parses "The duty provided in the applicable subheading + 25%" as 25', () => {
    const { parseChapter99Rate } = window.initializeHtsApiApp();
    expect(parseChapter99Rate('The duty provided in the applicable subheading + 25%')).toBe(25);
  });

  test('parses "70%" as 70', () => {
    const { parseChapter99Rate } = window.initializeHtsApiApp();
    expect(parseChapter99Rate('70%')).toBe(70);
  });
});