import { describe, expect, it } from "vitest";
import { demoApprovalError } from "./payment-approval";

const user = { name: "Ada Test", phone: "8034648447", pin: "0123" };
describe("Demo payment approval", () => {
  it("requires exactly four digits", () => {
    for (const pin of ["", "123", "01234", "abcd", " 0123"])
      expect(demoApprovalError(pin, user)).not.toBeNull();
  });
  it("rejects a PIN that does not match the active account", () => {
    expect(demoApprovalError("1234", user)).not.toBeNull();
  });
  it("accepts the matching four-digit demo PIN, including leading zero", () => {
    expect(demoApprovalError("0123", user)).toBeNull();
  });
});
