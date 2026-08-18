import { readFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const workspaceId = process.env.RITMO_WORKSPACE_ID;
const baseDir = "/home/ubuntu/upload";
const year = 2026;

if (!supabaseUrl || !serviceRoleKey || !workspaceId) throw new Error("SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e RITMO_WORKSPACE_ID são obrigatórios");

const headers = { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, "Content-Type": "application/json" };
async function request(pathname, options = {}) {
  const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}${pathname}`, { ...options, headers: { ...headers, ...(options.headers ?? {}) } });
  const text = await response.text();
  let body;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${JSON.stringify(body)}`);
  return body;
}

function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quoted && next === '"') { cell += '"'; i += 1; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (char === "," && !quoted) { row.push(cell); cell = ""; continue; }
    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell); cell = "";
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      continue;
    }
    cell += char;
  }
  if (cell !== "" || row.length) { row.push(cell); if (row.some((value) => value.trim() !== "")) rows.push(row); }
  const [header, ...data] = rows;
  return data.map((values) => Object.fromEntries(header.map((key, index) => [key.trim(), (values[index] ?? "").trim()])));
}

function parseAmount(raw) {
  const value = String(raw ?? "").trim();
  const normalized = value.replace(/R\$\s*/g, "").replace(/\./g, "").replace(",", ".").replace(/[^0-9.-]/g, "");
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : 0;
}

function parseDate(raw) {
  const value = String(raw ?? "").trim();
  const match = value.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/);
  if (!match) return null;
  const [, day, month, explicitYear] = match;
  return `${explicitYear ?? year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function note(...parts) { return parts.map((part) => String(part ?? "").trim()).filter(Boolean).join(" · "); }
function slug(value) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

const sources = [
  { file: "Financeiro-Agosto.csv", kind: "monthly" },
  { file: "Financeiro-Setembro.csv", kind: "monthly" },
  { file: "Financeiro-Outubro.csv", kind: "monthly" },
  { file: "Financeiro-Dívidas.csv", kind: "debts" },
];
const entries = [];
for (const source of sources) {
  const rows = parseCsv(await readFile(path.join(baseDir, source.file), "utf8"));
  rows.forEach((row, index) => {
    const expense = source.kind === "debts" ? row["Débito"] : row["DESPESA"];
    const rawAmount = source.kind === "debts" ? row["Valor"] : row["VALOR"];
    const rawDate = source.kind === "debts" ? row["Data"] : row["DATA"];
    const installment = source.kind === "debts" ? row["Parcela"] : row["PARCELA"];
    const extras = source.kind === "debts" ? note(row["Obeservação"], row[""]) : note(row["FALTAM"]);
    if (!expense) return;
    entries.push({
      id: `csv-${slug(source.file.replace(/\.csv$/i, ""))}-${String(index + 1).padStart(2, "0")}`,
      workspace_id: workspaceId,
      expense,
      amount: parseAmount(rawAmount),
      installment: installment || "",
      due_date: parseDate(rawDate),
      notes: note(`Origem: ${source.file}`, rawAmount && parseAmount(rawAmount) === 0 ? `Valor original: ${rawAmount}` : "", extras),
    });
  });
}

const existing = await request(`/rest/v1/finance_entries?workspace_id=eq.${encodeURIComponent(workspaceId)}&select=id&limit=5000`, { headers: { Accept: "application/json" } });
const existingIds = new Set((existing ?? []).map((entry) => entry.id));
const newEntries = entries.filter((entry) => !existingIds.has(entry.id));
if (newEntries.length) {
  await request("/rest/v1/finance_entries", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(newEntries) });
}
console.log(JSON.stringify({ workspaceId, parsed: entries.length, inserted: newEntries.length, skippedExisting: entries.length - newEntries.length, total: entries.reduce((sum, entry) => sum + entry.amount, 0), nonMonetary: entries.filter((entry) => entry.amount === 0).length }));
