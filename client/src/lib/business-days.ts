const easterSunday = (year: number) => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
};

const shiftDays = (date: Date, amount: number) => {
  const shifted = new Date(date);
  shifted.setDate(shifted.getDate() + amount);
  return shifted;
};

const dateKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

export function brazilianNationalHolidays(year: number) {
  const fixed = [
    [0, 1],
    [3, 21],
    [4, 1],
    [8, 7],
    [9, 12],
    [10, 2],
    [10, 15],
    [11, 25],
  ].map(([month, day]) => new Date(year, month, day));
  const easter = easterSunday(year);
  return new Set([
    ...fixed.map(dateKey),
    dateKey(shiftDays(easter, -48)),
    dateKey(shiftDays(easter, -47)),
    dateKey(shiftDays(easter, -2)),
    dateKey(shiftDays(easter, 60)),
  ]);
}

export function isBusinessDay(date: Date, holidays = brazilianNationalHolidays(date.getFullYear())) {
  const day = date.getDay();
  return day !== 0 && day !== 6 && !holidays.has(dateKey(date));
}

export function businessDaysUntilMonthEnd(date = new Date()) {
  const holidays = brazilianNationalHolidays(date.getFullYear());
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  let total = 0;
  for (let cursor = shiftDays(date, 1); cursor <= lastDay; cursor = shiftDays(cursor, 1)) {
    if (isBusinessDay(cursor, holidays)) total += 1;
  }
  return total;
}
