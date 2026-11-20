import { describe, expect, it } from "vitest";
import { formatPhone, loginPinReady } from "./mobile-ux";

describe("mobile login", () => {
  it("formats a national phone number without changing its digits", () => {
    expect(formatPhone("08012345678")).toBe("0801 234 5678");
    expect(formatPhone("+2348012345678")).toBe("801 234 5678");
  });
  it("only auto-submits after four PIN digits and a valid phone", () => {
    expect(loginPinReady("0801 234 5678", "123")).toBe(false);
    expect(loginPinReady("0801 234 5678", "1234")).toBe(true);
    expect(loginPinReady("0801", "1234")).toBe(false);
  });
});
