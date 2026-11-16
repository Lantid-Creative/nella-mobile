import { describe, expect, it } from "vitest";
import { dayLabel, filterChoices, greeting, groupInfo, paymentSteps } from "./chat-ux";

const t = new Date(2026, 10, 5, 12).getTime();
describe("chat UX helpers", () => {
  it("labels today and yesterday", () => {
    expect(dayLabel(t, t)).toBe("Today");
    expect(dayLabel(t - 86_400_000, t)).toBe("Yesterday");
  });
  it("groups same-sender messages within two minutes", () => {
    const msgs = [
      { role: "nella" as const, at: t },
      { role: "nella" as const, at: t + 30_000 },
      { role: "user" as const, at: t + 60_000 },
    ];
    expect(groupInfo(msgs, 0)).toEqual({ newDay: true, firstInGroup: true, lastInGroup: false });
    expect(groupInfo(msgs, 1)).toEqual({ newDay: false, firstInGroup: false, lastInGroup: true });
    expect(groupInfo(msgs, 2).firstInGroup).toBe(true);
  });
  it("greets by time of day", () => {
    expect(greeting(8)).toBe("Good morning");
    expect(greeting(14)).toBe("Good afternoon");
    expect(greeting(20)).toBe("Good evening");
  });
  it("marks completed transfer steps", () => {
    const steps = paymentSteps({
      draft: {
        service: "transfer",
        provider: "GTBank",
        destination: "1212121212",
        amount: "1000",
      } as never,
      field: "narration",
    });
    expect(steps.map((s) => s.label)).toEqual([
      "Provider",
      "Recipient",
      "Amount",
      "Reason",
      "Review",
    ]);
    expect(steps.filter((s) => s.done)).toHaveLength(3);
  });
  it("filters long choice lists", () => {
    expect(filterChoices(["GTBank", "Access", "Kuda"], "ku")).toEqual(["Kuda"]);
  });
});
