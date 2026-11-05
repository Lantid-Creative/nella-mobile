import { describe, expect, it } from "vitest";
import { answerPayment, startPayment } from "./chat-payments";

describe("Chat-only payments", () => {
  it("collects bank, account number, amount and narration through chat", () => {
    let turn = startPayment("transfer", "Send money", "Ada");
    for (const answer of ["GTBank", "0123456789", "5000", "Rent"]) {
      if (!turn.state) throw new Error("Expected an active conversation");
      turn = answerPayment(turn.state, answer, "Ada");
    }
    expect(turn.preview?.amount).toBe(5000);
    expect(turn.preview?.rows).toContainEqual(["Recipient account", "0123456789"]);
    expect(turn.preview?.rows).toContainEqual(["Status", "Preview only — not submitted"]);
  });
  it("rejects invalid account numbers without advancing", () => {
    const state = startPayment("transfer", "Send money to GTBank", "Ada").state;
    if (!state) throw new Error("Expected state");
    expect(answerPayment(state, "123", "Ada").state?.field).toBe("destination");
  });
  it("edits amount in chat and cancels without execution", () => {
    const state = startPayment("airtime", "₦1000 airtime to 08012345678 MTN", "Ada").state;
    if (!state) throw new Error("Expected state");
    expect(answerPayment(state, "Change amount to 2000", "Ada").preview?.amount).toBe(2000);
    expect(answerPayment(state, "Cancel", "Ada").state).toBeNull();
  });
  it("keeps the original complete transfer parser", () => {
    expect(startPayment("transfer", "send ₦5,000 to 0123456789 GTBank", "Ada").state?.draft.amount).toBe("5000");
  });
  it("requires electricity meter type before review", () => {
    const state = startPayment("electricity", "₦1000 Ikeja Electric meter 12345678901", "Ada").state;
    expect(state?.field).toBe("plan");
    if (!state) throw new Error("Expected state");
    expect(answerPayment(state, "Prepaid", "Ada").preview?.rows).toContainEqual(["Plan / package", "Prepaid"]);
  });
  it("collects data and cable plans through chat", () => {
    for (const [service, provider, number, plan] of [["data", "MTN", "08012345678", "2GB"], ["cable", "DStv", "12345678901", "Compact"]] as const) {
      let turn = startPayment(service, "", "Ada");
      for (const answer of [provider, number, plan, "1000"]) {
        if (!turn.state) throw new Error("Expected conversation");
        turn = answerPayment(turn.state, answer, "Ada");
      }
      expect(turn.preview?.rows).toContainEqual(["Plan / package", plan]);
      expect(turn.preview?.amount).toBe(1000);
    }
  });
});