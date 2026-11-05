import { beforeEach, describe, expect, it } from "vitest";
import { biometricPhone, disableBiometrics, hasBiometrics } from "./biometrics";

const seed = (records: unknown) => localStorage.setItem("nella.biometrics.v1", JSON.stringify(records));

describe("biometric unlock records", () => {
  beforeEach(() => localStorage.clear());

  it("reports no biometric phone when nothing is stored", () => {
    expect(biometricPhone()).toBeNull();
    expect(hasBiometrics("8012345678")).toBe(false);
  });

  it("reads the stored phone and matches it", () => {
    seed([{ phone: "8012345678", credentialId: "abc", name: "Ada Lovelace" }]);
    expect(biometricPhone()).toBe("8012345678");
    expect(hasBiometrics("8012345678")).toBe(true);
    expect(hasBiometrics("9012345678")).toBe(false);
  });

  it("ignores malformed stored data instead of crashing", () => {
    localStorage.setItem("nella.biometrics.v1", "{not json");
    expect(biometricPhone()).toBeNull();
    seed([{ phone: 123 }, null, "junk"]);
    expect(biometricPhone()).toBeNull();
  });

  it("removes the record when biometrics are disabled", () => {
    seed([{ phone: "8012345678", credentialId: "abc", name: "Ada" }]);
    disableBiometrics("8012345678");
    expect(biometricPhone()).toBeNull();
    expect(localStorage.getItem("nella.biometrics.v1")).toBeNull();
  });
});
