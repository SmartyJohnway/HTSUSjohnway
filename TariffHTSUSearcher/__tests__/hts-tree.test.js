import { buildHtsTree, flattenHtsTree } from "../src/core/hts-tree.js";

describe("buildHtsTree", () => {
  test("creates hierarchical structure from indent levels", () => {
    const items = [
      { htsno: "1000", indent: 0 },
      { htsno: "1000.10", indent: 1 },
      { htsno: "1000.20", indent: 1 },
      { htsno: "1000.20.10", indent: 2 },
      { htsno: "2000", indent: 0 },
    ];
    const tree = buildHtsTree(items);
    expect(tree).toHaveLength(2);
    expect(tree[0].children).toHaveLength(2);
    expect(tree[0].children[1].children).toHaveLength(1);
    expect(tree[0].children[1].children[0].htsno).toBe("1000.20.10");
    expect(tree[1].children).toHaveLength(0);
  });
});

describe("flattenHtsTree", () => {
  test("returns original items without children", () => {
    const items = [
      { htsno: "1000", indent: 0 },
      { htsno: "1000.10", indent: 1 },
      { htsno: "1000.20", indent: 1 },
      { htsno: "1000.20.10", indent: 2 },
      { htsno: "2000", indent: 0 },
    ];
    const tree = buildHtsTree(items);
    const flat = flattenHtsTree(tree);
    expect(flat).toEqual(items);
  });
});
