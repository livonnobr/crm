export type GoalCadence = "Diária" | "Semanal" | "Mensal";

export type GoalPeriodLike = {
  period: string;
  cadence: GoalCadence;
};

export function cleanGoalPeriod(period: string) {
  const clean = period.replace(/^(Diária|Semanal|Mensal)\s*[·|-]\s*/i, "").trim();
  if (/^\d{4}-\d{2}$/.test(clean)) return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(`${clean}-01T12:00:00`));
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(`${clean}T12:00:00`));
  if (/^\d{4}-W\d{2}$/.test(clean)) return `Semana ${clean.slice(6)} de ${clean.slice(0, 4)}`;
  return clean;
}

export function goalPeriodInputValue(goal: GoalPeriodLike) {
  const clean = goal.period.replace(/^(Diária|Semanal|Mensal)\s*[·|-]\s*/i, "").trim();
  if (goal.cadence === "Mensal" && /^\d{4}-\d{2}$/.test(clean)) return clean;
  if (goal.cadence === "Diária" && /^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
  if (goal.cadence === "Semanal" && /^\d{4}-W\d{2}$/.test(clean)) return clean;
  const now = new Date();
  if (goal.cadence === "Mensal") return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  if (goal.cadence === "Diária") return now.toISOString().slice(0, 10);
  const firstDay = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil((((now.getTime() - firstDay.getTime()) / 86400000) + firstDay.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function goalPeriodInputType(cadence: GoalCadence) {
  return cadence === "Mensal" ? "month" : cadence === "Semanal" ? "week" : "date";
}

export function goalPeriodValue(goal: GoalPeriodLike) {
  return `${goal.cadence} · ${cleanGoalPeriod(goal.period)}`;
}

export function periodValueForDate(cadence: GoalCadence, date = new Date()) {
  if (cadence === "Mensal") return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  if (cadence === "Diária") return date.toISOString().slice(0, 10);
  const firstDay = new Date(date.getFullYear(), 0, 1);
  const week = Math.ceil((((date.getTime() - firstDay.getTime()) / 86400000) + firstDay.getDay() + 1) / 7);
  return `${date.getFullYear()}-W${String(week).padStart(2, "0")}`;
}
