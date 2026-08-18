from pathlib import Path
import re

path = Path('/home/ubuntu/crm-metas-funil/client/src/pages/Home.tsx')
text = path.read_text()
replacement = '''function GoalRow({ goal, funnels, onReorder }: { goal: GoalItem; funnels: SalesFunnel[]; onReorder: (fromId: string, toId: string) => void }) {
  return <div draggable onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", goal.id); }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const fromId = event.dataTransfer.getData("text/plain"); if (fromId) onReorder(fromId, goal.id); }} className="group relative flex min-h-[190px] flex-col justify-between gap-5 rounded-3xl border border-[#E2E9E2] bg-[#FCFCFA] p-5 shadow-[0_10px_24px_rgba(30,55,44,0.04)] transition hover:-translate-y-0.5 hover:border-[#BFD6C8] hover:shadow-[0_16px_32px_rgba(30,55,44,0.08)]">
    <div><div className="mb-1 flex flex-wrap items-center gap-2"><span className="tag-chip">{goal.type}</span><span className="rounded-full bg-[#F0F4F0] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#63736B]">{goal.cadence}</span>{goal.recurring && <span className="rounded-full bg-[#E7F5EF] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#087E5E]">Recorrente</span>}<span className="text-xs text-[#88938E]">{goal.recurring ? periodValueForDate(goal.cadence) : cleanGoalPeriod(goal.period)}</span></div><h3 className="font-display text-base font-bold tracking-[-0.025em] text-[#27302D]">{goal.title}</h3>{goal.linkedStageId && <p className="mt-1 text-[11px] font-semibold text-[#087E5A]">Automática · {funnels.flatMap((funnel) => funnel.stages.map((stage) => funnel.name + " · " + stage.name)).find((label) => label.endsWith(" · " + funnels.flatMap((funnel) => funnel.stages).find((stage) => stage.id === goal.linkedStageId)?.name)) ?? "Etapa do funil"}</p>}</div>
    <div className="flex items-center justify-between gap-3"><div><span className="text-sm font-bold text-[#35403B]">{formatGoalValue(goal.actual, goal.unit)}</span><span className="ml-2 text-xs font-medium text-[#7D8983]">de {formatGoalValue(goal.target, goal.unit)}</span></div><span className="inline-flex items-center gap-1.5 cursor-grab text-xs font-bold uppercase tracking-[0.1em] text-[#A0ACA5]" title="Arraste para reorganizar"><GripVertical size={15} />Mover</span></div>
  </div>;
}'''
pattern = r'function GoalRow\([\s\S]*?\n}\n\nfunction PeopleWorkspace'
updated, count = re.subn(pattern, replacement + '\n\nfunction PeopleWorkspace', text, count=1)
if count != 1:
    raise SystemExit(f'GoalRow block not found or ambiguous: {count}')
path.write_text(updated)
