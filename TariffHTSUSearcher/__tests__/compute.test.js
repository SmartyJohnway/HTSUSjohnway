import { calculateTotalRates, formatRate } from "../src/core/compute.js";

describe("calculateTotalRates", () => {
  test("returns zeros when allItems is not an array", () => {
    const result = calculateTotalRates({}, null);
    expect(result).toEqual({ generalTotal: 0, otherTotal: 0 });
  });

  test("computes base and additional rates", () => {
    const item = {
      htsno: "0101.01.01",
      general: "5%",
      other: "Free",
      footnotes: [
        { value: "See 9903.88.01 and 9903.88.02", columns: ["general"] },
        { value: "See 9903.77.01 and 9903.77.02", columns: ["other"] },
      ],
    };

    const allItems = [
      item,
      { htsno: "9903.88.01", general: "10%" },
      { htsno: "9903.88.02", general: "20%" },
      { htsno: "9903.77.01", other: "5%" },
      { htsno: "9903.77.02", other: "10%" },
    ];

    const result = calculateTotalRates(item, allItems);
    expect(result).toEqual({
      generalTotal: 25,
      otherTotal: 15,
      hasAdditionalDuty: true,
    });
  });

  test("applies section 232 adjustments", () => {
    const item = {
      htsno: "1111.22.33",
      general: "2%",
      other: "3%",
      footnotes: [
        { value: "Refer to U.S. note 16 and 9903.88.01", columns: ["general"] },
      ],
    };

    const allItems = [
      item,
      { htsno: "9903.88.01", general: "5%" },
      { htsno: "9903.91.01", general: "applicable subheading + 25%" },
      { htsno: "9903.90.09", other: "70%" },
    ];

    const result = calculateTotalRates(item, allItems);
    expect(result).toEqual({
      generalTotal: 30,
      otherTotal: 73,
      hasAdditionalDuty: true,
    });
  });
});

describe("formatRate", () => {
  test("formats numeric rates and zero", () => {
    expect(formatRate(0)).toBe("Free");
    expect(formatRate(5)).toBe("5%");
  });
});
