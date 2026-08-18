import { describe, expect, it } from "vitest";
import { businessDaysUntilMonthEnd, brazilianNationalHolidays, isBusinessDay } from "./business-days";

describe("business day helpers", () => {
  it("excludes Saturday and Sunday", () => {
    expect(isBusinessDay(new Date(2026, 7, 22))).toBe(false);
    expect(isBusinessDay(new Date(2026, 7, 23))).toBe(false);
    expect(isBusinessDay(new Date(2026, 7, 24))).toBe(true);
  });

  it("excludes Brazilian national holidays", () => {
    const holidays = brazilianNationalHolidays(2026);
    expect(isBusinessDay(new Date(2026, 8, 7), holidays)).toBe(false);
    expect(isBusinessDay(new Date(2026, 8, 8), holidays)).toBe(true);
  });

  it("counts only business days through the end of the month", () => {
    expect(businessDaysUntilMonthEnd(new Date(2026, 7, 28))).toBe(1);
    expect(businessDaysUntilMonthEnd(new Date(2026, 7, 27))).toBe(2);
  });
});
