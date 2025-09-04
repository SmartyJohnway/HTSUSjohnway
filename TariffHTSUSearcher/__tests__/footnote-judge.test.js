import { check232Applicability } from "../src/core/footnote-judge.js";

describe("footnote-judge", () => {
  test("detects U.S. Note 16 in item footnotes", () => {
    const item = {
      htsno: "1111.11.11",
      footnotes: [
        { value: "See U.S. note 16 to subchapter III, chapter 99", columns: [] },
      ],
    };
    const result = check232Applicability(item, [item]);
    expect(result).toBe(true);
  });

  test("detects Note 16 through parent item", () => {
    const parent = {
      htsno: "1111.11",
      footnotes: [
        { value: "Referenced in note 16 to subchapter III, chapter 99", columns: [] },
      ],
    };
    const child = {
      htsno: "1111.11.11",
      footnotes: [],
      statisticalSuffix: true,
    };
    const result = check232Applicability(child, [parent, child]);
    expect(result).toBe(true);
  });

  test("returns false when note 16 is absent", () => {
    const item = { htsno: "1111.11.11", footnotes: [] };
    const result = check232Applicability(item, [item]);
    expect(result).toBe(false);
  });
});