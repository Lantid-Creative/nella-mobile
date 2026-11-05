import { describe, expect, it } from "vitest";
import { panelForMessage, paymentPreview, validatePaymentDraft, type PaymentDraft } from "./app-provisions";

const transfer: PaymentDraft = { service: "transfer", amount: "5000", destination: "0123456789", provider: "GTBank", narration: "Rent", plan: "" };
describe("WhatsApp-to-app provisions", () => {
  it("opens receipts through chat without adding a navigation page", () => {
    expect(panelForMessage("Show my receipts")).toBe("activity");
  });
  it("keeps detailed transfer instructions in the existing payment parser", () => {
    expect(panelForMessage("Send ₦5,000 to 0123456789 GTBank")).toBeNull();
  });
  it("requires the original ten-digit transfer account", () => {
    expect(validatePaymentDraft({ ...transfer, destination: "123" })).toBe("Enter a 10-digit account number.");
    expect(validatePaymentDraft(transfer)).toBeNull();
  });
  it("does not generate a successful transaction or provider identifiers from a preview", () => {
    const receipt = paymentPreview(transfer, "Ada Okafor");
    expect(receipt.rows).toContainEqual(["Status", "Preview only — not submitted"]);
    expect(receipt.rows).toContainEqual(["Reference", "Not issued"]);
    expect(receipt.rows).toContainEqual(["Session ID", "Not issued"]);
  });
});