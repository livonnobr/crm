export type FinanceSummaryEntry = {
  amount: number | string;
  dueDate?: string;
  expense?: string;
};

export function summarizeFinanceEntries(entries: FinanceSummaryEntry[], today = new Date()) {
  const total = entries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
  const nextDue = entries
    .filter((entry) => entry.dueDate)
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))[0];
  const daysRemaining = nextDue?.dueDate
    ? Math.ceil((new Date(`${nextDue.dueDate}T23:59:59`).getTime() - today.getTime()) / 86400000)
    : null;

  return { total, count: entries.length, nextDue, daysRemaining };
}
