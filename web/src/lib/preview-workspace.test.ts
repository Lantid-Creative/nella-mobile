import { describe, expect, it } from "vitest";
import { paymentPreview, type PaymentDraft } from "./app-provisions";
import { draftFromPreview, filterPreviews, recipientError } from "./preview-workspace";

const draft: PaymentDraft = { service: "transfer", amount: "5000", destination: "0123456789", provider: "GTBank", narration: "Rent", plan: "" };
describe("Preview workspace", () => {
  it("reuses editable payment details without approval or provider identifiers", () => {
    const preview = paymentPreview(draft, "Ada");
    preview.rows.push(["Reference", "external-reference"]);
    expect(draftFromPreview(preview)).toEqual(draft);
    expect(draftFromPreview({ ...preview, title: "Unknown" })).toBeNull();
  });
  it("filters by recipient and service together", () => {
    const previews = [paymentPreview(draft, "Ada"), paymentPreview({ ...draft, service: "airtime", destination: "08012345678", provider: "MTN" }, "Ada")];
    expect(filterPreviews(previews, "0123456789", "transfer")).toEqual([previews[0]]);
    expect(filterPreviews(previews, "0123456789", "airtime")).toEqual([]);
  });
  it("validates ten digit recipients before advancing without requiring an amount yet", () => {
    expect(recipientError({ ...draft, amount: "" })).toBeNull();
    expect(recipientError({ ...draft, destination: "123" })).toBe("Enter a 10-digit account number.");
  });
});