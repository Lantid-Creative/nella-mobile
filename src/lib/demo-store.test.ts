import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  currentUser,
  canEnterChat,
  completeOnboarding,
  demoReply,
  loadChat,
  resetDemoPin,
  saveChat,
  signIn,
  signUp,
} from "./demo-store";

describe("demo preview account and chat", () => {
  beforeEach(() => {
    localStorage.clear();
  });
  it("ignores malformed but valid stored JSON without crashing", () => {
    localStorage.setItem("nella.users.v2", JSON.stringify({ unexpected: true }));
    localStorage.setItem("nella.chat.v2.8012345678", JSON.stringify({ unexpected: true }));
    expect(currentUser()).toBeNull(); expect(loadChat("8012345678")).toEqual([]);
    localStorage.setItem("nella.chat.v2.8012345678", JSON.stringify([null, { id: "bad", role: "nella", at: 1, card: { kind: "preview", preview: null } }]));
    expect(loadChat("8012345678")).toEqual([]);
  });
  it("requires new customers to complete onboarding before entering chat", () => {
    signUp("Ada Okafor", "08012345678", "1234");
    expect(canEnterChat(currentUser())).toBe(false);
    signIn("08012345678", "1234");
    expect(canEnterChat(currentUser())).toBe(false);
    completeOnboarding();
    expect(canEnterChat(currentUser())).toBe(true);
    signIn("08012345678", "1234");
    expect(canEnterChat(currentUser())).toBe(true);
  });
  it("requires older accounts without a completion record to finish setup", () => {
    localStorage.setItem("nella.users.v2", JSON.stringify([{ name: "Ada Okafor", phone: "8012345678", pin: "1234" }]));
    signIn("08012345678", "1234");
    expect(canEnterChat(currentUser())).toBe(false);
  });
  it("does not mark onboarding complete when the browser cannot save it", () => {
    signUp("Ada Okafor", "08012345678", "1234");
    const store = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("Full", "QuotaExceededError"); });
    expect(() => completeOnboarding()).toThrow();
    store.mockRestore();
    expect(canEnterChat(currentUser())).toBe(false);
  });
  it("reports an unsuccessful chat save instead of throwing on a full browser store", () => {
    const store = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("Full", "QuotaExceededError"); });
    expect(saveChat("8012345678", [])).toBe(false);
    store.mockRestore();
  });

  it("resets a demo PIN only for an account in this browser", () => {
    signUp("Ada Okafor", "08012345678", "1234");

    expect(() => resetDemoPin("08012345679", "4321")).toThrow("No demo account was found");
    resetDemoPin("08012345678", "4321");
    signIn("08012345678", "4321");
    expect(currentUser()?.name).toBe("Ada Okafor");
  });

  it("does not persist local media preview URLs in chat history", () => {
    signUp("Ada Okafor", "08012345678", "1234");
    saveChat("8012345678", [
      {
        id: "image-1",
        role: "user",
        text: "Payment photo",
        media: {
          kind: "image",
          label: "electricity-bill.jpg",
          previewUrl: "blob:local-preview",
        },
        at: 1,
      },
    ]);

    expect(loadChat("8012345678")[0]?.media).toEqual({
      kind: "image",
      label: "Image attachment",
    });
  });

  it("migrates older chat copy to the current wording", () => {
    localStorage.setItem(
      "nella.chat.v2.8012345678",
      JSON.stringify([
        {
          id: "voice-1",
          role: "user",
          text: "Voice note · preview only",
          at: 1,
        },
        {
          id: "voice-2",
          role: "nella",
          text: "I’ve received this voice note in the preview, but I can’t transcribe it here. No audio was uploaded and no payment was started.",
          at: 2,
        },
      ]),
    );

    expect(loadChat("8012345678").map((message) => message.text)).toEqual([
      "Voice note",
      "Voice messages can’t be transcribed right now. Please type your request instead.",
    ]);
  });

  it("does not claim to process attachments that are not supported", () => {
    expect(demoReply("I snapped a bill")[0]?.text).toContain("No payment has been made");
    expect(demoReply("Voice note")[0]?.text).toContain("can’t be transcribed");
  });

  it("does not invent a wallet balance", () => {
    expect(demoReply("Check my balance")).toEqual([
      { text: "Your wallet balance is currently unavailable." },
    ]);
  });

  it("requires a network before showing an airtime approval", () => {
    expect(demoReply("₦1,000 airtime to 08012345678")[0]?.text).toContain(
      "amount, number and network",
    );
    expect(demoReply("₦1,000 airtime to 08012345678 MTN")[0]?.card).toMatchObject({
      kind: "approval",
      bank: "MTN",
    });
  });
});
