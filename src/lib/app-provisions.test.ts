import { describe, expect, it } from "vitest";
import {
  panelForMessage,
  paymentPreview,
  validatePaymentDraft,
  type PaymentDraft,
} from "./app-provisions";

const transfer: PaymentDraft = {
  service: "transfer",
  amount: "5000",
  destination: "0123456789",
  provider: "GTBank",
  narration: "Rent",
  plan: "",
};
describe("WhatsApp-to-app provisions", () => {
  it("routes a refund to support, not funding", () => {
    expect(panelForMessage("Help with a refund")).toBe("support");
    expect(panelForMessage("fund my account")).toBe("account");
  });
  it("routes forgotten PIN and account recovery to security", () => {
    expect(panelForMessage("forgot PIN")).toBe("security");
    expect(panelForMessage("recover account")).toBe("security");
  });
  it("opens receipts through chat without adding a navigation page", () => {
    expect(panelForMessage("Show my receipts")).toBe("activity");
  });
  it("keeps detailed transfer instructions in the existing payment parser", () => {
    expect(panelForMessage("Send ₦5,000 to 0123456789 GTBank")).toBeNull();
  });
  it("requires the original ten-digit transfer account", () => {
    expect(validatePaymentDraft({ ...transfer, destination: "123" })).toBe(
      "Enter a 10-digit account number.",
    );
    expect(validatePaymentDraft(transfer)).toBeNull();
  });
  it("does not generate a successful transaction or provider identifiers from a preview", () => {
    const receipt = paymentPreview(transfer, "Ada Okafor");
    expect(receipt.rows).toContainEqual(["Status", "Preview only — not submitted"]);
    expect(receipt.rows).toContainEqual(["Reference", "Not issued"]);
    expect(receipt.rows).toContainEqual(["Session ID", "Not issued"]);
  });
  it("matches the original minimum transfer amount of 100 naira", () => {
    expect(validatePaymentDraft({ ...transfer, amount: "99" })).toBe("The minimum amount is ₦100.");
    expect(validatePaymentDraft({ ...transfer, amount: "100" })).toBeNull();
  });
  it("requires electricity meter type before preparing a bill", () => {
    expect(
      validatePaymentDraft({
        ...transfer,
        service: "electricity",
        provider: "Ikeja Electric",
        plan: "",
      }),
    ).toBe("Choose prepaid or postpaid.");
  });
});
