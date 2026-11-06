import { describe, expect, it } from "vitest";
import { resolveTheme } from "./theme";

describe("theme choice", () => {
  it("system mode follows the phone setting", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });
  it("manual choice ignores the phone setting", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });
});
