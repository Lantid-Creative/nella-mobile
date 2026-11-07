import { beforeEach, describe, expect, it } from "vitest";
import { formatPhone, loginPinReady, readSetupDraft, saveSetupDraft } from "./mobile-ux";

beforeEach(() => localStorage.clear());
describe("mobile login and setup", () => {
  it("formats a national phone number without changing its digits", () => {
    expect(formatPhone("08012345678")).toBe("0801 234 5678");
    expect(formatPhone("+2348012345678")).toBe("801 234 5678");
  });
  it("only auto-submits after four PIN digits and a valid phone", () => {
    expect(loginPinReady("0801 234 5678", "123")).toBe(false);
    expect(loginPinReady("0801 234 5678", "1234")).toBe(true);
    expect(loginPinReady("0801", "1234")).toBe(false);
  });
  it("resumes profile setup without retaining private PIN inputs", () => {
    saveSetupDraft({ name: "Ada Okafor", phone: "803 464 8447", step: 2 });
    expect(readSetupDraft()).toEqual({ name: "Ada Okafor", phone: "803 464 8447", step: 2 });
    localStorage.setItem("nella.setup-draft.v1", JSON.stringify({ name: "Ada", phone: "803", step: 9, pin: "1234" }));
    expect(readSetupDraft()).toBeNull();
  });
});