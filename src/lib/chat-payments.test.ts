import { describe, expect, it } from "vitest";
import { answerPayment, startPayment } from "./chat-payments";

describe("Chat-only payments", () => {
  it("breakdown amount editing preserves the recipient, provider and narration", () => {
    let turn = startPayment("transfer", "Send 1000 to 1212121212 GTB", "Ada");
    if (!turn.state) throw new Error("Expected state");
    turn = answerPayment(turn.state, "Rent", "Ada");
    if (!turn.state) throw new Error("Expected review");
    turn = answerPayment(turn.state, "Change amount", "Ada");
    expect(turn.state?.field).toBe("amount");
    if (!turn.state) throw new Error("Expected edit");
    turn = answerPayment(turn.state, "2000", "Ada");
    expect(turn.state?.draft).toMatchObject({ amount: "2000", destination: "1212121212", provider: "GTBank", narration: "Rent" });
    expect(turn.state?.field).toBe("review");
  });
  it("a recipient edit does not silently overwrite the amount or bank from a multi-detail reply", () => {
    const initial = startPayment("airtime", "₦1000 airtime to 08012345678 MTN", "Ada");
    if (!initial.state) throw new Error("Expected review");
    const edit = answerPayment(initial.state, "Change number", "Ada");
    if (!edit.state) throw new Error("Expected edit");
    const changed = answerPayment(edit.state, "08034648447 Airtel 2000 naira", "Ada");
    expect(changed.state?.draft).toMatchObject({ destination: "08034648447", provider: "MTN", amount: "1000" });
    expect(initial.state.draft.destination).toBe("08012345678");
  });
  it("understands the requested bare-amount transfer and GTB alias", () => {
    const turn = startPayment("transfer", "Send 1000 to 1212121212 GTB", "Ada");
    expect(turn.state?.draft).toMatchObject({ amount: "1000", destination: "1212121212", provider: "GTBank" });
    expect(turn.state?.field).toBe("narration");
  });
  it("retains the requested airtime phone and asks for the missing network", () => {
    const turn = startPayment("airtime", "buy airtime for 08034648447", "Ada");
    expect(turn.state?.draft.destination).toBe("08034648447");
    expect(turn.state?.draft.amount).toBe("");
    expect(turn.state?.field).toBe("provider");
    if (!turn.state) throw new Error("Expected conversation");
    const reply = answerPayment(turn.state, "MTN 1000", "Ada");
    expect(reply.preview?.amount).toBe(1000);
    expect(reply.preview?.rows).toContainEqual(["Phone number", "08034648447"]);
  });
  it("uses the active customer's number for buy data for me without guessing network or plan", () => {
    const turn = startPayment("data", "buy data for me", "Ada", undefined, "8034648447");
    expect(turn.state?.draft).toMatchObject({ destination: "08034648447", provider: "", plan: "", amount: "" });
    expect(turn.state?.field).toBe("provider");
    if (!turn.state) throw new Error("Expected conversation");
    const reply = answerPayment(turn.state, "MTN 2GB", "Ada", "8034648447");
    expect(reply.state?.draft.plan).toBe("2GB");
    expect(reply.state?.draft.amount).toBe("");
    expect(reply.state?.field).toBe("amount");
  });
  it("asks for a phone when self-purchase has no valid active phone", () => {
    const turn = startPayment("data", "buy data for me MTN", "Ada");
    expect(turn.state?.field).toBe("destination");
  });
  it("accepts multiple transfer details in a reply and canonicalizes GTB", () => {
    const state = startPayment("transfer", "Send money", "Ada").state;
    if (!state) throw new Error("Expected conversation");
    const turn = answerPayment(state, "1212121212 GTB 1000 naira", "Ada");
    expect(turn.state?.draft).toMatchObject({ destination: "1212121212", provider: "GTBank", amount: "1000" });
    expect(turn.state?.field).toBe("narration");
  });
  it("does not interpret a phone or data-plan size as an amount", () => {
    const turn = startPayment("data", "buy 2GB data for 08034648447 MTN", "Ada");
    expect(turn.state?.draft.amount).toBe("");
    expect(turn.state?.draft.plan).toBe("2GB");
    expect(turn.state?.field).toBe("amount");
  });
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