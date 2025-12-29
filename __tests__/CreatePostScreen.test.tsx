import {
  validTitle,
  validDesc,
  validTag,
  validImage,
  validLocation,
} from "@/utils/create-post/validation";

describe("validation utils", () => {
  const titleLimit = 28;
  const descLimit = 120;

  test("validTitle()", () => {
    expect(validTitle("", titleLimit)).toBe(false);
    expect(validTitle(" ".repeat(5), titleLimit)).toBe(false);
    expect(validTitle("A".repeat(titleLimit + 1), titleLimit)).toBe(false);
    expect(validTitle("Valid Post", titleLimit)).toBe(true);
  });

  test("validDesc()", () => {
    expect(validDesc("", descLimit)).toBe(false);
    expect(validDesc("A".repeat(descLimit + 1), descLimit)).toBe(false);
    expect(validDesc("Cool event description", descLimit)).toBe(true);
  });

  test("validTag()", () => {
    expect(validTag([])).toBe(false);
    expect(validTag(["Outdoor"])).toBe(true);
  });

  test("validImage()", () => {
    expect(validImage([])).toBe(false);
    expect(validImage(["uri1.jpg"])).toBe(true);
  });

  test("validLocation()", () => {
    expect(validLocation("")).toBe(false);
    expect(validLocation("   ")).toBe(false);
    expect(validLocation("Vancouver")).toBe(true);
  });
});
