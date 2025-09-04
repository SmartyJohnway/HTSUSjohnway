import { parseChapter99Rate } from "../src/core/rate-parse.js";

describe("rate-parse", () => {
  test("parses 'applicable subheading + 25%' as 25", () => {
    expect(parseChapter99Rate("applicable subheading + 25%"))
      .toBe(25);
  });

  test(
    "parses 'The duty provided in the applicable subheading + 25%' as 25",
    () => {
      expect(
        parseChapter99Rate(
          "The duty provided in the applicable subheading + 25%"
        )
      ).toBe(25);
    }
  );

  test("parses '70%' as 70", () => {
    expect(parseChapter99Rate("70%"))
      .toBe(70);
  });

  test("returns 0 for empty input", () => {
    expect(parseChapter99Rate(""))
      .toBe(0);
  });
});