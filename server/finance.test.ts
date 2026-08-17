import { describe, expect, it } from "vitest";
import { summarizeFinanceEntries } from "../client/src/lib/finance";

describe("summarizeFinanceEntries", () => {
  it("sums amounts, counts entries and selects the earliest due date", () => {
    const summary = summarizeFinanceEntries(
      [
        { expense: "Internet", amount: "250", dueDate: "2026-09-20" },
        { expense: "Aluguel", amount: 100, dueDate: "2026-09-05" },
      ],
      new Date("2026-09-01T12:00:00Z"),
    );

    expect(summary.total).toBe(350);
    expect(summary.count).toBe(2);
    expect(summary.nextDue?.expense).toBe("Aluguel");
    expect(summary.daysRemaining).toBe(5);
  });

  it("returns null for the next due date when no date is present", () => {
    const summary = summarizeFinanceEntries([{ expense: "Sem data", amount: 80 }]);

    expect(summary.total).toBe(80);
    expect(summary.count).toBe(1);
    expect(summary.nextDue).toBeUndefined();
    expect(summary.daysRemaining).toBeNull();
  });
});
