import { describe, expect, it } from "vitest";
import { cleanGoalPeriod, goalPeriodInputType, goalPeriodInputValue, periodValueForDate } from "./goal-period";

describe("goal period helpers", () => {
  it("maps each cadence to the correct native calendar input", () => {
    expect(goalPeriodInputType("Diária")).toBe("date");
    expect(goalPeriodInputType("Semanal")).toBe("week");
    expect(goalPeriodInputType("Mensal")).toBe("month");
  });

  it("keeps explicit calendar values and formats them for the panel", () => {
    expect(goalPeriodInputValue({ cadence: "Mensal", period: "2026-08" })).toBe("2026-08");
    expect(goalPeriodInputValue({ cadence: "Semanal", period: "2026-W34" })).toBe("2026-W34");
    expect(goalPeriodInputValue({ cadence: "Diária", period: "2026-08-17" })).toBe("2026-08-17");
    expect(cleanGoalPeriod("Mensal · 2026-08")).toMatch(/agosto/i);
  });

  it("generates stable values for a reference date", () => {
    const date = new Date("2026-08-17T12:00:00");
    expect(periodValueForDate("Mensal", date)).toBe("2026-08");
    expect(periodValueForDate("Diária", date)).toBe("2026-08-17");
    expect(periodValueForDate("Semanal", date)).toMatch(/^2026-W\d{2}$/);
  });
});
