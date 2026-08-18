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
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const daysRemaining = nextDue?.dueDate
    ? Math.round((new Date(`${nextDue.dueDate}T00:00:00`).getTime() - todayStart) / 86400000)
    : null;

  return { total, count: entries.length, nextDue, daysRemaining };
}
