import { findChapter99References } from "../src/core/ch99.js";

describe("ch99", () => {
  test("extracts 9903.91.01 and detects Note 16", () => {
    const footnotes = [
      { value: "Refer to U.S. note 16 and 9903.91.01", columns: ["general"] },
    ];
    const result = findChapter99References(footnotes, "general");
    expect(result.refs).toContain("9903.91.01");
    expect(result.has232Note).toBe(true);
  });

  test("returns empty when no references present", () => {
    const footnotes = [{ value: "no relevant note", columns: ["general"] }];
    const result = findChapter99References(footnotes, "general");
    expect(result.refs).toHaveLength(0);
    expect(result.has232Note).toBe(false);
  });

  test("ignores footnotes without columns", () => {
    const footnotes = [{ value: "See 9903.91.01 without columns" }];
    const result = findChapter99References(footnotes, "general");
    expect(result.refs).toHaveLength(0);
    expect(result.has232Note).toBe(false);
  });

  test("ignores references from other columns", () => {
    const footnotes = [
      { value: "See 9903.88.01", columns: ["special"] },
    ];
    const result = findChapter99References(footnotes, "general");
    expect(result.refs).toHaveLength(0);
    expect(result.has232Note).toBe(false);
  });
});