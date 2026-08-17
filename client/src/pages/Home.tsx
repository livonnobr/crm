/**
 * Oficina de Receita — página principal do CRM Ritmo.
 * Estilo: minimalismo tátil contemporâneo, superfícies marfim, grafite e Verde Ritmo.
 * O layout usa um trilho operacional lateral e uma bancada horizontal de oportunidades.
 */
import { useEffect, useMemo, useState, type DragEvent, type FormEvent } from "react";
import {
  Activity,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  Calendar,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  CirclePlus,
  Clock3,
  Filter,
  GitBranch,
  GripVertical,
  Layers,
  Menu,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingUp,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Page = "goals" | "pipeline";
type GoalType = "Prospecção" | "Vendas";
type GoalUnit = "atividades" | "R$";

type GoalItem = {
  id: string;
  title: string;
  type: GoalType;
  target: number;
  actual: number;
  unit: GoalUnit;
  period: string;
  color: "emerald" | "blue" | "amber" | "violet";
};

type Stage = {
  id: string;
  name: string;
  color: string;
  probability: number;
};

type SalesFunnel = {
  id: string;
  name: string;
  currency: string;
  stages: Stage[];
};

type Deal = {
  id: string;
  title: string;
  company: string;
  value: number;
  owner: string;
  stageId: string;
  tag: string;
  nextActivity: string;
};

const logoUrl = "/manus-storage/ritmo-mark_6ae0770d.png";
const heroUrl = "/manus-storage/ritmo-performance-hero_b5169baf.jpg";
const goalsArtUrl = "/manus-storage/ritmo-goals-sculpture_afb88e12.jpg";
const funnelArtUrl = "/manus-storage/ritmo-funnel-flow_c91b3f8a.jpg";

const initialGoals: GoalItem[] = [
  {
    id: "goal-prospect",
    title: "Novas conversas qualificadas",
    type: "Prospecção",
    target: 80,
    actual: 51,
    unit: "atividades",
    period: "Agosto 2026",
    color: "emerald",
  },
  {
    id: "goal-revenue",
    title: "Receita em novas vendas",
    type: "Vendas",
    target: 120000,
    actual: 74800,
    unit: "R$",
    period: "Agosto 2026",
    color: "blue",
  },
  {
    id: "goal-demo",
    title: "Demonstrações agendadas",
    type: "Prospecção",
    target: 24,
    actual: 19,
    unit: "atividades",
    period: "Agosto 2026",
    color: "amber",
  },
];

const initialFunnels: SalesFunnel[] = [
  {
    id: "primary-funnel",
    name: "Novos negócios",
    currency: "BRL",
    stages: [
      { id: "lead", name: "Entrada", color: "#77918B", probability: 15 },
      { id: "discovery", name: "Diagnóstico", color: "#5B8CB2", probability: 35 },
      { id: "proposal", name: "Proposta", color: "#B07D3A", probability: 60 },
      { id: "negotiation", name: "Negociação", color: "#8A70A4", probability: 80 },
      { id: "won", name: "Ganho", color: "#10A97A", probability: 100 },
    ],
  },
];

const initialDeals: Deal[] = [
  {
    id: "deal-1",
    title: "Expansão da operação comercial",
    company: "Mare Alta",
    value: 28000,
    owner: "AR",
    stageId: "lead",
    tag: "Inbound",
    nextActivity: "Hoje, 16:30",
  },
  {
    id: "deal-2",
    title: "Automação de prospecção",
    company: "Nativa Labs",
    value: 17500,
    owner: "CB",
    stageId: "lead",
    tag: "Indicação",
    nextActivity: "Amanhã",
  },
  {
    id: "deal-3",
    title: "CRM para time regional",
    company: "Vértice Log",
    value: 43000,
    owner: "AR",
    stageId: "discovery",
    tag: "Outbound",
    nextActivity: "Qua, 09:00",
  },
  {
    id: "deal-4",
    title: "Organização da operação SDR",
    company: "Horizonte",
    value: 12000,
    owner: "LM",
    stageId: "proposal",
    tag: "Inbound",
    nextActivity: "Enviar retorno",
  },
  {
    id: "deal-5",
    title: "Inteligência de receita",
    company: "Aurora Saúde",
    value: 56000,
    owner: "CB",
    stageId: "negotiation",
    tag: "Enterprise",
    nextActivity: "Sex, 14:00",
  },
  {
    id: "deal-6",
    title: "Central de metas",
    company: "Atelier Norte",
    value: 9400,
    owner: "LM",
    stageId: "won",
    tag: "Inbound",
    nextActivity: "Concluído",
  },
];

const blankGoal: GoalItem = {
  id: "",
  title: "",
  type: "Prospecção",
  target: 0,
  actual: 0,
  unit: "atividades",
  period: "Agosto 2026",
  color: "emerald",
};

const blankDeal: Deal = {
  id: "",
  title: "",
  company: "",
  value: 0,
  owner: "AR",
  stageId: "",
  tag: "Inbound",
  nextActivity: "",
};

function storedValue<T>(key: string, fallback: T): T {
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatGoalValue(value: number, unit: GoalUnit) {
  return unit === "R$" ? formatCurrency(value) : new Intl.NumberFormat("pt-BR").format(value);
}

function progressOf(goal: GoalItem) {
  return Math.min(100, Math.round((goal.actual / Math.max(goal.target, 1)) * 100));
}

function uniqueId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function Home() {
  const [page, setPage] = useState<Page>(() => new URLSearchParams(window.location.search).get("aba") === "funil" ? "pipeline" : "goals");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [goals, setGoals] = useState<GoalItem[]>(() => storedValue("ritmo-goals", initialGoals));
  const [funnels, setFunnels] = useState<SalesFunnel[]>(() => storedValue("ritmo-funnels", initialFunnels));
  const [deals, setDeals] = useState<Deal[]>(() => storedValue("ritmo-deals", initialDeals));
  const [activeFunnelId, setActiveFunnelId] = useState(() => storedValue("ritmo-active-funnel", "primary-funnel"));
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [goalDraft, setGoalDraft] = useState<GoalItem>(blankGoal);
  const [dealDialogOpen, setDealDialogOpen] = useState(false);
  const [dealDraft, setDealDraft] = useState<Deal>(blankDeal);
  const [funnelDialogOpen, setFunnelDialogOpen] = useState(false);
  const [isFunnelEditing, setIsFunnelEditing] = useState(false);
  const [funnelDraftName, setFunnelDraftName] = useState("");
  const [stageDialogOpen, setStageDialogOpen] = useState(false);
  const [stageDraft, setStageDraft] = useState<Stage>({ id: "", name: "", color: "#10A97A", probability: 20 });
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  const [overStageId, setOverStageId] = useState<string | null>(null);

  useEffect(() => {
    window.localStorage.setItem("ritmo-goals", JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    window.localStorage.setItem("ritmo-funnels", JSON.stringify(funnels));
  }, [funnels]);

  useEffect(() => {
    window.localStorage.setItem("ritmo-deals", JSON.stringify(deals));
  }, [deals]);

  useEffect(() => {
    window.localStorage.setItem("ritmo-active-funnel", activeFunnelId);
  }, [activeFunnelId]);

  const activeFunnel = funnels.find((funnel) => funnel.id === activeFunnelId) ?? funnels[0];
  const filteredDeals = useMemo(
    () => deals.filter((deal) => activeFunnel?.stages.some((stage) => stage.id === deal.stageId)),
    [activeFunnel, deals],
  );

  const totalPipeline = filteredDeals.reduce((sum, deal) => sum + deal.value, 0);
  const weightedPipeline = filteredDeals.reduce((sum, deal) => {
    const stage = activeFunnel?.stages.find((item) => item.id === deal.stageId);
    return sum + deal.value * ((stage?.probability ?? 0) / 100);
  }, 0);
  const achievedRevenue = goals
    .filter((goal) => goal.unit === "R$")
    .reduce((sum, goal) => sum + goal.actual, 0);
  const averageGoalProgress = goals.length ? Math.round(goals.reduce((sum, goal) => sum + progressOf(goal), 0) / goals.length) : 0;

  function selectPage(nextPage: Page) {
    setPage(nextPage);
    setIsMobileNavOpen(false);
  }

  function openNewGoal() {
    setGoalDraft({ ...blankGoal, id: "" });
    setGoalDialogOpen(true);
  }

  function openEditGoal(goal: GoalItem) {
    setGoalDraft(goal);
    setGoalDialogOpen(true);
  }

  function saveGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!goalDraft.title.trim() || goalDraft.target <= 0) {
      toast.error("Dê um nome e um objetivo válido para a meta.");
      return;
    }
    if (goalDraft.id) {
      setGoals((current) => current.map((goal) => (goal.id === goalDraft.id ? goalDraft : goal)));
      toast.success("Meta atualizada.");
    } else {
      setGoals((current) => [{ ...goalDraft, id: uniqueId("goal") }, ...current]);
      toast.success("Meta criada e adicionada ao seu ritmo.");
    }
    setGoalDialogOpen(false);
  }

  function deleteGoal(goalId: string) {
    setGoals((current) => current.filter((goal) => goal.id !== goalId));
    toast.success("Meta removida.");
  }

  function openNewDeal() {
    const stageId = activeFunnel?.stages[0]?.id ?? "";
    setDealDraft({ ...blankDeal, stageId });
    setDealDialogOpen(true);
  }

  function openEditDeal(deal: Deal) {
    setDealDraft(deal);
    setDealDialogOpen(true);
  }

  function saveDeal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dealDraft.title.trim() || !dealDraft.company.trim() || dealDraft.value <= 0 || !dealDraft.stageId) {
      toast.error("Preencha oportunidade, organização, valor e etapa.");
      return;
    }
    if (dealDraft.id) {
      setDeals((current) => current.map((deal) => (deal.id === dealDraft.id ? dealDraft : deal)));
      toast.success("Oportunidade atualizada.");
    } else {
      setDeals((current) => [{ ...dealDraft, id: uniqueId("deal") }, ...current]);
      toast.success("Oportunidade criada.");
    }
    setDealDialogOpen(false);
  }

  function deleteDeal(dealId: string) {
    setDeals((current) => current.filter((deal) => deal.id !== dealId));
    setDealDialogOpen(false);
    toast.success("Oportunidade removida.");
  }

  function moveDeal(stageId: string) {
    if (!draggedDealId || draggedDealId === stageId) return;
    setDeals((current) => current.map((deal) => (deal.id === draggedDealId ? { ...deal, stageId } : deal)));
    setDraggedDealId(null);
    setOverStageId(null);
    const targetStage = activeFunnel?.stages.find((stage) => stage.id === stageId);
    toast.success(`Oportunidade movida para ${targetStage?.name ?? "a etapa"}.`);
  }

  function startDrag(event: DragEvent<HTMLElement>, dealId: string) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", dealId);
    setDraggedDealId(dealId);
  }

  function allowDrop(event: DragEvent<HTMLElement>, stageId: string) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setOverStageId(stageId);
  }

  function openNewFunnel() {
    setFunnelDraftName("");
    setIsFunnelEditing(false);
    setFunnelDialogOpen(true);
  }

  function openEditFunnel() {
    setFunnelDraftName(activeFunnel?.name ?? "");
    setIsFunnelEditing(true);
    setFunnelDialogOpen(true);
  }

  function saveFunnel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = funnelDraftName.trim();
    if (!name) {
      toast.error("Dê um nome ao funil.");
      return;
    }
    if (isFunnelEditing && activeFunnel && funnelDraftName === activeFunnel.name) {
      setFunnelDialogOpen(false);
      return;
    }
    if (isFunnelEditing && activeFunnel?.name) {
      setFunnels((current) => current.map((funnel) => (funnel.id === activeFunnelId ? { ...funnel, name } : funnel)));
      toast.success("Funil renomeado.");
    } else {
      const newFunnelId = uniqueId("funnel");
      const stages: Stage[] = [
        { id: `${newFunnelId}-entry`, name: "Entrada", color: "#77918B", probability: 15 },
        { id: `${newFunnelId}-discovery`, name: "Diagnóstico", color: "#5B8CB2", probability: 35 },
        { id: `${newFunnelId}-proposal`, name: "Proposta", color: "#B07D3A", probability: 60 },
        { id: `${newFunnelId}-won`, name: "Ganho", color: "#10A97A", probability: 100 },
      ];
      setFunnels((current) => [...current, { id: newFunnelId, name, currency: "BRL", stages }]);
      setActiveFunnelId(newFunnelId);
      toast.success("Novo funil criado.");
    }
    setFunnelDialogOpen(false);
  }

  function deleteActiveFunnel() {
    if (!activeFunnel || funnels.length === 1) {
      toast.error("Mantenha pelo menos um funil na sua operação.");
      return;
    }
    setDeals((current) => current.filter((deal) => !activeFunnel.stages.some((stage) => stage.id === deal.stageId)));
    setFunnels((current) => current.filter((funnel) => funnel.id !== activeFunnelId));
    const nextFunnel = funnels.find((funnel) => funnel.id !== activeFunnelId);
    if (nextFunnel) setActiveFunnelId(nextFunnel.id);
    setFunnelDialogOpen(false);
    toast.success("Funil removido.");
  }

  function openNewStage() {
    setStageDraft({ id: "", name: "", color: "#10A97A", probability: 50 });
    setStageDialogOpen(true);
  }

  function openEditStage(stage: Stage) {
    setStageDraft(stage);
    setStageDialogOpen(true);
  }

  function saveStage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeFunnel || !stageDraft.name.trim()) {
      toast.error("Dê um nome à etapa.");
      return;
    }
    const preparedStage = { ...stageDraft, id: stageDraft.id || uniqueId("stage") };
    setFunnels((current) =>
      current.map((funnel) => {
        if (funnel.id !== activeFunnel.id) return funnel;
        const exists = funnel.stages.some((stage) => stage.id === preparedStage.id);
        return {
          ...funnel,
          stages: exists
            ? funnel.stages.map((stage) => (stage.id === preparedStage.id ? preparedStage : stage))
            : [...funnel.stages, preparedStage],
        };
      }),
    );
    setStageDialogOpen(false);
    toast.success(stageDraft.id ? "Etapa atualizada." : "Etapa adicionada ao funil.");
  }

  function deleteStage() {
    if (!activeFunnel || !stageDraft.id || activeFunnel.stages.length <= 2) {
      toast.error("Mantenha ao menos duas etapas no funil.");
      return;
    }
    const fallbackStage = activeFunnel.stages.find((stage) => stage.id !== stageDraft.id);
    setDeals((current) => current.map((deal) => (deal.stageId === stageDraft.id ? { ...deal, stageId: fallbackStage?.id ?? deal.stageId } : deal)));
    setFunnels((current) =>
      current.map((funnel) => (funnel.id === activeFunnel.id ? { ...funnel, stages: funnel.stages.filter((stage) => stage.id !== stageDraft.id) } : funnel)),
    );
    setStageDialogOpen(false);
    toast.success("Etapa removida; oportunidades foram realocadas.");
  }

  const sidebarContent = (
    <>
      <div className="flex items-center gap-3 px-3 pb-8 pt-2">
        <img className="h-10 w-10 rounded-xl object-cover shadow-[0_10px_22px_rgba(16,169,122,0.18)]" src={logoUrl} alt="Símbolo Ritmo" />
        <div>
          <div className="font-display text-[22px] font-extrabold leading-none tracking-[-0.06em] text-[#17201e]">ritmo</div>
          <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A9792]">receita em foco</div>
        </div>
        <button className="ml-auto md:hidden" onClick={() => setIsMobileNavOpen(false)} aria-label="Fechar menu">
          <X className="h-5 w-5 text-[#53615E]" />
        </button>
      </div>

      <nav className="space-y-1" aria-label="Navegação principal">
        <SidebarItem icon={<Target size={19} />} label="Metas" active={page === "goals"} onClick={() => selectPage("goals")} />
        <SidebarItem icon={<GitBranch size={19} />} label="Funil de vendas" active={page === "pipeline"} onClick={() => selectPage("pipeline")} />
        <SidebarItem icon={<Users size={19} />} label="Pessoas" onClick={() => toast.info("Pessoas entra na próxima etapa do CRM.")} />
        <SidebarItem icon={<Calendar size={19} />} label="Atividades" onClick={() => toast.info("Atividades entra na próxima etapa do CRM.")} />
      </nav>

      <div className="mt-10 px-3">
        <p className="px-3 pb-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#9AA59F]">Visões</p>
        <button onClick={() => toast.info("Relatórios será conectado quando a base Supabase estiver ativa.")} className="sidebar-link w-full">
          <Activity size={18} />
          <span>Ritmo do mês</span>
        </button>
        <button onClick={() => toast.info("Configurações estará disponível em breve.")} className="sidebar-link w-full">
          <Settings size={18} />
          <span>Configurações</span>
        </button>
      </div>

      <div className="mt-auto rounded-2xl bg-[#E8F6F0] p-4">
        <div className="mb-3 flex items-center gap-2 text-[#087E5A]">
          <Sparkles size={16} />
          <span className="text-xs font-extrabold">Pulso comercial</span>
        </div>
        <p className="text-xs font-medium leading-5 text-[#315C4D]">Sua cadência está <strong>18% à frente</strong> do planejado.</p>
        <button onClick={() => setPage("goals")} className="mt-3 flex items-center gap-1 text-xs font-bold text-[#087E5A]">
          Ver metas <ArrowUpRight size={13} />
        </button>
      </div>

      <div className="mt-5 flex items-center gap-3 px-3 pt-4">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-[#18201E] text-xs font-bold text-white">AR</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-[#27302D]">Ana Ribeiro</p>
          <p className="text-xs text-[#87928D]">Comercial</p>
        </div>
        <ChevronDown className="h-4 w-4 text-[#87928D]" />
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#F6F5F1] text-[#1B2522]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[250px] flex-col border-r border-[#E3E6E0] bg-[#FBFBF9] px-4 py-6 md:flex">
        {sidebarContent}
      </aside>

      <div className="fixed inset-x-0 top-0 z-20 flex h-[68px] items-center justify-between border-b border-[#E3E6E0] bg-[#FBFBF9]/95 px-4 backdrop-blur md:hidden">
        <button onClick={() => setIsMobileNavOpen(true)} className="grid h-10 w-10 place-items-center rounded-xl border border-[#E3E6E0] bg-white" aria-label="Abrir menu">
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <img className="h-8 w-8 rounded-lg" src={logoUrl} alt="" />
          <span className="font-display text-lg font-extrabold tracking-[-0.06em]">ritmo</span>
        </div>
        <button onClick={page === "goals" ? openNewGoal : openNewDeal} className="grid h-10 w-10 place-items-center rounded-xl bg-[#10A97A] text-white" aria-label="Criar">
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {isMobileNavOpen && (
        <div className="fixed inset-0 z-40 bg-[#17201E]/30 backdrop-blur-sm md:hidden" onClick={() => setIsMobileNavOpen(false)}>
          <aside className="flex h-full w-[280px] flex-col bg-[#FBFBF9] p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            {sidebarContent}
          </aside>
        </div>
      )}

      <main className="min-h-screen md:ml-[250px]">
        {page === "goals" ? (
          <GoalsWorkspace
            goals={goals}
            achievedRevenue={achievedRevenue}
            averageGoalProgress={averageGoalProgress}
            onNewGoal={openNewGoal}
            onEditGoal={openEditGoal}
            onDeleteGoal={deleteGoal}
          />
        ) : (
          <PipelineWorkspace
            funnels={funnels}
            activeFunnel={activeFunnel}
            activeFunnelId={activeFunnelId}
            deals={filteredDeals}
            totalPipeline={totalPipeline}
            weightedPipeline={weightedPipeline}
            draggedDealId={draggedDealId}
            overStageId={overStageId}
            onSelectFunnel={setActiveFunnelId}
            onNewFunnel={openNewFunnel}
            onEditFunnel={openEditFunnel}
            onNewDeal={openNewDeal}
            onEditDeal={openEditDeal}
            onNewStage={openNewStage}
            onEditStage={openEditStage}
            onDragStart={startDrag}
            onDrop={moveDeal}
            onDragOver={allowDrop}
            onDragEnd={() => {
              setDraggedDealId(null);
              setOverStageId(null);
            }}
          />
        )}
      </main>

      <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
        <DialogContent className="max-w-[520px] border-[#E2E7E0] bg-[#FCFCFA] p-0">
          <div className="border-b border-[#E8ECE6] px-6 py-5">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl tracking-[-0.04em]">{goalDraft.id ? "Editar meta" : "Criar nova meta"}</DialogTitle>
              <DialogDescription>Defina o resultado que orientará a sua cadência no período.</DialogDescription>
            </DialogHeader>
          </div>
          <form onSubmit={saveGoal} className="space-y-5 px-6 py-6">
            <FormField label="Nome da meta"><Input value={goalDraft.title} onChange={(event) => setGoalDraft({ ...goalDraft, title: event.target.value })} placeholder="Ex.: Propostas enviadas" /></FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Tipo">
                <select className="form-select" value={goalDraft.type} onChange={(event) => setGoalDraft({ ...goalDraft, type: event.target.value as GoalType })}>
                  <option>Prospecção</option><option>Vendas</option>
                </select>
              </FormField>
              <FormField label="Unidade">
                <select className="form-select" value={goalDraft.unit} onChange={(event) => setGoalDraft({ ...goalDraft, unit: event.target.value as GoalUnit })}>
                  <option value="atividades">Atividades</option><option value="R$">R$ (receita)</option>
                </select>
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Objetivo"><Input min="1" type="number" value={goalDraft.target || ""} onChange={(event) => setGoalDraft({ ...goalDraft, target: Number(event.target.value) })} placeholder="0" /></FormField>
              <FormField label="Realizado até agora"><Input min="0" type="number" value={goalDraft.actual || ""} onChange={(event) => setGoalDraft({ ...goalDraft, actual: Number(event.target.value) })} placeholder="0" /></FormField>
            </div>
            <FormField label="Período"><Input value={goalDraft.period} onChange={(event) => setGoalDraft({ ...goalDraft, period: event.target.value })} placeholder="Agosto 2026" /></FormField>
            <div className="flex items-center justify-between border-t border-[#E8ECE6] pt-5">
              {goalDraft.id ? <button type="button" onClick={() => deleteGoal(goalDraft.id)} className="inline-flex items-center gap-2 text-sm font-bold text-[#B04A43]"><Trash2 size={16} />Excluir</button> : <span />}
              <div className="flex gap-2"><Button type="button" variant="outline" onClick={() => setGoalDialogOpen(false)}>Cancelar</Button><Button type="submit" className="bg-[#10A97A] hover:bg-[#087E5A]">Salvar meta</Button></div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={dealDialogOpen} onOpenChange={setDealDialogOpen}>
        <DialogContent className="max-w-[560px] border-[#E2E7E0] bg-[#FCFCFA] p-0">
          <div className="border-b border-[#E8ECE6] px-6 py-5">
            <DialogHeader><DialogTitle className="font-display text-2xl tracking-[-0.04em]">{dealDraft.id ? "Editar oportunidade" : "Nova oportunidade"}</DialogTitle><DialogDescription>Registre o próximo movimento de receita e mantenha o funil atualizado.</DialogDescription></DialogHeader>
          </div>
          <form onSubmit={saveDeal} className="space-y-5 px-6 py-6">
            <FormField label="Oportunidade"><Input value={dealDraft.title} onChange={(event) => setDealDraft({ ...dealDraft, title: event.target.value })} placeholder="Ex.: Projeto de expansão" /></FormField>
            <div className="grid grid-cols-2 gap-4"><FormField label="Organização"><Input value={dealDraft.company} onChange={(event) => setDealDraft({ ...dealDraft, company: event.target.value })} placeholder="Nome da empresa" /></FormField><FormField label="Valor estimado"><Input type="number" min="1" value={dealDraft.value || ""} onChange={(event) => setDealDraft({ ...dealDraft, value: Number(event.target.value) })} placeholder="0" /></FormField></div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Etapa"><select className="form-select" value={dealDraft.stageId} onChange={(event) => setDealDraft({ ...dealDraft, stageId: event.target.value })}>{activeFunnel?.stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}</select></FormField>
              <FormField label="Responsável"><select className="form-select" value={dealDraft.owner} onChange={(event) => setDealDraft({ ...dealDraft, owner: event.target.value })}><option>AR</option><option>CB</option><option>LM</option></select></FormField>
            </div>
            <div className="grid grid-cols-2 gap-4"><FormField label="Origem / rótulo"><Input value={dealDraft.tag} onChange={(event) => setDealDraft({ ...dealDraft, tag: event.target.value })} placeholder="Inbound" /></FormField><FormField label="Próxima atividade"><Input value={dealDraft.nextActivity} onChange={(event) => setDealDraft({ ...dealDraft, nextActivity: event.target.value })} placeholder="Ex.: Hoje, 16:00" /></FormField></div>
            <div className="flex items-center justify-between border-t border-[#E8ECE6] pt-5">
              {dealDraft.id ? <button type="button" onClick={() => deleteDeal(dealDraft.id)} className="inline-flex items-center gap-2 text-sm font-bold text-[#B04A43]"><Trash2 size={16} />Excluir</button> : <span />}
              <div className="flex gap-2"><Button type="button" variant="outline" onClick={() => setDealDialogOpen(false)}>Cancelar</Button><Button type="submit" className="bg-[#10A97A] hover:bg-[#087E5A]">Salvar oportunidade</Button></div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={funnelDialogOpen} onOpenChange={setFunnelDialogOpen}>
        <DialogContent className="max-w-[460px] border-[#E2E7E0] bg-[#FCFCFA] p-0">
          <div className="border-b border-[#E8ECE6] px-6 py-5"><DialogHeader><DialogTitle className="font-display text-2xl tracking-[-0.04em]">{isFunnelEditing ? "Editar funil" : "Criar funil"}</DialogTitle><DialogDescription>Organize oportunidades por uma jornada comercial própria.</DialogDescription></DialogHeader></div>
          <form onSubmit={saveFunnel} className="space-y-6 px-6 py-6"><FormField label="Nome do funil"><Input autoFocus value={funnelDraftName} onChange={(event) => setFunnelDraftName(event.target.value)} placeholder="Ex.: Parcerias" /></FormField><div className="flex items-center justify-between border-t border-[#E8ECE6] pt-5">{isFunnelEditing ? <button onClick={deleteActiveFunnel} type="button" className="inline-flex items-center gap-2 text-sm font-bold text-[#B04A43]"><Trash2 size={16} />Excluir</button> : <span />}<div className="flex gap-2"><Button type="button" variant="outline" onClick={() => setFunnelDialogOpen(false)}>Cancelar</Button><Button type="submit" className="bg-[#10A97A] hover:bg-[#087E5A]">Salvar</Button></div></div></form>
        </DialogContent>
      </Dialog>

      <Dialog open={stageDialogOpen} onOpenChange={setStageDialogOpen}>
        <DialogContent className="max-w-[460px] border-[#E2E7E0] bg-[#FCFCFA] p-0">
          <div className="border-b border-[#E8ECE6] px-6 py-5"><DialogHeader><DialogTitle className="font-display text-2xl tracking-[-0.04em]">{stageDraft.id ? "Editar etapa" : "Adicionar etapa"}</DialogTitle><DialogDescription>Defina o peso e a identidade visual desta etapa do funil.</DialogDescription></DialogHeader></div>
          <form onSubmit={saveStage} className="space-y-5 px-6 py-6"><FormField label="Nome da etapa"><Input value={stageDraft.name} onChange={(event) => setStageDraft({ ...stageDraft, name: event.target.value })} placeholder="Ex.: Validação" /></FormField><div className="grid grid-cols-2 gap-4"><FormField label="Probabilidade (%)"><Input type="number" min="0" max="100" value={stageDraft.probability} onChange={(event) => setStageDraft({ ...stageDraft, probability: Number(event.target.value) })} /></FormField><FormField label="Cor de sinal"><Input type="color" className="h-10 p-1" value={stageDraft.color} onChange={(event) => setStageDraft({ ...stageDraft, color: event.target.value })} /></FormField></div><div className="flex items-center justify-between border-t border-[#E8ECE6] pt-5">{stageDraft.id ? <button onClick={deleteStage} type="button" className="inline-flex items-center gap-2 text-sm font-bold text-[#B04A43]"><Trash2 size={16} />Excluir</button> : <span />}<div className="flex gap-2"><Button type="button" variant="outline" onClick={() => setStageDialogOpen(false)}>Cancelar</Button><Button type="submit" className="bg-[#10A97A] hover:bg-[#087E5A]">Salvar etapa</Button></div></div></form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SidebarItem({ icon, label, active = false, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={`sidebar-link w-full ${active ? "sidebar-link-active" : ""}`}>{icon}<span>{label}</span>{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#10A97A]" />}</button>;
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#63706B]">{label}</Label>{children}</div>;
}

function GoalsWorkspace({ goals, achievedRevenue, averageGoalProgress, onNewGoal, onEditGoal, onDeleteGoal }: { goals: GoalItem[]; achievedRevenue: number; averageGoalProgress: number; onNewGoal: () => void; onEditGoal: (goal: GoalItem) => void; onDeleteGoal: (id: string) => void }) {
  return (
    <div className="pt-[68px] md:pt-0">
      <header className="flex min-h-[116px] items-center justify-between px-5 py-6 md:px-10">
        <div><p className="eyebrow">Plano de agosto <span className="mx-1 text-[#10A97A]">•</span> ciclo em andamento</p><h1 className="page-title">Metas <span className="text-[#10A97A]">em movimento</span></h1></div>
        <div className="hidden items-center gap-3 sm:flex"><button className="tool-button" onClick={() => toast.info("Busca global entra na próxima versão.")}><Search size={18} /><span>Buscar</span></button><Button onClick={onNewGoal} className="h-11 gap-2 rounded-xl bg-[#10A97A] px-5 font-bold hover:bg-[#087E5A]"><Plus size={18} />Nova meta</Button></div>
      </header>

      <div className="px-5 pb-12 md:px-10">
        <section className="instrument-strip" aria-label="Instrumentos de acompanhamento comercial">
          {goals.slice(0, 3).map((goal, index) => {
            const progress = progressOf(goal);
            const remaining = Math.max(goal.target - goal.actual, 0);
            return <div key={goal.id} className="instrument-cell"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="pulse-dot" /><span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#6F7D76]">{goal.type}</span></div><span className="text-xs font-extrabold text-[#087E5A]">{progress}%</span></div><p className="mt-3 truncate text-xs font-bold text-[#6C7A73]">{goal.title}</p><p className="mt-0.5 font-display text-[24px] font-extrabold tracking-[-0.06em] text-[#1B2522]">{formatGoalValue(goal.actual, goal.unit)}<span className="ml-1 text-sm font-bold text-[#85918B]">/ {formatGoalValue(goal.target, goal.unit)}</span></p><p className="mt-2 text-[11px] font-medium text-[#85918B]">Faltam {formatGoalValue(remaining, goal.unit)}</p>{index < 2 && <span className="instrument-divider" />}</div>;
          })}
          {goals.length === 0 && <button onClick={onNewGoal} className="flex items-center gap-2 text-sm font-bold text-[#087E5A]"><CirclePlus size={18} />Criar primeiro instrumento</button>}
        </section>
        <section className="hero-panel mt-5 overflow-hidden">
          <img src={heroUrl} alt="Caminho abstrato em ascensão representando avanço comercial" className="absolute inset-0 h-full w-full object-cover opacity-75" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,30,27,0.96)_0%,rgba(18,30,27,0.86)_45%,rgba(18,30,27,0.28)_100%)]" />
          <div className="relative z-10 max-w-[680px] px-6 py-7 sm:px-9 sm:py-8">
            <div className="mb-7 flex items-center gap-2 text-[#A7E8D1]"><span className="pulse-dot" /><span className="text-xs font-bold uppercase tracking-[0.16em]">Ritmo do mês</span></div>
            <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end"><div><h2 className="font-display text-3xl font-extrabold tracking-[-0.05em] text-white sm:text-[35px]">Cadência saudável.<br /><span className="text-[#8DE2C4]">Foco no que aproxima.</span></h2><p className="mt-3 max-w-md text-sm leading-6 text-[#C7D5D0]">Você está sustentando o volume de prospecção e acelerando negociações na hora certa.</p></div><div className="min-w-[155px] rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#B8CEC6]">Progresso médio</p><div className="mt-2 flex items-baseline gap-1"><strong className="font-display text-4xl tracking-[-0.06em] text-white">{averageGoalProgress}</strong><span className="font-bold text-[#8DE2C4]">%</span></div><p className="mt-2 text-xs text-[#D3E3DD]">das metas em curso</p></div></div>
          </div>
        </section>

        <section className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="surface-panel p-4 sm:p-6">
            <div className="mb-5 flex items-end justify-between gap-3"><div><p className="eyebrow">Acompanhamento</p><h2 className="section-title">O que move sua receita</h2></div><button onClick={onNewGoal} className="hidden items-center gap-1 text-sm font-bold text-[#087E5A] hover:text-[#056448] sm:flex">Adicionar <ChevronRight size={16} /></button></div>
            <div className="space-y-3">
              {goals.map((goal) => <GoalRow key={goal.id} goal={goal} onEdit={() => onEditGoal(goal)} onDelete={() => onDeleteGoal(goal.id)} />)}
              {goals.length === 0 && <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-[#D6DED8] bg-[#FAFBF9] p-6 text-center"><Target className="mb-2 h-6 w-6 text-[#10A97A]" /><div><p className="font-bold">Ainda não há metas</p><p className="mt-1 text-sm text-[#718078]">Crie uma meta de prospecção ou vendas para começar.</p></div></div>}
            </div>
          </div>
          <aside className="relative min-h-[280px] overflow-hidden rounded-3xl border border-[#DCE3DD] bg-[#EDF2EE] p-6">
            <img src={goalsArtUrl} alt="Instrumento abstrato de medição de metas" className="absolute inset-0 h-full w-full object-cover opacity-70 mix-blend-multiply" />
            <div className="relative z-10 flex h-full flex-col"><div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#D4DED6] bg-[#F9FAF7]/90 px-3 py-1.5 text-xs font-bold text-[#52635B]"><TrendingUp size={14} className="text-[#10A97A]" />Receita realizada</div><div className="mt-auto"><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#5B7066]">Meta em vendas</p><p className="mt-2 font-display text-[42px] font-extrabold tracking-[-0.07em] text-[#18201E]">{formatCurrency(achievedRevenue)}</p><p className="mt-1 text-sm font-medium text-[#55675F]">soma do realizado neste período</p><button onClick={onNewGoal} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#18201E] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#087E5A]">Definir meta <ArrowUpRight size={15} /></button></div></div>
          </aside>
        </section>
      </div>
    </div>
  );
}

function GoalRow({ goal, onEdit, onDelete }: { goal: GoalItem; onEdit: () => void; onDelete: () => void }) {
  const progress = progressOf(goal);
  const styles = { emerald: "bg-[#10A97A]", blue: "bg-[#4386B6]", amber: "bg-[#D8952E]", violet: "bg-[#9075B5]" };
  return <div className="group grid gap-4 rounded-2xl border border-[#E7EBE6] bg-[#FCFCFA] p-4 transition hover:-translate-y-0.5 hover:border-[#C9D8D0] hover:shadow-[0_12px_28px_rgba(30,55,44,0.05)] sm:grid-cols-[auto_minmax(190px,1fr)_minmax(175px,0.6fr)_auto] sm:items-center"><div className="goal-meter" style={{ "--progress": `${progress * 3.6}deg` } as React.CSSProperties}><span>{progress}%</span></div><div><div className="mb-1 flex flex-wrap items-center gap-2"><span className="tag-chip">{goal.type}</span><span className="text-xs text-[#88938E]">{goal.period}</span></div><h3 className="font-display text-base font-bold tracking-[-0.025em] text-[#27302D]">{goal.title}</h3></div><div><div className="mb-2 flex items-baseline justify-between gap-2"><span className="text-sm font-bold text-[#35403B]">{formatGoalValue(goal.actual, goal.unit)}</span><span className="text-xs font-medium text-[#7D8983]">de {formatGoalValue(goal.target, goal.unit)}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[#E8ECE7]"><div className={`h-full rounded-full ${styles[goal.color]}`} style={{ width: `${progress}%` }} /></div></div><div className="flex justify-end gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100"><button onClick={onEdit} className="icon-button" aria-label={`Editar ${goal.title}`}><Pencil size={15} /></button><button onClick={onDelete} className="icon-button hover:text-[#B04A43]" aria-label={`Excluir ${goal.title}`}><Trash2 size={15} /></button></div></div>;
}

function PipelineWorkspace({ funnels, activeFunnel, activeFunnelId, deals, totalPipeline, weightedPipeline, draggedDealId, overStageId, onSelectFunnel, onNewFunnel, onEditFunnel, onNewDeal, onEditDeal, onNewStage, onEditStage, onDragStart, onDrop, onDragOver, onDragEnd }: { funnels: SalesFunnel[]; activeFunnel?: SalesFunnel; activeFunnelId: string; deals: Deal[]; totalPipeline: number; weightedPipeline: number; draggedDealId: string | null; overStageId: string | null; onSelectFunnel: (id: string) => void; onNewFunnel: () => void; onEditFunnel: () => void; onNewDeal: () => void; onEditDeal: (deal: Deal) => void; onNewStage: () => void; onEditStage: (stage: Stage) => void; onDragStart: (event: DragEvent<HTMLElement>, dealId: string) => void; onDrop: (stageId: string) => void; onDragOver: (event: DragEvent<HTMLElement>, stageId: string) => void; onDragEnd: () => void }) {
  return <div className="pipeline-shell pt-[68px] md:pt-0"><header className="border-b border-[#E2E7E1] bg-[#FBFBF9] px-5 py-5 md:px-10"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="eyebrow">Operação comercial</p><div className="flex items-center gap-2"><h1 className="page-title">Funil de vendas</h1><span className="hidden h-2 w-2 rounded-full bg-[#10A97A] sm:block" /></div></div><div className="flex items-center gap-2"><button className="icon-button hidden sm:grid" onClick={() => toast.info("Filtros avançados entram na próxima versão.")}><Filter size={17} /></button><button className="tool-button hidden sm:flex" onClick={() => toast.info("Visualizações serão salvas com sua conta.")}><SlidersHorizontal size={17} /><span>Visualização</span></button><Button onClick={onNewDeal} className="h-11 gap-2 rounded-xl bg-[#10A97A] px-4 font-bold hover:bg-[#087E5A]"><Plus size={18} />Oportunidade</Button></div></div>
    <div className="mt-6 flex flex-wrap items-center gap-3"><div className="relative"><select aria-label="Selecionar funil" className="funnel-selector appearance-none" value={activeFunnelId} onChange={(event) => onSelectFunnel(event.target.value)}>{funnels.map((funnel) => <option key={funnel.id} value={funnel.id}>{funnel.name}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#77847E]" /></div><button onClick={onEditFunnel} className="icon-button" aria-label="Editar funil"><Pencil size={16} /></button><span className="hidden h-5 w-px bg-[#DDE4DE] sm:block" /><button onClick={onNewFunnel} className="hidden items-center gap-1.5 text-sm font-bold text-[#087E5A] sm:flex"><CirclePlus size={17} />Novo funil</button><div className="ml-0 flex gap-2 sm:ml-auto"><MiniMetric label="Em aberto" value={formatCurrency(totalPipeline)} /><MiniMetric label="Ponderado" value={formatCurrency(weightedPipeline)} accent /></div></div></header>
    <div className="relative overflow-hidden px-5 py-7 md:px-10"><div className="pointer-events-none absolute right-8 top-2 hidden h-44 w-80 overflow-hidden rounded-full opacity-[0.13] xl:block"><img src={funnelArtUrl} alt="" className="h-full w-full object-cover" /></div><div className="relative z-10 overflow-x-auto pb-4"><div className="flex min-w-max items-stretch gap-4">{activeFunnel?.stages.map((stage) => <PipelineColumn key={stage.id} stage={stage} deals={deals.filter((deal) => deal.stageId === stage.id)} isOver={overStageId === stage.id} draggedDealId={draggedDealId} onEditStage={() => onEditStage(stage)} onEditDeal={onEditDeal} onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} onDragEnd={onDragEnd} />)}<button onClick={onNewStage} className="stage-add-button"><CirclePlus size={20} /><span>Nova etapa</span></button></div></div><div className="mt-3 flex items-center gap-2 text-xs text-[#728079]"><GripVertical size={15} /><span>Arraste as oportunidades entre as etapas para atualizar o funil.</span></div></div></div>;
}

function MiniMetric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <div className={`rounded-xl border px-3 py-2 ${accent ? "border-[#BDE5D5] bg-[#E8F6F0]" : "border-[#E0E6E0] bg-white"}`}><p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#7B8882]">{label}</p><p className={`mt-0.5 text-sm font-extrabold tracking-[-0.03em] ${accent ? "text-[#087E5A]" : "text-[#27302D]"}`}>{value}</p></div>;
}

function PipelineColumn({ stage, deals, isOver, draggedDealId, onEditStage, onEditDeal, onDragStart, onDragOver, onDrop, onDragEnd }: { stage: Stage; deals: Deal[]; isOver: boolean; draggedDealId: string | null; onEditStage: () => void; onEditDeal: (deal: Deal) => void; onDragStart: (event: DragEvent<HTMLElement>, dealId: string) => void; onDragOver: (event: DragEvent<HTMLElement>, stageId: string) => void; onDrop: (stageId: string) => void; onDragEnd: () => void }) {
  const columnValue = deals.reduce((sum, deal) => sum + deal.value, 0);
  return <section onDragOver={(event) => onDragOver(event, stage.id)} onDrop={() => onDrop(stage.id)} className={`pipeline-column ${isOver ? "pipeline-column-over" : ""}`}><header className="mb-4 flex items-center gap-2 px-1"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color }} /><div className="min-w-0 flex-1"><h2 className="truncate text-sm font-extrabold text-[#2C3632]">{stage.name}</h2><p className="mt-0.5 text-xs text-[#7B8882]">{deals.length} {deals.length === 1 ? "negócio" : "negócios"} · {stage.probability}%</p></div><button onClick={onEditStage} className="icon-button h-7 w-7 opacity-70 hover:opacity-100" aria-label={`Editar etapa ${stage.name}`}><MoreHorizontal size={16} /></button></header><p className="mb-4 border-y border-[#E3E8E3] px-1 py-2 text-sm font-extrabold tracking-[-0.02em] text-[#44524C]">{formatCurrency(columnValue)}</p><div className="min-h-[420px] space-y-3">{deals.map((deal) => <DealCard key={deal.id} deal={deal} isDragging={draggedDealId === deal.id} onEdit={() => onEditDeal(deal)} onDragStart={onDragStart} onDragEnd={onDragEnd} />)}{deals.length === 0 && <div className="grid min-h-28 place-items-center rounded-xl border border-dashed border-[#D6DED8] bg-white/45 p-4 text-center text-xs font-medium text-[#87928D]">Solte uma oportunidade aqui</div>}</div></section>;
}

function DealCard({ deal, isDragging, onEdit, onDragStart, onDragEnd }: { deal: Deal; isDragging: boolean; onEdit: () => void; onDragStart: (event: DragEvent<HTMLElement>, dealId: string) => void; onDragEnd: () => void }) {
  return <div draggable onDragStart={(event) => onDragStart(event, deal.id)} onDragEnd={onDragEnd} onClick={onEdit} className={`deal-card group ${isDragging ? "deal-card-dragging" : ""}`} role="button" tabIndex={0} onKeyDown={(event) => event.key === "Enter" && onEdit()}><div className="mb-3 flex items-center justify-between gap-2"><span className="tag-chip bg-[#F3F5F1] text-[#617069]">{deal.tag}</span><GripVertical className="h-4 w-4 text-[#ADB8B1]" /></div><h3 className="font-display text-[15px] font-bold leading-5 tracking-[-0.025em] text-[#29332F]">{deal.title}</h3><div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[#728079]"><Building2 size={13} /><span className="truncate">{deal.company}</span></div><div className="mt-4 flex items-end justify-between gap-2"><div><p className="text-base font-extrabold tracking-[-0.03em] text-[#1B2522]">{formatCurrency(deal.value)}</p><div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-[#718079]"><Clock3 size={12} /><span>{deal.nextActivity}</span></div></div><div className="grid h-7 w-7 place-items-center rounded-full bg-[#E7F2ED] text-[9px] font-extrabold text-[#087E5A]">{deal.owner}</div></div></div>;
}
