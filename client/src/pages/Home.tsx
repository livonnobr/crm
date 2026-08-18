/**
 * Oficina de Receita — página principal do CRM Ritmo.
 * Estilo: minimalismo tátil contemporâneo, superfícies marfim, grafite e Verde Ritmo.
 * O layout usa um trilho operacional lateral e uma bancada horizontal de oportunidades.
 */
import { RitmoAuthScreen } from "@/components/RitmoAuthScreen";
import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  CircleDollarSign,
  CirclePlus,
  ClipboardList,
  Download,
  Clock3,
  Filter,
  GitBranch,
  GripVertical,
  Layers,
  LayoutGrid,
  List,
  Mail,
  MessageCircle,
  PhoneCall,
  ClipboardCheck,
  Linkedin,
  Instagram,
  Menu,
  MoreHorizontal,
  Pencil,
  Pin,
  Plus,
  RotateCcw,
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
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { getSupabaseClient, isSupabaseConfigured, supabase } from "@/lib/supabase";
import { summarizeFinanceEntries } from "@/lib/finance";
import { cleanGoalPeriod, goalPeriodInputType, goalPeriodInputValue, goalPeriodValue as goalPeriodValueFromHelper, periodValueForDate } from "@/lib/goal-period";
import { brazilianNationalHolidays, businessDaysUntilMonthEnd } from "@/lib/business-days";
import { projectFunnelStages, reorderFunnelStages } from "@/lib/funnel-utils";
import { snapshotHasPersistedData } from "@/lib/workspace-hydration";
import { trpc } from "@/lib/trpc";

type Page = "goals" | "pipeline" | "activities" | "people" | "prospecting" | "finance" | "services";

type ServicePricingType = "Fixo" | "Mensal" | "A partir de";
type ServiceDeadlineUnit = "dias" | "semanas" | "meses";

type Service = {
  id: string;
  name: string;
  deliverables: string;
  deadline: number;
  deadlineUnit: ServiceDeadlineUnit;
  price: number;
  pricingType: ServicePricingType;
  position: number;
};

type FinanceEntry = {
  id: string;
  expense: string;
  amount: number;
  installment: string;
  dueDate: string;
  notes: string;
};

type FinanceEntryRow = {
  id: string;
  workspace_id: string;
  expense: string;
  amount: number | string;
  installment: string;
  due_date: string | null;
  notes: string;
  position: number;
};

type ServiceRow = {
  id: string;
  workspace_id: string;
  name: string;
  deliverables: string;
  deadline: number | string;
  deadline_unit: ServiceDeadlineUnit;
  price: number | string;
  pricing_type: ServicePricingType;
  position: number;
};

type ProspectRecord = {
  id: string;
  decisionMakerFirstName: string;
  decisionMakerLastName: string;
  decisionMakerRole: string;
  decisionMakerEmail: string;
  decisionMakerPhone: string;
  decisionMakerSecondaryPhone: string;
  monthlyVisits: string;
  company: string;
  companyWebsite: string;
  analysis: string;
};

type ProspectList = {
  id: string;
  name: string;
  records: ProspectRecord[];
  deletedAt?: string;
};

type TrashedProspectList = ProspectList & { deletedAt: string };

const PROSPECT_TRASH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

type GoalType = "Prospecção" | "Vendas";
type GoalUnit = "atividades" | "%" | "R$";
type GoalCadence = "Diária" | "Semanal" | "Mensal";
type ConversionRates = Record<string, number>;

type GoalItem = {
  id: string;
  title: string;
  type: GoalType;
  target: number;
  actual: number;
  unit: GoalUnit;
  period: string;
  cadence: GoalCadence;
  recurring: boolean;
  position: number;
  linkedFunnelId?: string;
  linkedStageId?: string;
  color: "emerald" | "blue" | "amber" | "violet";
  monthlyOverrides?: Record<string, { target: number; actual: number }>;
};

type Stage = {
  id: string;
  name: string;
  color: string;
  probability: number;
};

type SimulationProjectionMode = "percentual" | "fixo" | "produto";

type GoalSimulationStage = {
  id: string;
  name: string;
  color: string;
  probability: number;
  projectionMode: SimulationProjectionMode;
  fixedValue: number;
  productId: string;
  conversionStageId: string;
  conversionRate: number;
  revenueBase: "produto" | "ticket";
  averageTicket: number;
};

type SalesFunnel = {
  id: string;
  name: string;
  currency: string;
  stages: Stage[];
};

type DealActivity = {
  id: string;
  subject: string;
  dueAt: string;
  done: boolean;
};

type CadenceSlot = "morning" | "afternoon";
type CadenceChannel = "E-mail" | "WhatsApp" | "Ligação" | "Tarefa" | "LinkedIn" | "Instagram";
type CadenceBlock = {
  id: string;
  day: number;
  slot: CadenceSlot;
  title: string;
  channel: CadenceChannel;
  notes: string;
};

type CadenceBlockRow = {
  id: string;
  workspace_id: string;
  day: number;
  slot: CadenceSlot;
  title: string;
  channel: CadenceChannel;
  notes: string;
  position: number;
};

type DealNote = {
  id: string;
  content: string;
  createdAt: string;
};

type CompanyData = {
  industry?: string;
  size?: string;
  website?: string;
  city?: string;
  __ritmoStageHistory?: string[];
  __ritmoStageEvents?: StageEvent[];
  __ritmoProspectId?: string;
  __ritmoProspectListId?: string;
  monthlyVisits?: string;
  analysis?: string;
};

type StageEvent = { stageId: string; occurredAt: string };

type Deal = {
  id: string;
  title: string;
  company: string;
  value: number;
  owner: string;
  stageId: string;
  tag: string;
  nextActivity: string;
  contactName?: string;
  contactRole?: string;
  contactEmail?: string;
  contactPhone?: string;
  companyData?: CompanyData;
  activities?: DealActivity[];
  notes?: DealNote[];
  stageHistory?: string[];
  stageEvents?: StageEvent[];
};

type GoalRecord = {
  id: string;
  title: string;
  goal_type: GoalType;
  target: number | string;
  actual: number | string;
  unit: GoalUnit;
  period: string;
  color: GoalItem["color"];
  linked_funnel_id?: string | null;
  linked_stage_id?: string | null;
  recurring?: boolean | null;
  monthly_overrides?: Record<string, { target: number; actual: number }> | null;
  position?: number | null;
};

type ConversionSettingsRecord = { workspace_id: string; rates: ConversionRates };
type GoalSimulationStageRecord = { id: string; workspace_id: string; name: string; color: string; probability: number; projection_mode?: SimulationProjectionMode | null; fixed_value?: number | string | null; product_id?: string | null; conversion_stage_id?: string | null; conversion_rate?: number | string | null; revenue_base?: "produto" | "ticket" | null; average_ticket?: number | string | null; position: number };
type ProspectListRow = { id: string; workspace_id: string; name: string; deleted_at: string | null };
type ProspectRecordRow = { id: string; list_id: string; decision_maker_first_name: string; decision_maker_last_name: string; decision_maker_role: string | null; decision_maker_email: string; decision_maker_phone: string; decision_maker_secondary_phone?: string | null; monthly_visits?: string | null; company: string; company_website: string; analysis: string; position: number };
type FunnelRecord = { id: string; name: string; currency: string; position: number };
type StageRecord = { id: string; funnel_id: string; name: string; color: string; probability: number; position: number };
type OpportunityRecord = { id: string; funnel_id: string; stage_id: string; title: string; company: string; value: number | string; owner_initials: string; tag: string; next_activity: string; position: number; contact_name?: string | null; contact_role?: string | null; contact_email?: string | null; contact_phone?: string | null; company_data?: CompanyData | null; activities?: DealActivity[] | null; notes?: DealNote[] | null; stage_history?: string[] | null };

const logoUrl = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663898378323/XzvVLbbQIKNxqUWR.png";
const funnelArtUrl = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663898378323/RSAFUTacmmjjoCvV.jpg";

const initialGoals: GoalItem[] = [
  {
    id: "goal-prospect",
    title: "Novas conversas qualificadas",
    type: "Prospecção",
    target: 80,
    actual: 51,
    unit: "atividades",
    period: "Agosto 2026",
    cadence: "Mensal",
    recurring: false,
    position: 0,
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
    cadence: "Mensal",
    recurring: false,
    position: 1,
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
    cadence: "Mensal",
    recurring: false,
    position: 2,
    color: "amber",
  },
];

const initialGoalSimulationStages: GoalSimulationStage[] = [
  { id: "simulation-entry", name: "Entrada", color: "#77918B", probability: 100, projectionMode: "percentual", fixedValue: 0, productId: "", conversionStageId: "", conversionRate: 100, revenueBase: "produto", averageTicket: 0 },
  { id: "simulation-diagnosis", name: "Diagnóstico", color: "#5B8CB2", probability: 50, projectionMode: "percentual", fixedValue: 0, productId: "", conversionStageId: "", conversionRate: 50, revenueBase: "produto", averageTicket: 0 },
  { id: "simulation-proposal", name: "Proposta", color: "#B07D3A", probability: 35, projectionMode: "percentual", fixedValue: 0, productId: "", conversionStageId: "", conversionRate: 35, revenueBase: "produto", averageTicket: 0 },
  { id: "simulation-won", name: "Ganho", color: "#10A97A", probability: 20, projectionMode: "percentual", fixedValue: 0, productId: "", conversionStageId: "", conversionRate: 20, revenueBase: "produto", averageTicket: 0 },
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
      { id: "lost", name: "Perdido", color: "#C55A52", probability: 0 },
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
    stageHistory: ["lead"],
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
  unit: "%",
  period: periodValueForDate("Mensal"),
  cadence: "Mensal",
  recurring: false,
  position: 0,
  linkedFunnelId: "",
  linkedStageId: "",
  color: "emerald",
  monthlyOverrides: {},
};

const initialProspects: ProspectRecord[] = [];

const initialProspectLists: ProspectList[] = [{ id: "prospect-list-default", name: "Lista principal", records: initialProspects }];

const initialCadenceBlocks: CadenceBlock[] = [
  { id: "cadence-1", day: 1, slot: "morning", title: "Introdução", channel: "E-mail", notes: "Apresentar a empresa e contexto inicial." },
  { id: "cadence-2", day: 2, slot: "afternoon", title: "Follow-up", channel: "WhatsApp", notes: "Retomar contato e validar interesse." },
  { id: "cadence-3", day: 3, slot: "morning", title: "Follow-up", channel: "WhatsApp", notes: "Enviar prova social ou material relevante." },
  { id: "cadence-4", day: 4, slot: "afternoon", title: "Ligação consultiva", channel: "Ligação", notes: "Entender momento e próximo passo." },
  { id: "cadence-5", day: 6, slot: "morning", title: "Break-up", channel: "E-mail", notes: "Última tentativa com saída elegante." },
];

function storedProspectLists() {
  const savedLists = storedValue<ProspectList[] | null>("ritmo-prospect-lists", null);
  if (Array.isArray(savedLists) && savedLists.length) return savedLists.filter((list) => !list.deletedAt);
  const legacyRecords = storedValue<ProspectRecord[]>("ritmo-prospects", initialProspects);
  return [{ id: "prospect-list-default", name: "Lista principal", records: legacyRecords }];
}

function storedTrashedProspectLists() {
  const savedLists = storedValue<TrashedProspectList[]>("ritmo-prospect-trash", []);
  const cutoff = Date.now() - PROSPECT_TRASH_RETENTION_MS;
  return savedLists.filter((list) => new Date(list.deletedAt).getTime() > cutoff);
}

const blankProspect: ProspectRecord = {
  id: "",
  decisionMakerFirstName: "",
  decisionMakerLastName: "",
  decisionMakerRole: "",
  decisionMakerEmail: "",
  decisionMakerPhone: "",
  decisionMakerSecondaryPhone: "",
  monthlyVisits: "",
  company: "",
  companyWebsite: "",
  analysis: "",
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
  contactName: "",
  contactRole: "",
  contactEmail: "",
  contactPhone: "",
  companyData: {},
  activities: [],
  notes: [],
  stageHistory: [],
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
  if (unit === "R$") return formatCurrency(value);
  const formatted = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value);
  return unit === "%" ? `${formatted}%` : formatted;
}

function parseGoalCadence(period: string): GoalCadence {
  const match = period.match(/^(Diária|Semanal|Mensal)\s*[·|-]\s*/i);
  return (match?.[1] as GoalCadence | undefined) ?? "Mensal";
}

function goalPeriodValue(goal: GoalItem) {
  return goalPeriodValueFromHelper({ ...goal, cadence: goal.cadence ?? parseGoalCadence(goal.period) });
}

function daysUntilMonthEnd(date = new Date()) {
  return businessDaysUntilMonthEnd(date);
}

function progressOf(goal: GoalItem) {
  return Math.min(100, Math.round((goal.actual / Math.max(goal.target, 1)) * 100));
}

function goalValuesForMonth(goal: GoalItem, month: string) {
  const override = goal.recurring ? goal.monthlyOverrides?.[month] : undefined;
  return override ? { ...goal, target: override.target, actual: override.actual } : goal;
}

function goalDisplayPeriod(goal: GoalItem, selectedMonth: string) {
  if (goal.recurring && goal.cadence === "Mensal") return cleanGoalPeriod(selectedMonth);
  return goal.recurring ? periodValueForDate(goal.cadence) : cleanGoalPeriod(goal.period);
}

const LEGACY_STAGE_EVENT_DATE = new Date().toISOString();

function stageEventsForDeal(deal: Deal): StageEvent[] {
  if (deal.stageEvents?.length) return deal.stageEvents;
  const history = deal.stageHistory?.length ? deal.stageHistory : [deal.stageId];
  return history.map((stageId) => ({ stageId, occurredAt: LEGACY_STAGE_EVENT_DATE }));
}

function dealEnteredStage(deal: Deal, stageId: string) {
  return (deal.stageHistory?.length ? deal.stageHistory : [deal.stageId]).includes(stageId);
}

function accumulatedStageCount(deals: Deal[], stageId: string, monthKey: string) {
  return deals.filter((deal) => stageEventsForDeal(deal).some((event) => event.stageId === stageId && event.occurredAt.slice(0, 7) === monthKey)).length;
}

function goalMatchesMonth(goal: GoalItem, monthKey: string) {
  if (goal.recurring) return true;
  const rawPeriod = goal.period.replace(/^(Diária|Semanal|Mensal)\s*[·|-]\s*/i, "").trim().toLocaleLowerCase("pt-BR");
  const isoMatch = rawPeriod.match(/^(\d{4})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}` === monthKey;
  const localizedMatch = rawPeriod.match(/^(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+de\s+(\d{4})$/i);
  if (!localizedMatch) return true;
  const monthNumber = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"].indexOf(localizedMatch[1]) + 1;
  return `${localizedMatch[2]}-${String(monthNumber).padStart(2, "0")}` === monthKey;
}

function defaultConversionRates(funnels: SalesFunnel[]): ConversionRates {
  return Object.fromEntries(funnels.flatMap((funnel) => funnel.stages.map((stage, index) => [stage.id, index === 0 ? 100 : Math.min(100, Math.max(0, Number(stage.probability) || 0))])));
}

function recordStageVisit(deal: Deal, stageId: string): Deal {
  const history = deal.stageHistory?.length ? deal.stageHistory : [deal.stageId];
  const events = stageEventsForDeal(deal);
  if (history.includes(stageId)) return { ...deal, stageId, stageEvents: events };
  return { ...deal, stageId, stageHistory: [...history, stageId], stageEvents: [...events, { stageId, occurredAt: new Date().toISOString() }] };
}

function uniqueId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isWonStage(stage: Stage) {
  return stage.id === "won" || stage.id.endsWith("-won") || stage.name.trim().toLocaleLowerCase("pt-BR") === "ganho";
}

function isLostStage(stage: Stage) {
  const normalizedName = stage.name.trim().toLocaleLowerCase("pt-BR");
  return stage.id === "lost" || stage.id.endsWith("-lost") || normalizedName === "perdido" || normalizedName === "perdida";
}

export default function Home() {
  const [supabaseSession, setSupabaseSession] = useState<import("@supabase/supabase-js").Session | null>(null);
  const isAuthenticated = Boolean(supabaseSession);
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void supabase.auth.getSession().then(({ data }) => { if (active) setSupabaseSession(data.session); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setSupabaseSession(session));
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);
  const workspaceBootstrap = trpc.workspace.bootstrap.useQuery(undefined, { enabled: isAuthenticated });
  const workspaceSnapshot = trpc.workspace.snapshot.useQuery(undefined, { enabled: isAuthenticated });
  const syncWorkspaceMutation = trpc.workspace.sync.useMutation();
  const syncServiceMutation = trpc.workspace.syncService.useMutation();
  const syncGoalsMutation = trpc.workspace.syncGoals.useMutation();

  const [page, setPage] = useState<Page>(() => {
    const tab = new URLSearchParams(window.location.search).get("aba");
    return tab === "funil" ? "pipeline" : tab === "atividades" ? "activities" : tab === "prospeccao" ? "prospecting" : tab === "financeiro" ? "finance" : tab === "servicos" ? "services" : "goals";
  });
  const [isSidebarPinned, setIsSidebarPinned] = useState(false);
  const [isSidebarHovering, setIsSidebarHovering] = useState(false);
  const [goals, setGoals] = useState<GoalItem[]>(() => storedValue("ritmo-goals", initialGoals));
  const [selectedGoalMonth, setSelectedGoalMonth] = useState(() => periodValueForDate("Mensal"));
  const [funnels, setFunnels] = useState<SalesFunnel[]>(() => storedValue("ritmo-funnels", initialFunnels));
  const [conversionRates, setConversionRates] = useState<ConversionRates>(() => storedValue("ritmo-conversion-rates", {}));
  const [goalSimulationStages, setGoalSimulationStages] = useState<GoalSimulationStage[]>(() => storedValue("ritmo-goal-simulation-stages", initialGoalSimulationStages));
  const [deals, setDeals] = useState<Deal[]>(() => storedValue<Deal[]>("ritmo-deals", initialDeals).map((deal) => ({ ...deal, stageHistory: deal.stageHistory?.length ? deal.stageHistory : [deal.stageId], stageEvents: stageEventsForDeal(deal) })));
  const [prospectLists, setProspectLists] = useState<ProspectList[]>(() => storedProspectLists());
  const [trashedProspectLists, setTrashedProspectLists] = useState<TrashedProspectList[]>(() => storedTrashedProspectLists());
  const [cadenceBlocks, setCadenceBlocks] = useState<CadenceBlock[]>(() => storedValue("ritmo-cadence-blocks", initialCadenceBlocks));
  const [financeEntries, setFinanceEntries] = useState<FinanceEntry[]>(() => storedValue("ritmo-finance-entries", []));
  const [services, setServices] = useState<Service[]>(() => storedValue<Service[]>("ritmo-services", []).map((service, position) => ({ ...service, position: Number.isFinite(service.position) ? service.position : position })));
  const [draggedCadenceId, setDraggedCadenceId] = useState<string | null>(null);
  const [cadenceEditId, setCadenceEditId] = useState<string | null>(null);
  const [activeProspectListId, setActiveProspectListId] = useState(() => storedValue("ritmo-active-prospect-list", "prospect-list-default"));
  const [activeFunnelId, setActiveFunnelId] = useState(() => storedValue("ritmo-active-funnel", "primary-funnel"));
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [isSyncConfirmed, setIsSyncConfirmed] = useState(false);
  const [isGoalsSyncConfirmed, setIsGoalsSyncConfirmed] = useState(false);
  const [isGoalsSaving, setIsGoalsSaving] = useState(false);
  const syncAttemptRef = useRef(0);
  const [isCloudLoading, setIsCloudLoading] = useState(isSupabaseConfigured);
  const [isCloudHydrating, setIsCloudHydrating] = useState(false);
  const [isProspectSaving, setIsProspectSaving] = useState(false);
  const [savingProspectId, setSavingProspectId] = useState<string | null>(null);
  const [savingServiceId, setSavingServiceId] = useState<string | null>(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [isAuthSending, setIsAuthSending] = useState(false);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [goalDraft, setGoalDraft] = useState<GoalItem>(blankGoal);
  const [goalOverrideMonth, setGoalOverrideMonth] = useState<string | null>(null);
  const [dealDialogOpen, setDealDialogOpen] = useState(false);
  const [dealDraft, setDealDraft] = useState<Deal>(blankDeal);
  const [funnelDialogOpen, setFunnelDialogOpen] = useState(false);
  const [isFunnelEditing, setIsFunnelEditing] = useState(false);
  const [funnelDraftName, setFunnelDraftName] = useState("");
  const [stageDialogOpen, setStageDialogOpen] = useState(false);
  const [stageDraft, setStageDraft] = useState<Stage>({ id: "", name: "", color: "#10A97A", probability: 20 });
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  const [overStageId, setOverStageId] = useState<string | null>(null);
  const [draggedStageId, setDraggedStageId] = useState<string | null>(null);
  const [overStageReorderId, setOverStageReorderId] = useState<string | null>(null);
  const [detailDealId, setDetailDealId] = useState<string | null>(null);
  const [deleteDealId, setDeleteDealId] = useState<string | null>(null);
  const pendingDeleteDeal = deals.find((deal) => deal.id === deleteDealId) ?? null;
  const cadenceEditBlock = cadenceBlocks.find((block) => block.id === cadenceEditId) ?? null;

  async function loadCloudWorkspace(currentWorkspaceId: string) {
    if (!supabase) return;
    setIsCloudHydrating(true);
    setIsCloudLoading(true);
    const client = getSupabaseClient();
    const remoteSnapshot = workspaceSnapshot.data?.snapshot;
    const [{ data: goalRows, error: goalsError }, { data: funnelRows, error: funnelsError }, { data: conversionSettingsRow, error: conversionSettingsError }, { data: goalSimulationStageRows, error: goalSimulationStagesError }, { data: prospectListRows, error: prospectListsError }, { data: prospectRecordRows, error: prospectRecordsError }, { data: cadenceBlockRows, error: cadenceBlocksError }, { data: financeRows, error: financeError }, { data: serviceRows, error: servicesError }] = remoteSnapshot
      ? [
          { data: remoteSnapshot.goals, error: null },
          { data: remoteSnapshot.funnels, error: null },
          { data: remoteSnapshot.conversionSettings, error: null },
          { data: remoteSnapshot.goalSimulationStages, error: null },
          { data: remoteSnapshot.prospectLists, error: null },
          { data: remoteSnapshot.prospectRecords, error: null },
          { data: remoteSnapshot.cadenceBlocks, error: null },
          { data: remoteSnapshot.financeEntries, error: null },
          { data: remoteSnapshot.services, error: null },
        ]
      : await Promise.all([
          client.from("goals").select("id, title, goal_type, target, actual, unit, period, color, recurring, position, linked_funnel_id, linked_stage_id").eq("workspace_id", currentWorkspaceId).order("position", { ascending: true }),
          client.from("funnels").select("id, name, currency, position").eq("workspace_id", currentWorkspaceId).order("position"),
          client.from("conversion_settings").select("workspace_id, rates").eq("workspace_id", currentWorkspaceId).maybeSingle(),
          client.from("goal_simulation_stages").select("id, workspace_id, name, color, probability, projection_mode, fixed_value, product_id, conversion_stage_id, conversion_rate, revenue_base, average_ticket, position").eq("workspace_id", currentWorkspaceId).order("position"),
          client.from("prospect_lists").select("id, workspace_id, name, deleted_at").eq("workspace_id", currentWorkspaceId).order("created_at"),
          client.from("prospect_records").select("id, list_id, decision_maker_first_name, decision_maker_last_name, decision_maker_role, decision_maker_email, decision_maker_phone, decision_maker_secondary_phone, monthly_visits, company, company_website, analysis, position").order("position"),
          client.from("cadence_blocks").select("id, workspace_id, day, slot, title, channel, notes, position").eq("workspace_id", currentWorkspaceId).order("position"),
          client.from("finance_entries").select("id, workspace_id, expense, amount, installment, due_date, notes, position").eq("workspace_id", currentWorkspaceId).order("position"),
          client.from("services").select("id, workspace_id, name, deliverables, deadline, deadline_unit, price, pricing_type, position").eq("workspace_id", currentWorkspaceId).order("position"),
        ]);

    if (goalsError || funnelsError || conversionSettingsError || goalSimulationStagesError || prospectListsError || prospectRecordsError || cadenceBlocksError || financeError || servicesError) {
      toast.error("Não foi possível carregar os dados salvos.");
      setIsCloudLoading(false);
      setIsCloudHydrating(false);
      return;
    }

    if (remoteSnapshot && !snapshotHasPersistedData(remoteSnapshot)) {
      setWorkspaceId(currentWorkspaceId);
      setIsCloudLoading(false);
      setIsCloudHydrating(false);
      return;
    }

    const cloudFunnels = (funnelRows ?? []) as FunnelRecord[];
    const funnelIds = cloudFunnels.map((funnel) => funnel.id);
    const [{ data: stageRows, error: stagesError }, { data: opportunityRows, error: opportunitiesError }] = remoteSnapshot
      ? [{ data: remoteSnapshot.stages, error: null }, { data: remoteSnapshot.opportunities, error: null }]
      : funnelIds.length
        ? await Promise.all([
            client.from("stages").select("id, funnel_id, name, color, probability, position").in("funnel_id", funnelIds).order("position"),
            client.from("opportunities").select("id, funnel_id, stage_id, title, company, value, owner_initials, tag, next_activity, position, contact_name, contact_role, contact_email, contact_phone, company_data, activities, notes").in("funnel_id", funnelIds).order("position"),
          ])
        : [{ data: [], error: null }, { data: [], error: null }];

    if (stagesError || opportunitiesError) {
      toast.error("Não foi possível carregar o funil salvo.");
      setIsCloudLoading(false);
      setIsCloudHydrating(false);
      return;
    }

    const prospectRecordsByList = new Map<string, ProspectRecord[]>();
    ((prospectRecordRows ?? []) as ProspectRecordRow[]).forEach((record) => {
      const current = prospectRecordsByList.get(record.list_id) ?? [];
      current.push({ id: record.id, decisionMakerFirstName: record.decision_maker_first_name, decisionMakerLastName: record.decision_maker_last_name, decisionMakerRole: record.decision_maker_role ?? "", decisionMakerEmail: record.decision_maker_email, decisionMakerPhone: record.decision_maker_phone, decisionMakerSecondaryPhone: record.decision_maker_secondary_phone ?? "", monthlyVisits: record.monthly_visits ?? "", company: record.company, companyWebsite: record.company_website, analysis: record.analysis });
      prospectRecordsByList.set(record.list_id, current);
    });
    const cloudProspectLists = ((prospectListRows ?? []) as ProspectListRow[]).map((list) => ({ id: list.id, name: list.name, records: prospectRecordsByList.get(list.id) ?? [], deletedAt: list.deleted_at ?? undefined }));
    const hasCloudProspectData = cloudProspectLists.length > 0;
    const normalizedProspectLists = (hasCloudProspectData ? cloudProspectLists.filter((list) => !list.deletedAt) : prospectLists).map(({ deletedAt: _deletedAt, ...list }) => list);
    const normalizedProspectTrash = hasCloudProspectData ? cloudProspectLists.filter((list): list is TrashedProspectList => Boolean(list.deletedAt && new Date(list.deletedAt).getTime() > Date.now() - PROSPECT_TRASH_RETENTION_MS)) : trashedProspectLists;

    const normalizedCadenceBlocks = ((cadenceBlockRows ?? []) as CadenceBlockRow[]).map((block) => ({ id: block.id, day: Number(block.day), slot: block.slot, title: block.title, channel: block.channel, notes: block.notes }));
    const normalizedFinanceEntries = ((financeRows ?? []) as FinanceEntryRow[]).map((entry) => ({ id: entry.id, expense: entry.expense, amount: Number(entry.amount), installment: entry.installment, dueDate: entry.due_date ?? "", notes: entry.notes }));
    const normalizedServices = ((serviceRows ?? []) as ServiceRow[]).sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0)).map((service, position) => ({ id: service.id, name: service.name, deliverables: service.deliverables, deadline: Number(service.deadline), deadlineUnit: service.deadline_unit, price: Number(service.price), pricingType: service.pricing_type, position }));
    const normalizedGoalSimulationStages = ((goalSimulationStageRows ?? []) as GoalSimulationStageRecord[]).map((stage) => ({ id: stage.id, name: stage.name, color: stage.color, probability: Number(stage.probability), projectionMode: (stage.projection_mode === "fixo" || stage.projection_mode === "produto" ? stage.projection_mode : "percentual") as SimulationProjectionMode, fixedValue: Math.max(0, Number(stage.fixed_value) || 0), productId: stage.product_id ?? "", conversionStageId: stage.conversion_stage_id ?? "", conversionRate: Math.min(100, Math.max(0, Number(stage.conversion_rate) || Number(stage.probability) || 0)), revenueBase: stage.revenue_base === "ticket" ? "ticket" as const : "produto" as const, averageTicket: Math.max(0, Number(stage.average_ticket) || 0) }));

    const normalizedGoals = ((goalRows ?? []) as GoalRecord[]).map((goal) => ({
      id: goal.id,
      title: goal.title,
      type: goal.goal_type,
      target: Number(goal.target),
      actual: Number(goal.actual),
      unit: goal.unit,
      period: cleanGoalPeriod(goal.period),
      cadence: parseGoalCadence(goal.period),
      recurring: Boolean(goal.recurring),
      position: Number(goal.position ?? 0),
      color: goal.color,
      linkedFunnelId: goal.linked_funnel_id ?? "",
      linkedStageId: goal.linked_stage_id ?? "",
      monthlyOverrides: goal.monthly_overrides ?? {},
    }));
    const normalizedStages = (stageRows ?? []) as StageRecord[];
    const normalizedFunnels = cloudFunnels.map((funnel) => ({
      id: funnel.id,
      name: funnel.name,
      currency: funnel.currency,
      stages: normalizedStages.filter((stage) => stage.funnel_id === funnel.id).map((stage) => ({ id: stage.id, name: stage.name, color: stage.color, probability: stage.probability })),
    }));
    const normalizedDeals = ((opportunityRows ?? []) as OpportunityRecord[]).map((deal) => ({
      id: deal.id,
      title: deal.title,
      company: deal.company,
      value: Number(deal.value),
      owner: deal.owner_initials,
      stageId: deal.stage_id,
      tag: deal.tag,
      nextActivity: deal.next_activity,
      contactName: deal.contact_name ?? "",
      contactRole: deal.contact_role ?? "",
      contactEmail: deal.contact_email ?? "",
      contactPhone: deal.contact_phone ?? "",
      companyData: (() => { const data = deal.company_data ?? {}; return Object.fromEntries(Object.entries(data).filter(([key]) => key !== "__ritmoStageHistory" && key !== "__ritmoStageEvents")); })(),
      activities: Array.isArray(deal.activities) ? deal.activities : [],
      notes: Array.isArray(deal.notes) ? deal.notes : [],
      stageHistory: Array.isArray(deal.company_data?.__ritmoStageHistory) && deal.company_data.__ritmoStageHistory.length ? deal.company_data.__ritmoStageHistory : [deal.stage_id],
      stageEvents: Array.isArray(deal.company_data?.__ritmoStageEvents) && deal.company_data.__ritmoStageEvents.length ? deal.company_data.__ritmoStageEvents : undefined,
    }));

    setGoals(normalizedGoals);
    setFunnels(normalizedFunnels);
    setConversionRates({ ...defaultConversionRates(normalizedFunnels), ...((conversionSettingsRow as ConversionSettingsRecord | null)?.rates ?? {}) });
    setGoalSimulationStages(normalizedGoalSimulationStages.length ? normalizedGoalSimulationStages : initialGoalSimulationStages);
    setDeals(normalizedDeals);
    setCadenceBlocks(normalizedCadenceBlocks.length ? normalizedCadenceBlocks : initialCadenceBlocks);
    setFinanceEntries(normalizedFinanceEntries);
    setServices(normalizedServices);
    setProspectLists(normalizedProspectLists.length ? normalizedProspectLists : initialProspectLists);
    setTrashedProspectLists(normalizedProspectTrash);
    setActiveProspectListId(normalizedProspectLists[0]?.id ?? initialProspectLists[0].id);
    setActiveFunnelId(normalizedFunnels[0]?.id ?? "");
    setWorkspaceId(currentWorkspaceId);
    setIsGoalsSyncConfirmed(true);
    setIsCloudLoading(false);
    setIsCloudHydrating(false);
  }

  useEffect(() => {
    if (!workspaceSnapshot.data?.workspaceId) {
      if (!isAuthenticated) setIsCloudLoading(false);
      return;
    }
    setAccountEmail(supabaseSession?.user.email ?? "Workspace Ritmo");
    void loadCloudWorkspace(workspaceSnapshot.data.workspaceId);
  }, [workspaceSnapshot.data?.workspaceId, workspaceSnapshot.data?.snapshot, isAuthenticated, supabaseSession?.user.email]);

  useEffect(() => {
    if (!workspaceId) window.localStorage.setItem("ritmo-goals", JSON.stringify(goals));
  }, [goals, workspaceId]);

  useEffect(() => {
    if (!workspaceId) window.localStorage.setItem("ritmo-funnels", JSON.stringify(funnels));
  }, [funnels, workspaceId]);

  useEffect(() => {
    if (!workspaceId) window.localStorage.setItem("ritmo-conversion-rates", JSON.stringify(conversionRates));
  }, [conversionRates, workspaceId]);

  useEffect(() => {
    if (!workspaceId) window.localStorage.setItem("ritmo-deals", JSON.stringify(deals));
  }, [deals, workspaceId]);

  useEffect(() => {
    if (!workspaceId) window.localStorage.setItem("ritmo-active-funnel", activeFunnelId);
  }, [activeFunnelId, workspaceId]);

  const activeProspectList = prospectLists.find((list) => list.id === activeProspectListId) ?? prospectLists[0];
  const prospects = activeProspectList?.records ?? [];

  useEffect(() => {
    if (!workspaceId) {
      window.localStorage.setItem("ritmo-prospect-lists", JSON.stringify(prospectLists));
      window.localStorage.setItem("ritmo-prospect-trash", JSON.stringify(trashedProspectLists));
      window.localStorage.setItem("ritmo-active-prospect-list", activeProspectListId);
      window.localStorage.setItem("ritmo-cadence-blocks", JSON.stringify(cadenceBlocks));
      window.localStorage.setItem("ritmo-finance-entries", JSON.stringify(financeEntries));
      window.localStorage.setItem("ritmo-services", JSON.stringify(services));
      window.localStorage.setItem("ritmo-goal-simulation-stages", JSON.stringify(goalSimulationStages));
    }
  }, [prospectLists, trashedProspectLists, activeProspectListId, cadenceBlocks, financeEntries, services, goalSimulationStages, workspaceId]);

  async function syncCurrentWorkspace(overrides: { services?: Service[] } = {}) {
    if (!workspaceId) throw new Error("Workspace Supabase indisponível.");
    const attempt = ++syncAttemptRef.current;
    setIsSyncConfirmed(false);
    await syncWorkspaceMutation.mutateAsync({ state: {
      goals: goals.map((goal) => ({ ...goal, period: goalPeriodValue(goal) })),
      funnels,
      deals: deals.map((deal) => ({ ...deal, companyData: { ...(deal.companyData ?? {}), __ritmoStageEvents: stageEventsForDeal(deal) } })),
      conversionRates,
      prospectLists,
      trashedProspectLists,
      cadenceBlocks,
      financeEntries,
      services: overrides.services ?? services,
      goalSimulationStages,
    } });
    if (syncAttemptRef.current === attempt) setIsSyncConfirmed(true);
  }

  async function saveGoalsToCloud(goalsToSave: GoalItem[] = goals, options: { notify?: boolean } = {}) {
    if (!workspaceId) {
      toast.error("Aguarde a conexão autenticada do Ritmo antes de salvar o Planejamento de Metas.");
      throw new Error("Workspace Supabase indisponível.");
    }
    setIsGoalsSaving(true);
    setIsGoalsSyncConfirmed(false);
    try {
      await syncGoalsMutation.mutateAsync({
        goals: goalsToSave.map((goal) => ({ ...goal, period: goalPeriodValue(goal) })),
        goalSimulationStages,
      });
      setIsGoalsSyncConfirmed(true);
      if (options.notify !== false) toast.success("Planejamento de Metas salvo no Supabase.");
    } catch (error) {
      setIsGoalsSyncConfirmed(false);
      toast.error("Não foi possível salvar o Planejamento de Metas no Supabase.");
      throw error;
    } finally {
      setIsGoalsSaving(false);
    }
  }

  useEffect(() => {
    if (!workspaceId || isCloudHydrating) return;
    void syncCurrentWorkspace().catch(() => toast.error("Não foi possível sincronizar os dados com o Supabase."));
    return;
  }, [goals, funnels, deals, conversionRates, prospectLists, trashedProspectLists, cadenceBlocks, financeEntries, services, goalSimulationStages, workspaceId, isCloudHydrating]);

  const activeFunnel = funnels.find((funnel) => funnel.id === activeFunnelId) ?? funnels[0];
  const funnelDeals = useMemo(
    () => deals.filter((deal) => activeFunnel?.stages.some((stage) => stage.id === deal.stageId)),
    [activeFunnel, deals],
  );
  const wonStage = activeFunnel?.stages.find(isWonStage);
  const lostStage = activeFunnel?.stages.find(isLostStage);
  const wonDeals = useMemo(() => funnelDeals.filter((deal) => deal.stageId === wonStage?.id), [funnelDeals, wonStage]);
  const lostDeals = useMemo(() => funnelDeals.filter((deal) => deal.stageId === lostStage?.id), [funnelDeals, lostStage]);
  const openDeals = useMemo(() => funnelDeals.filter((deal) => deal.stageId !== wonStage?.id && deal.stageId !== lostStage?.id), [funnelDeals, wonStage, lostStage]);

  const totalPipeline = openDeals.reduce((sum, deal) => sum + deal.value, 0);
  const weightedPipeline = openDeals.reduce((sum, deal) => {
    const stage = activeFunnel?.stages.find((item) => item.id === deal.stageId);
    return sum + deal.value * ((stage?.probability ?? 0) / 100);
  }, 0);
  const visibleGoals = useMemo(() => goals.filter((goal) => goalMatchesMonth(goal, selectedGoalMonth)), [goals, selectedGoalMonth]);
  const computedGoals = useMemo(() => visibleGoals.map((goal) => goal.linkedStageId ? { ...goal, actual: accumulatedStageCount(deals, goal.linkedStageId, selectedGoalMonth) } : goal), [visibleGoals, deals, selectedGoalMonth]);
  const achievedRevenue = computedGoals
    .filter((goal) => goal.unit === "R$")
    .reduce((sum, goal) => sum + goal.actual, 0);
  const averageGoalProgress = computedGoals.length ? Math.round(computedGoals.reduce((sum, goal) => sum + progressOf(goal), 0) / computedGoals.length) : 0;
  const detailDeal = deals.find((deal) => deal.id === detailDealId);

  function selectPage(nextPage: Page) {
    setPage(nextPage);
    const url = new URL(window.location.href);
    if (nextPage === "goals") url.searchParams.delete("aba");
    else url.searchParams.set("aba", nextPage === "pipeline" ? "funil" : nextPage === "activities" ? "atividades" : nextPage === "people" ? "pessoas" : nextPage === "finance" ? "financeiro" : nextPage === "services" ? "servicos" : "prospeccao");
    window.history.replaceState({}, "", url);
  }

  function addFinanceEntry() {
    const nextEntry: FinanceEntry = { id: uniqueId("finance"), expense: "Novo lançamento", amount: 0, installment: "1/1", dueDate: new Date().toISOString().slice(0, 10), notes: "" };
    setFinanceEntries((current) => [nextEntry, ...current]);
    setPage("finance");
    toast.success("Lançamento financeiro adicionado.");
  }
  function updateFinanceEntry(id: string, field: keyof Omit<FinanceEntry, "id">, value: string | number) {
    setFinanceEntries((current) => current.map((entry) => entry.id === id ? { ...entry, [field]: field === "amount" ? Number(value) || 0 : value } : entry));
  }
  function deleteFinanceEntry(id: string) {
    setFinanceEntries((current) => current.filter((entry) => entry.id !== id));
    toast.success("Lançamento removido.");
  }
  function addService() {
    const nextService: Service = { id: uniqueId("service"), name: "Novo serviço", deliverables: "Descreva os entregáveis", deadline: 7, deadlineUnit: "dias", price: 0, pricingType: "Fixo", position: 0 };
    setServices((current) => [nextService, ...current].map((service, position) => ({ ...service, position })));
    setPage("services");
    toast.success("Serviço adicionado.");
  }
  function updateService(id: string, field: keyof Omit<Service, "id">, value: string | number) {
    setServices((current) => current.map((service) => service.id === id ? { ...service, [field]: field === "deadline" || field === "price" ? Number(value) || 0 : value } : service));
  }
  async function reorderServices(fromId: string, toId: string) {
    if (fromId === toId) return;
    const ordered = [...services].sort((a, b) => a.position - b.position);
    const fromIndex = ordered.findIndex((service) => service.id === fromId);
    const toIndex = ordered.findIndex((service) => service.id === toId);
    if (fromIndex < 0 || toIndex < 0) return;
    const [moved] = ordered.splice(fromIndex, 1);
    ordered.splice(toIndex, 0, moved);
    const nextServices = ordered.map((service, position) => ({ ...service, position }));
    setServices(nextServices);
    if (!workspaceId) return;
    try {
      await syncCurrentWorkspace({ services: nextServices });
      toast.success("Ordem dos serviços salva.");
    } catch {
      toast.error("Não foi possível salvar a nova ordem dos serviços.");
    }
  }
  async function saveService(id: string) {
    const service = services.find((item) => item.id === id);
    if (!service) return;
    if (!service.name.trim()) {
      toast.error("Informe o nome do serviço antes de salvar.");
      return;
    }
    if (!workspaceId) {
      toast.error("Faça login para salvar o serviço no Supabase.");
      return;
    }
    try {
      setSavingServiceId(id);
      await syncServiceMutation.mutateAsync({ service });
      setIsSyncConfirmed(true);
      toast.success("Serviço salvo no Supabase.");
    } catch {
      toast.error("Não foi possível salvar o serviço no Supabase.");
    } finally {
      setSavingServiceId((current) => current === id ? null : current);
    }
  }
  function deleteService(id: string) {
    setServices((current) => current.filter((service) => service.id !== id).map((service, position) => ({ ...service, position })));
    toast.success("Serviço removido.");
  }
  function addCadenceBlock(day: number, slot: CadenceSlot, details?: Pick<CadenceBlock, "title" | "channel" | "notes">) {
    if (cadenceBlocks.some((block) => block.day === day && block.slot === slot)) { toast.info("Essa célula já tem uma ação."); return; }
    const nextBlock: CadenceBlock = { id: uniqueId("cadence"), day, slot, title: details?.title ?? "Nova ação", channel: details?.channel ?? "Tarefa", notes: details?.notes ?? "Defina o próximo passo comercial." };
    setCadenceBlocks((current) => [...current, nextBlock]);
    toast.success("Ação adicionada à cadência.");
  }

  function moveCadenceBlock(id: string, day: number, slot: CadenceSlot) {
    setCadenceBlocks((current) => current.some((block) => block.id !== id && block.day === day && block.slot === slot) ? current : current.map((block) => block.id === id ? { ...block, day, slot } : block));
  }

  function editCadenceBlock(nextBlock: CadenceBlock) {
    setCadenceBlocks((current) => current.map((block) => block.id === nextBlock.id ? nextBlock : block));
    toast.success("Ação da cadência atualizada.");
  }

  function deleteCadenceBlock(id: string) {
    setCadenceBlocks((current) => current.filter((block) => block.id !== id));
    toast.success("Ação removida da cadência.");
  }

  function addProspect() {
    if (!activeProspectList) return;
    setProspectLists((current) => current.map((list) => list.id === activeProspectList.id ? { ...list, records: [{ ...blankProspect, id: uniqueId("prospect") }, ...list.records] } : list));
    toast.success("Nova linha adicionada à lista de prospecção.");
  }

  function importProspectList(listId: string, funnelId: string, stageId: string) {
    const list = prospectLists.find((item) => item.id === listId);
    const funnel = funnels.find((item) => item.id === funnelId);
    const stage = funnel?.stages.find((item) => item.id === stageId);
    if (!list || !funnel || !stage) {
      toast.error("Selecione um funil e uma etapa válidos.");
      return;
    }
    const existingSourceIds = new Set(deals.map((deal) => deal.companyData?.__ritmoProspectId).filter(Boolean));
    const recordsToImport = list.records.filter((record) => !existingSourceIds.has(record.id));
    if (!recordsToImport.length) {
      toast.info("Todos os registros desta lista já estão no funil.");
      return;
    }
    const importedDeals = recordsToImport.map((record) => ({
      ...blankDeal,
      id: uniqueId("deal"),
      title: record.company.trim() || `${record.decisionMakerFirstName} ${record.decisionMakerLastName}`.trim() || "Novo prospecto",
      company: record.company.trim() || "Empresa não informada",
      stageId: stage.id,
      tag: "Prospecção",
      contactName: `${record.decisionMakerFirstName} ${record.decisionMakerLastName}`.trim(),
      contactRole: record.decisionMakerRole,
      contactEmail: record.decisionMakerEmail,
      contactPhone: record.decisionMakerPhone,
      companyData: { website: record.companyWebsite, monthlyVisits: record.monthlyVisits, analysis: record.analysis, __ritmoProspectId: record.id, __ritmoProspectListId: list.id },
      notes: record.analysis.trim() ? [{ id: uniqueId("note"), content: record.analysis.trim(), createdAt: new Date().toISOString() }] : [],
      stageHistory: [stage.id],
      stageEvents: [{ stageId: stage.id, occurredAt: new Date().toISOString() }],
    }));
    setDeals((current) => [...importedDeals, ...current]);
    toast.success(`${importedDeals.length} ${importedDeals.length === 1 ? "card criado" : "cards criados"} em ${stage.name}.`);
    selectPage("pipeline");
  }

  function updateProspect(id: string, field: keyof Omit<ProspectRecord, "id">, value: string) {
    if (!activeProspectList) return;
    setProspectLists((current) => current.map((list) => list.id === activeProspectList.id ? { ...list, records: list.records.map((prospect) => prospect.id === id ? { ...prospect, [field]: value } : prospect) } : list));
  }

  function updatePersonFromPeople(listId: string, id: string, field: keyof Pick<ProspectRecord, "decisionMakerFirstName" | "decisionMakerLastName" | "decisionMakerRole" | "decisionMakerEmail" | "decisionMakerPhone">, value: string) {
    const list = prospectLists.find((item) => item.id === listId);
    const record = list?.records.find((item) => item.id === id);
    if (!list || !record) return;
    const nextRecord = { ...record, [field]: value };
    setProspectLists((current) => current.map((currentList) => currentList.id === listId ? { ...currentList, records: currentList.records.map((prospect) => prospect.id === id ? nextRecord : prospect) } : currentList));

    setDeals((current) => current.map((deal) => {
      if (deal.companyData?.__ritmoProspectId !== id || deal.companyData?.__ritmoProspectListId !== listId) return deal;
      const nextContactName = `${nextRecord.decisionMakerFirstName} ${nextRecord.decisionMakerLastName}`.trim();
      const contactPatch: Partial<Deal> = {
        contactName: nextContactName,
        contactRole: nextRecord.decisionMakerRole,
        contactEmail: nextRecord.decisionMakerEmail,
        contactPhone: nextRecord.decisionMakerPhone,
      };
      return { ...deal, ...contactPatch };
    }));
  }

  function reorderProspects(fromId: string, toId: string) {
    if (!activeProspectList || fromId === toId) return;
    setProspectLists((current) => current.map((list) => {
      if (list.id !== activeProspectList.id) return list;
      const fromIndex = list.records.findIndex((record) => record.id === fromId);
      const toIndex = list.records.findIndex((record) => record.id === toId);
      if (fromIndex < 0 || toIndex < 0) return list;
      const records = [...list.records];
      const [movedRecord] = records.splice(fromIndex, 1);
      records.splice(toIndex, 0, movedRecord);
      return { ...list, records };
    }));
  }

  async function saveProspectToCloud(id: string) {
    if (!workspaceId) {
      toast.error("Aguarde a conexão autenticada do Ritmo antes de salvar esta Empresa.");
      return;
    }
    const list = prospectLists.find((item) => item.records.some((prospect) => prospect.id === id));
    const record = list?.records.find((item) => item.id === id);
    if (!list || !record) return;
    setSavingProspectId(id);
    try {
      await syncCurrentWorkspace();
      toast.success(`Empresa ${record.company.trim() || "sem nome"} salva e confirmada no Supabase.`);
    } catch {
      toast.error("Não foi possível salvar esta Empresa no Supabase.");
    } finally {
      setSavingProspectId(null);
    }
  }

  async function saveProspectsToCloud() {
    if (!workspaceId) {
      toast.error("Aguarde a conexão autenticada do Ritmo antes de salvar Empresas.");
      return;
    }
    setIsProspectSaving(true);
    try {
      await syncCurrentWorkspace();
      toast.success("Empresas salvas no Supabase.");
    } catch {
      toast.error("Não foi possível salvar as Empresas no Supabase.");
    } finally {
      setIsProspectSaving(false);
    }
  }

  function deleteProspect(id: string) {
    if (!activeProspectList) return;
    setProspectLists((current) => current.map((list) => list.id === activeProspectList.id ? { ...list, records: list.records.filter((prospect) => prospect.id !== id) } : list));
    toast.success("Contato removido da lista.");
  }

  function createProspectList() {
    const now = new Date();
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const weekOfMonth = Math.floor((now.getDate() - 1) / 7) + 1;
    const nextList = { id: uniqueId("prospect-list"), name: `Lista - ${monthNames[now.getMonth()]} - Sem ${weekOfMonth}`, records: [] };
    setProspectLists((current) => [...current, nextList]);
    setActiveProspectListId(nextList.id);
    toast.success("Nova lista criada.");
  }

  function renameProspectList(name: string) {
    if (!activeProspectList) return;
    // Preserve the raw input while typing: spaces and an intentionally empty name are valid edit states.
    setProspectLists((current) => current.map((list) => list.id === activeProspectList.id ? { ...list, name } : list));
  }

  function deleteProspectList() {
    if (!activeProspectList) return;
    const confirmed = window.confirm(`Mover a lista "${activeProspectList.name || "sem nome"}" para a Lixeira? Ela poderá ser restaurada por 30 dias.`);
    if (!confirmed) return;
    const deletedList: TrashedProspectList = { ...activeProspectList, deletedAt: new Date().toISOString() };
    const remainingLists = prospectLists.filter((list) => list.id !== activeProspectList.id);
    const nextLists = remainingLists.length ? remainingLists : [{ id: uniqueId("prospect-list"), name: "Lista principal", records: [] }];
    setProspectLists(nextLists);
    setTrashedProspectLists((current) => [deletedList, ...current.filter((list) => list.id !== deletedList.id)]);
    setActiveProspectListId(nextLists[0].id);
    toast.success("Lista movida para a Lixeira por 30 dias.");
  }

  function restoreProspectList(id: string) {
    const trashedList = trashedProspectLists.find((list) => list.id === id);
    if (!trashedList) return;
    const { deletedAt: _deletedAt, ...restoredList } = trashedList;
    setProspectLists((current) => [...current, restoredList]);
    setTrashedProspectLists((current) => current.filter((list) => list.id !== id));
    setActiveProspectListId(restoredList.id);
    toast.success("Lista restaurada.");
  }

  function permanentlyDeleteProspectList(id: string) {
    const trashedList = trashedProspectLists.find((list) => list.id === id);
    if (!trashedList) return;
    if (!window.confirm(`Excluir definitivamente a lista "${trashedList.name || "sem nome"}"? Esta ação não pode ser desfeita.`)) return;
    setTrashedProspectLists((current) => current.filter((list) => list.id !== id));
    toast.success("Lista excluída definitivamente.");
  }

  function selectProspectList(id: string) {
    setActiveProspectListId(id);
  }

  async function sendMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) {
      toast.error("A conexão Supabase ainda não está configurada neste ambiente.");
      return;
    }
    if (!authEmail.trim()) {
      toast.error("Informe seu e-mail para continuar.");
      return;
    }
    setIsAuthSending(true);
    const { error } = await getSupabaseClient().auth.signInWithOtp({
      email: authEmail.trim(),
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setIsAuthSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Enviamos um link de acesso para seu e-mail.");
    setAuthDialogOpen(false);
  }

  async function signOutOfCloud() {
    if (!supabase) return;
    const { error } = await getSupabaseClient().auth.signOut();
    if (error) {
      toast.error("Não foi possível encerrar a sessão.");
      return;
    }
    toast.success("Sessão encerrada. Seus dados continuam salvos na nuvem.");
  }

    function openNewGoal() {
    setGoalOverrideMonth(null);
    setGoalDraft({ ...blankGoal, id: "" });
    setGoalDialogOpen(true);
  }
  function openEditGoal(goal: GoalItem) {
    const sourceGoal = goals.find((item) => item.id === goal.id) ?? goal;
    const override = sourceGoal.recurring ? sourceGoal.monthlyOverrides?.[selectedGoalMonth] : undefined;
    setGoalOverrideMonth(override ? selectedGoalMonth : null);
    setGoalDraft(override ? { ...sourceGoal, target: override.target, actual: override.actual } : sourceGoal);
    setGoalDialogOpen(true);
  }

  function reorderGoals(fromId: string, toId: string) {
    if (fromId === toId) return;
    setIsGoalsSyncConfirmed(false);
    setGoals((current) => {
      const fromIndex = current.findIndex((goal) => goal.id === fromId);
      const toIndex = current.findIndex((goal) => goal.id === toId);
      if (fromIndex < 0 || toIndex < 0) return current;
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next.map((goal, position) => ({ ...goal, position }));
    });
  }

  function moveGoal(goalId: string, direction: "up" | "down") {
    setIsGoalsSyncConfirmed(false);
    setGoals((current) => {
      const index = current.findIndex((goal) => goal.id === goalId);
      const nextIndex = direction === "up" ? index - 1 : index + 1;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next.map((goal, position) => ({ ...goal, position }));
    });
  }

  async function saveGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!goalDraft.title.trim() || goalDraft.target <= 0) {
      toast.error("Dê um nome e um objetivo válido para a meta.");
      return;
    }
    setIsGoalsSyncConfirmed(false);
    let nextGoals: GoalItem[];
    if (goalDraft.id) {
      nextGoals = goals.map((goal) => {
        if (goal.id !== goalDraft.id) return goal;
        if (goalOverrideMonth && goal.recurring) {
          return { ...goal, monthlyOverrides: { ...(goal.monthlyOverrides ?? {}), [goalOverrideMonth]: { target: goalDraft.target, actual: goalDraft.actual } } };
        }
        return { ...goalDraft, monthlyOverrides: goal.monthlyOverrides ?? goalDraft.monthlyOverrides ?? {} };
      });
    } else {
      nextGoals = [{ ...goalDraft, id: uniqueId("goal"), position: 0 }, ...goals.map((goal, index) => ({ ...goal, position: index + 1 }))];
    }
    setGoals(nextGoals);
    setGoalOverrideMonth(null);
    setGoalDialogOpen(false);
    try {
      await saveGoalsToCloud(nextGoals, { notify: false });
      toast.success(goalDraft.id ? (goalOverrideMonth ? `Exceção salva para ${selectedGoalMonth}.` : "Meta atualizada no Supabase.") : "Meta criada e salva no Supabase.");
    } catch {
      // saveGoalsToCloud already reports the persistence error; the local card remains updated.
    }
  }
  async function deleteGoal(goalId: string) {
    setIsGoalsSyncConfirmed(false);
    if (workspaceId && supabase) {
      const { error } = await getSupabaseClient().from("goals").delete().eq("id", goalId);
      if (error) {
        toast.error("Não foi possível remover a meta salva.");
        return;
      }
    }
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

  function openDealDetail(deal: Deal) {
    setDetailDealId(deal.id);
  }

  function updateDealContext(dealId: string, patch: Partial<Deal>) {
    setDeals((current) => current.map((deal) => (deal.id === dealId ? { ...deal, ...patch } : deal)));
  }

  function addDealActivity(deal: Deal, subject: string, dueAt: string) {
    const cleanSubject = subject.trim();
    if (!cleanSubject) {
      toast.error("Dê um título para a atividade.");
      return false;
    }
    const activity: DealActivity = { id: uniqueId("activity"), subject: cleanSubject, dueAt, done: false };
    updateDealContext(deal.id, { activities: [...(deal.activities ?? []), activity], nextActivity: dueAt || cleanSubject });
    toast.success("Atividade programada.");
    return true;
  }

  function toggleDealActivity(deal: Deal, activityId: string) {
    const activities = (deal.activities ?? []).map((activity) => activity.id === activityId ? { ...activity, done: !activity.done } : activity);
    const nextPending = activities.find((activity) => !activity.done);
    updateDealContext(deal.id, { activities, nextActivity: nextPending ? (nextPending.dueAt || nextPending.subject) : "Sem pendências" });
  }

  function addDealNote(deal: Deal, content: string) {
    const cleanContent = content.trim();
    if (!cleanContent) {
      toast.error("Escreva uma observação antes de salvar.");
      return false;
    }
    updateDealContext(deal.id, { notes: [{ id: uniqueId("note"), content: cleanContent, createdAt: new Date().toISOString() }, ...(deal.notes ?? [])] });
    toast.success("Observação adicionada.");
    return true;
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
      setDeals((current) => [{ ...dealDraft, id: uniqueId("deal"), stageHistory: [dealDraft.stageId], stageEvents: [{ stageId: dealDraft.stageId, occurredAt: new Date().toISOString() }] }, ...current]);
      toast.success("Oportunidade criada.");
    }
    setDealDialogOpen(false);
  }

  async function deleteDeal(dealId: string) {
    if (workspaceId && supabase) {
      const { error } = await getSupabaseClient().from("opportunities").delete().eq("id", dealId);
      if (error) {
        toast.error("Não foi possível remover a oportunidade salva.");
        return;
      }
    }
    setDeals((current) => current.filter((deal) => deal.id !== dealId));
    setDealDialogOpen(false);
    toast.success("Oportunidade removida.");
  }

  function clearDragState() {
    document.documentElement.classList.remove("ritmo-dragging-deal");
    setDraggedDealId(null);
    setOverStageId(null);
  }

  function clearStageReorderState() {
    document.documentElement.classList.remove("ritmo-dragging-stage");
    setDraggedStageId(null);
    setOverStageReorderId(null);
  }

  function startStageReorder(event: DragEvent<HTMLElement>, stageId: string) {
    event.stopPropagation();
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/x-ritmo-stage", stageId);
    event.dataTransfer.setData("text/plain", stageId);
    document.documentElement.classList.add("ritmo-dragging-stage");
    setDraggedStageId(stageId);
  }

  function reorderStage(stageId: string, event?: DragEvent<HTMLElement>) {
    event?.preventDefault();
    event?.stopPropagation();
    const sourceId = draggedStageId ?? event?.dataTransfer.getData("application/x-ritmo-stage");
    if (!activeFunnel || !sourceId || sourceId === stageId) {
      clearStageReorderState();
      return;
    }
    setFunnels((current) => current.map((funnel) => {
      if (funnel.id !== activeFunnel.id) return funnel;
      const stages = reorderFunnelStages(funnel.stages, sourceId, stageId);
      return stages === funnel.stages ? funnel : { ...funnel, stages };
    }));
    clearStageReorderState();
    toast.success("Etapas reorganizadas.");
  }

  function allowStageReorder(event: DragEvent<HTMLElement>, stageId: string) {
    const sourceId = draggedStageId ?? event.dataTransfer.getData("application/x-ritmo-stage");
    if (!sourceId) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";
    setOverStageReorderId(stageId);
  }

  function moveDeal(stageId: string, event?: DragEvent<HTMLElement>) {
    event?.preventDefault();
    const dealId = draggedDealId ?? event?.dataTransfer.getData("text/plain");
    if (!dealId || dealId === stageId) return;
    setDeals((current) => current.map((deal) => (deal.id === dealId ? recordStageVisit(deal, stageId) : deal)));
    clearDragState();
    const targetStage = activeFunnel?.stages.find((stage) => stage.id === stageId);
    toast.success(isWonStage(targetStage ?? { id: "", name: "", color: "", probability: 0 }) ? "Oportunidade marcada como ganha." : isLostStage(targetStage ?? { id: "", name: "", color: "", probability: 0 }) ? "Oportunidade marcada como perdida." : `Oportunidade movida para ${targetStage?.name ?? "a etapa"}.`);
  }

  function winDeal(event?: DragEvent<HTMLElement>) {
    event?.preventDefault();
    event?.stopPropagation();
    if (!activeFunnel) return;
    const dealId = draggedDealId ?? event?.dataTransfer.getData("text/plain");
    if (!dealId) return;
    const targetStage = wonStage ?? { id: `${activeFunnel.id}-won`, name: "Ganho", color: "#10A97A", probability: 100 };
    if (!wonStage) {
      setFunnels((current) => current.map((funnel) => funnel.id === activeFunnel.id ? { ...funnel, stages: [...funnel.stages, targetStage] } : funnel));
    }
    setDeals((current) => current.map((deal) => deal.id === dealId ? recordStageVisit(deal, targetStage.id) : deal));
    clearDragState();
    toast.success("Oportunidade marcada como ganha.");
  }

  function loseDeal(event?: DragEvent<HTMLElement>) {
    event?.preventDefault();
    event?.stopPropagation();
    const dealId = draggedDealId ?? event?.dataTransfer.getData("text/plain");
    if (!dealId || !activeFunnel) return;
    const targetStage = lostStage ?? { id: `${activeFunnel.id}-lost`, name: "Perdido", color: "#C55A52", probability: 0 };
    if (!lostStage) {
      setFunnels((current) => current.map((funnel) => funnel.id === activeFunnel.id ? { ...funnel, stages: [...funnel.stages, targetStage] } : funnel));
    }
    setDeals((current) => current.map((deal) => deal.id === dealId ? recordStageVisit(deal, targetStage.id) : deal));
    clearDragState();
    toast.success("Oportunidade marcada como perdida.");
  }

  function startDrag(event: DragEvent<HTMLElement>, dealId: string) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", dealId);
    document.documentElement.classList.add("ritmo-dragging-deal");
    setDraggedDealId(dealId);
  }

  function toggleWorkspaceActivity(deal: Deal, activity: DealActivity) {
    const storedActivity = (deal.activities ?? []).find((item) => item.id === activity.id);
    if (storedActivity) {
      toggleDealActivity(deal, activity.id);
      return;
    }
    updateDealContext(deal.id, { nextActivity: "Sem pendências" });
    toast.success("Atividade concluída.");
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
        { id: `${newFunnelId}-lost`, name: "Perdido", color: "#C55A52", probability: 0 },
      ];
      setFunnels((current) => [...current, { id: newFunnelId, name, currency: "BRL", stages }]);
      setActiveFunnelId(newFunnelId);
      toast.success("Novo funil criado.");
    }
    setFunnelDialogOpen(false);
  }

  async function deleteActiveFunnel() {
    if (!activeFunnel || funnels.length === 1) {
      toast.error("Mantenha pelo menos um funil na sua operação.");
      return;
    }
    if (workspaceId && supabase) {
      const { error } = await getSupabaseClient().from("funnels").delete().eq("id", activeFunnelId);
      if (error) {
        toast.error("Não foi possível remover o funil salvo.");
        return;
      }
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

  async function deleteStage() {
    if (!activeFunnel || !stageDraft.id || activeFunnel.stages.length <= 2) {
      toast.error("Mantenha ao menos duas etapas no funil.");
      return;
    }
    const fallbackStage = activeFunnel.stages.find((stage) => stage.id !== stageDraft.id);
    if (workspaceId && supabase && fallbackStage) {
      const client = getSupabaseClient();
      const { error: moveError } = await client.from("opportunities").update({ stage_id: fallbackStage.id }).eq("stage_id", stageDraft.id);
      if (moveError) {
        toast.error("Não foi possível realocar as oportunidades da etapa.");
        return;
      }
      const { error: deleteError } = await client.from("stages").delete().eq("id", stageDraft.id);
      if (deleteError) {
        toast.error("Não foi possível remover a etapa salva.");
        return;
      }
    }
    setDeals((current) => current.map((deal) => (deal.stageId === stageDraft.id ? { ...deal, stageId: fallbackStage?.id ?? deal.stageId } : deal)));
    setFunnels((current) =>
      current.map((funnel) => (funnel.id === activeFunnel.id ? { ...funnel, stages: funnel.stages.filter((stage) => stage.id !== stageDraft.id) } : funnel)),
    );
    setStageDialogOpen(false);
    toast.success("Etapa removida; oportunidades foram realocadas.");
  }

  const sidebarContent = (
    <>
      <SidebarHeader className="px-2 pb-6 pt-2">
        <div className="flex items-center gap-3 px-1">
          <img className="h-10 w-10 shrink-0 rounded-xl object-cover shadow-[0_10px_22px_rgba(16,169,122,0.18)]" src={logoUrl} alt="Símbolo Ritmo" />
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <div className="font-display flex items-center gap-1 text-[22px] font-extrabold leading-none tracking-[-0.06em] text-[#17201e]">ritmo<span className="h-1.5 w-1.5 rounded-full bg-[#10A97A] shadow-[0_0_0_4px_rgba(16,169,122,0.12)]" /></div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A9792]">receita em foco</div>
          </div>
          <button type="button" onClick={() => setIsSidebarPinned((current) => !current)} className={`ml-auto grid h-8 w-8 place-items-center rounded-lg transition group-data-[collapsible=icon]:hidden ${isSidebarPinned ? "bg-[#E8F6F0] text-[#087E5A]" : "text-[#7B8882] hover:bg-[#F0F3EF]"}`} aria-label={isSidebarPinned ? "Desafixar barra lateral" : "Fixar barra lateral"}>
            <Pin size={15} className={isSidebarPinned ? "fill-current" : ""} />
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup className="p-0">
          <SidebarMenu>
            <SidebarItem icon={<Target size={19} />} label="Planos e Metas" active={page === "goals"} onClick={() => selectPage("goals")} />
            <SidebarItem icon={<GitBranch size={19} />} label="Funis" active={page === "pipeline"} onClick={() => selectPage("pipeline")} />
            <SidebarItem icon={<Users size={19} />} label="Pessoas" active={page === "people"} onClick={() => selectPage("people")} />
            <SidebarItem icon={<Calendar size={19} />} label="Atividades" active={page === "activities"} onClick={() => selectPage("activities")} />
            <SidebarItem icon={<ClipboardList size={19} />} label="Empresas" active={page === "prospecting"} onClick={() => selectPage("prospecting")} />
            <SidebarItem icon={<CircleDollarSign size={19} />} label="Financeiro" active={page === "finance"} onClick={() => selectPage("finance")} />
            <SidebarItem icon={<BriefcaseBusiness size={19} />} label="Serviços" active={page === "services"} onClick={() => selectPage("services")} />
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-7 p-0">
          <SidebarGroupLabel className="px-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#9AA59F] group-data-[collapsible=icon]:hidden">Visões</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarItem icon={<Settings size={18} />} label="Configurações" onClick={() => toast.info("Configurações do workspace em breve.")} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-3 px-2 pb-3">
        <div className="rounded-2xl bg-[#E8F6F0] p-4 group-data-[collapsible=icon]:hidden">
          <div className="mb-2 flex items-center gap-2 text-[#087E5A]"><Sparkles size={16} /><span className="text-xs font-extrabold">Pulso comercial</span></div>
          <p className="text-xs font-medium leading-5 text-[#315C4D]">Sua cadência está <strong>18% à frente</strong> do planejado.</p>
          <button onClick={() => setPage("goals")} className="mt-3 flex items-center gap-1 text-xs font-bold text-[#087E5A]">Ver metas <ArrowUpRight size={13} /></button>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Workspace conectado" className="h-auto rounded-xl px-2 py-2 text-left hover:bg-[#F0F3EF]">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#18201E] text-[9px] font-bold text-white">{accountEmail ? accountEmail.slice(0, 2).toUpperCase() : "AR"}</span>
              <span className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden"><span className="block truncate text-sm font-bold text-[#27302D]">Workspace conectado</span><span className="block truncate text-xs text-[#87928D]">Sincronização automática com Supabase</span></span>
              <ChevronDown className="h-4 w-4 text-[#87928D] group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );

  if (!supabaseSession) return <RitmoAuthScreen />;

  return (
    <SidebarProvider open={isSidebarPinned || isSidebarHovering} onOpenChange={setIsSidebarPinned} data-sidebar-pinned={isSidebarPinned} className="min-h-screen bg-[#F6F5F1] text-[#1B2522]">
      <Sidebar collapsible="icon" className="border-r border-[#E3E6E0] bg-[#FBFBF9] px-2 py-5" onMouseEnter={() => setIsSidebarHovering(true)} onMouseLeave={() => setIsSidebarHovering(false)}>
        {sidebarContent}
      </Sidebar>

      <div className="fixed inset-x-0 top-0 z-20 flex h-[68px] items-center justify-between border-b border-[#E3E6E0] bg-[#FBFBF9]/95 px-4 backdrop-blur md:hidden">
        <SidebarTrigger className="h-10 w-10 rounded-xl border border-[#E3E6E0] bg-white text-[#27302D] hover:bg-[#F0F3EF]" aria-label="Abrir menu" />
        <div className="flex items-center gap-2">
          <img className="h-8 w-8 rounded-lg" src={logoUrl} alt="" />
          <span className="font-display text-lg font-extrabold tracking-[-0.06em]">ritmo</span>
        </div>
        <button onClick={page === "goals" ? openNewGoal : page === "prospecting" || page === "people" ? addProspect : page === "finance" ? addFinanceEntry : page === "services" ? addService : openNewDeal} className="grid h-10 w-10 place-items-center rounded-xl bg-[#10A97A] text-white" aria-label="Criar">
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <main className="min-h-screen min-w-0 flex-1">
        {page === "goals" ? (
          <GoalsWorkspace
            goals={computedGoals}
            averageGoalProgress={averageGoalProgress}
            selectedMonth={selectedGoalMonth}
            onSelectedMonthChange={setSelectedGoalMonth}
            onNewGoal={openNewGoal}
            onOpenPipeline={() => setPage("pipeline")}
            onEditGoal={openEditGoal}
            onDeleteGoal={deleteGoal}
            onReorderGoals={reorderGoals}
            cadenceBlocks={cadenceBlocks}
            onAddCadenceBlock={addCadenceBlock}
            onMoveCadenceBlock={moveCadenceBlock}
            onEditCadenceBlock={editCadenceBlock}
            onDeleteCadenceBlock={deleteCadenceBlock}
            simulationStages={goalSimulationStages}
            services={services}
            funnels={funnels}
            onAddSimulationStage={() => {
              setIsGoalsSyncConfirmed(false);
              const nextStage: GoalSimulationStage = { id: uniqueId("goal-simulation-stage"), name: "Nova etapa", color: "#10A97A", probability: 50, projectionMode: "percentual", fixedValue: 0, productId: "", conversionStageId: "", conversionRate: 50, revenueBase: "produto", averageTicket: 0 };
              setGoalSimulationStages((current) => [...current, nextStage]);
              toast.success("Etapa da simulação adicionada.");
            }}
            onUpdateSimulationStage={(id, field, value) => {
              setIsGoalsSyncConfirmed(false);
              setGoalSimulationStages((current) => current.map((stage) => {
                if (stage.id !== id) return stage;
                const nextValue = field === "probability" || field === "conversionRate" ? Math.min(100, Math.max(0, Number(value) || 0)) : field === "fixedValue" || field === "averageTicket" ? Math.max(0, Number(value) || 0) : value;
                return { ...stage, [field]: nextValue };
              }));
            }}
            onDeleteSimulationStage={(id) => { setIsGoalsSyncConfirmed(false); setGoalSimulationStages((current) => {
              if (current.length <= 2) { toast.info("Mantenha pelo menos duas etapas na simulação."); return current; }
              toast.success("Etapa da simulação removida.");
              return current.filter((stage) => stage.id !== id);
            }); }}
            onSave={saveGoalsToCloud}
            isSaving={isGoalsSaving}
            syncConfirmed={isGoalsSyncConfirmed}
          />
        ) : page === "pipeline" ? (
          <PipelineWorkspace
            funnels={funnels}
            activeFunnel={activeFunnel}
            activeFunnelId={activeFunnelId}
            deals={openDeals}
            wonDeals={wonDeals}
            lostDeals={lostDeals}
            wonStage={wonStage}
            lostStage={lostStage}
            totalPipeline={totalPipeline}
            weightedPipeline={weightedPipeline}
            draggedDealId={draggedDealId}
            overStageId={overStageId}
            onSelectFunnel={setActiveFunnelId}
            onNewFunnel={openNewFunnel}
            onEditFunnel={openEditFunnel}
            onNewDeal={openNewDeal}
            onEditDeal={openDealDetail}
            draggedStageId={draggedStageId}
            overStageReorderId={overStageReorderId}
            onStageDragStart={startStageReorder}
            onStageDragOver={allowStageReorder}
            onStageDrop={reorderStage}
            onStageDragEnd={clearStageReorderState}
            onDeleteDeal={(deal) => setDeleteDealId(deal.id)}
            onNewStage={openNewStage}
            onEditStage={openEditStage}
            onDragStart={startDrag}
            onDrop={moveDeal}
            onWinDrop={winDeal}
            onLoseDrop={loseDeal}
            onDragOver={allowDrop}
            onDragEnd={clearDragState}
          />
        ) : page === "activities" ? (
          <ActivitiesWorkspace deals={openDeals} onToggleActivity={toggleWorkspaceActivity} onOpenDeal={openDealDetail} />
        ) : page === "people" ? (
          <PeopleWorkspace lists={prospectLists.filter((list) => !list.deletedAt)} onUpdate={updatePersonFromPeople} onSave={saveProspectToCloud} savingPersonId={savingProspectId} />
        ) : page === "finance" ? (
          <FinanceWorkspace entries={financeEntries} onAdd={addFinanceEntry} onUpdate={updateFinanceEntry} onDelete={deleteFinanceEntry} />
        ) : page === "services" ? (
          <ServicesWorkspace services={services} onAdd={addService} onUpdate={updateService} onDelete={deleteService} onSave={saveService} onReorder={reorderServices} savingServiceId={savingServiceId} />
        ) : (
          <ProspectingWorkspace lists={prospectLists} trashedLists={trashedProspectLists} funnels={funnels} activeListId={activeProspectList?.id ?? ""} activeListName={activeProspectList?.name ?? "Lista principal"} prospects={prospects} onSelectList={selectProspectList} onCreateList={createProspectList} onRenameList={renameProspectList} onDeleteList={deleteProspectList} onRestoreList={restoreProspectList} onPermanentDeleteList={permanentlyDeleteProspectList} onAdd={addProspect} onUpdate={updateProspect} onReorder={reorderProspects} onDelete={deleteProspect} onImportList={importProspectList} onSave={saveProspectsToCloud} onSaveProspect={saveProspectToCloud} isSaving={isProspectSaving} savingProspectId={savingProspectId} onConnect={() => setAuthDialogOpen(true)} />
        )}
      </main>

      <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
        <DialogContent className="grid-rows-[auto_minmax(0,1fr)] max-h-[calc(100vh-2rem)] max-w-[520px] overflow-hidden border-[#E2E7E0] bg-[#FCFCFA] p-0">
          <div className="border-b border-[#E8ECE6] px-6 py-5">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl tracking-[-0.04em]">{goalDraft.id ? "Editar meta" : "Criar nova meta"}</DialogTitle>
              <DialogDescription>Defina o resultado que orientará a sua cadência no período.</DialogDescription>
            </DialogHeader>
          </div>
          <form onSubmit={saveGoal} className="min-h-0 space-y-5 overflow-y-auto overscroll-contain px-6 py-6">
            <FormField label="Nome da meta"><Input value={goalDraft.title} onChange={(event) => setGoalDraft({ ...goalDraft, title: event.target.value })} placeholder="Ex.: Propostas enviadas" /></FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Tipo">
                <select className="form-select" value={goalDraft.type} onChange={(event) => setGoalDraft({ ...goalDraft, type: event.target.value as GoalType })}>
                  <option>Prospecção</option><option>Vendas</option>
                </select>
              </FormField>
              <FormField label="Tipo de projeção">
                <select className="form-select" value={goalDraft.unit} onChange={(event) => setGoalDraft({ ...goalDraft, unit: event.target.value as GoalUnit })}>
                  <option value="%">% (percentual)</option><option value="R$">R$ (valor financeiro)</option>{goalDraft.unit === "atividades" && <option value="atividades">Quantidade (meta antiga)</option>}
                </select>
                <p className="mt-1 text-xs text-[#7D8983]">Escolha como o objetivo e o realizado serão projetados.</p>
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Objetivo"><Input min="1" type="number" value={goalDraft.target || ""} onChange={(event) => setGoalDraft({ ...goalDraft, target: Number(event.target.value) })} placeholder="0" /></FormField>
              <FormField label="Realizado até agora"><Input min="0" type="number" value={goalDraft.actual || ""} disabled={Boolean(goalDraft.linkedStageId)} onChange={(event) => setGoalDraft({ ...goalDraft, actual: Number(event.target.value) })} placeholder="0" />{goalDraft.linkedStageId && <p className="mt-1 text-xs text-[#7D8983]">Atualizado automaticamente pelo funil vinculado.</p>}</FormField>
            </div>
            <div className="grid gap-4 sm:grid-cols-2"><FormField label="Periodicidade"><select className="form-select" value={goalDraft.cadence} onChange={(event) => { const cadence = event.target.value as GoalCadence; setGoalDraft({ ...goalDraft, cadence, period: goalPeriodInputValue({ ...goalDraft, cadence }) }); }}><option>Diária</option><option>Semanal</option><option>Mensal</option></select></FormField><FormField label={goalDraft.cadence === "Mensal" ? "Mês da meta" : goalDraft.cadence === "Semanal" ? "Semana da meta" : "Dia da meta"}><Input type={goalPeriodInputType(goalDraft.cadence)} value={goalPeriodInputValue(goalDraft)} onChange={(event) => setGoalDraft({ ...goalDraft, period: event.target.value })} aria-label="Selecionar período da meta" className="bg-white" /></FormField></div>
            <label className="flex items-center gap-3 rounded-xl border border-[#DDE8E1] bg-[#F5FAF7] px-3 py-3 text-sm font-semibold text-[#35403B]"><input type="checkbox" checked={goalDraft.recurring} onChange={(event) => { const recurring = event.target.checked; setGoalDraft({ ...goalDraft, recurring }); if (!recurring) setGoalOverrideMonth(null); }} className="h-4 w-4 accent-[#10A97A]" />Meta recorrente<span className="ml-auto text-xs font-medium text-[#7D8983]">Repete sem duplicar</span></label>
            {goalDraft.id && goalDraft.recurring && <label className="flex items-center gap-3 rounded-xl border border-[#DDE8E1] bg-[#FFF9E8] px-3 py-3 text-sm font-semibold text-[#35403B]"><input type="checkbox" checked={goalOverrideMonth === selectedGoalMonth} onChange={(event) => { if (event.target.checked) { const effective = goalValuesForMonth(goalDraft, selectedGoalMonth); setGoalDraft({ ...goalDraft, target: effective.target, actual: effective.actual }); setGoalOverrideMonth(selectedGoalMonth); } else { const baseGoal = goals.find((goal) => goal.id === goalDraft.id); if (baseGoal) setGoalDraft(baseGoal); setGoalOverrideMonth(null); } }} className="h-4 w-4 accent-[#C88920]" />Personalizar apenas {selectedGoalMonth}<span className="ml-auto text-xs font-medium text-[#8A6D2A]">Não altera a recorrência</span></label>}
            <FormField label="Atualização automática pelo funil"><select className="form-select" value={goalDraft.linkedStageId ?? ""} onChange={(event) => { const stageId = event.target.value; const funnel = funnels.find((item) => item.stages.some((stage) => stage.id === stageId)); setGoalDraft({ ...goalDraft, linkedStageId: stageId, linkedFunnelId: funnel?.id ?? "" }); }}><option value="">Sem vínculo automático</option>{funnels.flatMap((funnel) => funnel.stages.map((stage) => <option key={`${funnel.id}-${stage.id}`} value={stage.id}>{funnel.name} · {stage.name}</option>))}</select><p className="mt-1 text-xs text-[#7D8983]">Cada oportunidade conta uma vez quando entra na etapa escolhida.</p></FormField>
            <div className="sticky bottom-0 z-10 -mx-6 flex items-center justify-between border-t border-[#E8ECE6] bg-[#FCFCFA]/95 px-6 pb-1 pt-5 backdrop-blur">
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

      <Dialog open={deleteDealId !== null} onOpenChange={(open) => { if (!open) setDeleteDealId(null); }}>
        <DialogContent className="max-w-[430px] border-[#E2E7E0] bg-[#FCFCFA] p-0">
          <div className="border-b border-[#E8ECE6] px-6 py-5"><DialogHeader><DialogTitle className="font-display text-2xl tracking-[-0.04em]">Excluir oportunidade?</DialogTitle><DialogDescription>Esta ação remove o negócio do funil e não pode ser desfeita.</DialogDescription></DialogHeader></div>
          <div className="space-y-5 px-6 py-6"><div className="rounded-2xl bg-[#F3F5F1] p-4"><p className="font-display font-extrabold text-[#27302D]">{pendingDeleteDeal?.title ?? "Oportunidade selecionada"}</p><p className="mt-1 text-sm text-[#718079]">{pendingDeleteDeal?.company ?? ""}</p></div><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setDeleteDealId(null)}>Cancelar</Button><Button type="button" className="bg-[#B04A43] text-white hover:bg-[#8F3933]" onClick={() => { if (deleteDealId) void deleteDeal(deleteDealId); setDeleteDealId(null); }}>Excluir oportunidade</Button></div></div>
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

      <DealDetailDialog
        deal={detailDeal}
        open={Boolean(detailDeal)}
        onOpenChange={(open) => !open && setDetailDealId(null)}
        onUpdate={(patch) => detailDeal && updateDealContext(detailDeal.id, patch)}
        onAddActivity={(subject, dueAt) => detailDeal ? addDealActivity(detailDeal, subject, dueAt) : false}
        onToggleActivity={(activityId) => detailDeal && toggleDealActivity(detailDeal, activityId)}
        onAddNote={(content) => detailDeal ? addDealNote(detailDeal, content) : false}
        onEditOpportunity={() => detailDeal && openEditDeal(detailDeal)}
      />

      {false && <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
        <DialogContent className="max-w-[460px] border-[#E2E7E0] bg-[#FCFCFA] p-0">
          <div className="border-b border-[#E8ECE6] px-6 py-5"><DialogHeader><DialogTitle className="font-display text-2xl tracking-[-0.04em]">Conectar ao Ritmo</DialogTitle><DialogDescription>Use seu e-mail para abrir um espaço comercial protegido e sincronizado no Supabase.</DialogDescription></DialogHeader></div>
          <form onSubmit={sendMagicLink} className="space-y-5 px-6 py-6"><FormField label="Seu e-mail"><Input type="email" autoFocus value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="voce@empresa.com" /></FormField><div className="flex justify-end gap-2 border-t border-[#E8ECE6] pt-5"><Button type="button" variant="outline" onClick={() => setAuthDialogOpen(false)}>Cancelar</Button><Button disabled={isAuthSending} type="submit" className="bg-[#10A97A] hover:bg-[#087E5A]">{isAuthSending ? "Enviando..." : "Enviar link de acesso"}</Button></div></form>
        </DialogContent>
      </Dialog>}
    </SidebarProvider>
  );
}

function SidebarItem({ icon, label, active = false, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return <SidebarMenuItem><SidebarMenuButton tooltip={label} isActive={active} onClick={onClick} className={`sidebar-link h-11 w-full ${active ? "sidebar-link-active" : ""}`}>{icon}<span>{label}</span>{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#10A97A] group-data-[collapsible=icon]:hidden" />}</SidebarMenuButton></SidebarMenuItem>;
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#63706B]">{label}</Label>{children}</div>;
}

function DealDetailDialog({ deal, open, onOpenChange, onUpdate, onAddActivity, onToggleActivity, onAddNote, onEditOpportunity }: { deal?: Deal; open: boolean; onOpenChange: (open: boolean) => void; onUpdate: (patch: Partial<Deal>) => void; onAddActivity: (subject: string, dueAt: string) => boolean | void; onToggleActivity: (activityId: string) => void; onAddNote: (content: string) => boolean | void; onEditOpportunity: () => void }) {
  const [activitySubject, setActivitySubject] = useState("");
  const [activityDueAt, setActivityDueAt] = useState("");
  const [noteDraft, setNoteDraft] = useState("");

  useEffect(() => {
    if (open) {
      setActivitySubject("");
      setActivityDueAt("");
      setNoteDraft("");
    }
  }, [deal?.id, open]);

  if (!deal) return null;
  const companyData = deal.companyData ?? {};
  const activities = deal.activities ?? [];
  const notes = deal.notes ?? [];
  const openActivities = activities.filter((activity) => !activity.done);

  function updateCompany(field: keyof CompanyData, value: string) {
    onUpdate({ companyData: { ...companyData, [field]: value } });
  }

  function submitActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (onAddActivity(activitySubject, activityDueAt)) {
      setActivitySubject("");
      setActivityDueAt("");
    }
  }

  function submitNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (onAddNote(noteDraft)) setNoteDraft("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="detail-dialog max-h-[calc(100vh-2rem)] max-w-[calc(100vw-1.5rem)] gap-0 overflow-hidden border-[#DCE6DE] bg-[#FCFCFA] p-0 sm:max-w-[calc(100vw-4rem)] sm:rounded-3xl xl:max-w-[1240px]">
        <div className="border-b border-[#E5EBE5] px-5 py-4 sm:px-7">
          <div className="flex flex-wrap items-start justify-between gap-4 pr-7">
            <div className="min-w-0"><div className="mb-2 flex items-center gap-2"><span className="tag-chip">{deal.tag}</span><span className="text-xs font-medium text-[#7A8881]">{deal.company}</span></div><DialogTitle className="font-display text-[24px] font-extrabold tracking-[-0.05em] text-[#1B2522] sm:text-[28px]">{deal.title}</DialogTitle><DialogDescription className="mt-1">Detalhe comercial, relacionamento e próximos movimentos em um só lugar.</DialogDescription></div>
            <div className="flex items-center gap-2"><div className="hidden rounded-xl border border-[#DDE5DE] bg-white px-3 py-2 text-right sm:block"><p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#7B8882]">Valor</p><p className="mt-0.5 text-sm font-extrabold text-[#1B2522]">{formatCurrency(deal.value)}</p></div><Button type="button" variant="outline" onClick={onEditOpportunity} className="h-10 gap-2 border-[#DCE5DE] bg-white text-[#44524C] hover:text-[#087E5A]"><Pencil size={15} />Editar</Button></div>
          </div>
        </div>

        <div className="grid max-h-[calc(100vh-10.5rem)] overflow-y-auto lg:grid-cols-[minmax(0,1.55fr)_minmax(360px,0.95fr)]">
          <div className="space-y-7 border-b border-[#E5EBE5] p-5 sm:p-7 lg:border-b-0 lg:border-r lg:p-8">
            <section>
              <div className="mb-3 flex items-center justify-between"><div><p className="eyebrow">Próxima ação</p><h3 className="font-display text-lg font-extrabold tracking-[-0.035em] text-[#27302D]">Atividades</h3></div><span className="rounded-full bg-[#E8F6F0] px-2.5 py-1 text-[10px] font-extrabold text-[#087E5A]">{openActivities.length} em aberto</span></div>
              <form onSubmit={submitActivity} className="activity-composer grid gap-2 rounded-2xl border border-[#DCE7DF] bg-[#F5F8F5] p-3 sm:grid-cols-[minmax(0,1fr)_170px_auto]">
                <Input value={activitySubject} onChange={(event) => setActivitySubject(event.target.value)} placeholder="Ex.: Ligar para validar proposta" className="border-[#DCE7DF] bg-white" />
                <Input type="datetime-local" value={activityDueAt} onChange={(event) => setActivityDueAt(event.target.value)} className="border-[#DCE7DF] bg-white" />
                <Button type="submit" className="h-10 bg-[#10A97A] px-3 hover:bg-[#087E5A]"><Plus size={17} /></Button>
              </form>
              <div className="mt-3 space-y-2">
                {activities.length ? activities.map((activity) => <button key={activity.id} type="button" onClick={() => onToggleActivity(activity.id)} className="flex w-full items-center gap-3 rounded-xl border border-[#E7ECE7] bg-white px-3 py-3 text-left transition hover:border-[#C8DCD0] hover:bg-[#FBFCF9]">{activity.done ? <CheckCircle2 size={18} className="shrink-0 text-[#10A97A]" /> : <Circle size={18} className="shrink-0 text-[#A0AEA6]" />}<span className="min-w-0 flex-1"><span className={`block truncate text-sm font-bold ${activity.done ? "text-[#8A9690] line-through" : "text-[#35403B]"}`}>{activity.subject}</span><span className="mt-0.5 block text-xs text-[#819088]">{activity.dueAt ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(activity.dueAt)) : "Sem horário definido"}</span></span></button>) : <div className="rounded-xl border border-dashed border-[#D4DED6] bg-[#FBFCF9] p-4 text-sm text-[#7B8982]">Nenhuma atividade cadastrada. Use a barra acima para registrar o próximo passo.</div>}
              </div>
            </section>

            <section className="border-t border-[#E6ECE6] pt-6">
              <div className="mb-3"><p className="eyebrow">Histórico livre</p><h3 className="font-display text-lg font-extrabold tracking-[-0.035em] text-[#27302D]">Observações</h3></div>
              <form onSubmit={submitNote} className="rounded-2xl border border-[#DCE7DF] bg-[#F8FAF8] p-3"><textarea value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} rows={3} placeholder="Registre contexto, objeções, acordos ou próximos passos..." className="w-full resize-none bg-transparent text-sm leading-6 text-[#34413B] outline-none placeholder:text-[#9BA7A0]" /><div className="mt-3 flex justify-end border-t border-[#E1E8E2] pt-3"><Button type="submit" size="sm" className="gap-2 bg-[#18201E] hover:bg-[#087E5A]"><ClipboardList size={15} />Adicionar nota</Button></div></form>
              <div className="mt-3 space-y-2">{notes.map((note) => <article key={note.id} className="rounded-xl border border-[#E6ECE6] bg-white p-3"><p className="whitespace-pre-wrap text-sm leading-6 text-[#46534D]">{note.content}</p><p className="mt-2 text-[10px] font-bold uppercase tracking-[0.11em] text-[#8A9690]">{new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(note.createdAt))}</p></article>)}{notes.length === 0 && <p className="px-1 text-sm text-[#829087]">As observações da negociação aparecerão aqui.</p>}</div>
            </section>
          </div>

          <aside className="space-y-7 bg-[#F8FAF8] p-5 sm:p-7 lg:p-8">
            <section><div className="mb-3 flex items-center gap-2"><Users size={16} className="text-[#087E5A]" /><div><p className="eyebrow">Pessoa</p><h3 className="font-display text-base font-extrabold tracking-[-0.035em] text-[#27302D]">Contato principal</h3></div></div><div className="grid gap-3"><FormField label="Nome"><Input value={deal.contactName ?? ""} onChange={(event) => onUpdate({ contactName: event.target.value })} placeholder="Nome do contato" /></FormField><FormField label="Cargo"><Input value={deal.contactRole ?? ""} onChange={(event) => onUpdate({ contactRole: event.target.value })} placeholder="Ex.: Head de operações" /></FormField><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1"><FormField label="E-mail"><Input type="email" value={deal.contactEmail ?? ""} onChange={(event) => onUpdate({ contactEmail: event.target.value })} placeholder="contato@empresa.com" /></FormField><FormField label="Telefone"><Input value={deal.contactPhone ?? ""} onChange={(event) => onUpdate({ contactPhone: event.target.value })} placeholder="(11) 99999-9999" /></FormField></div></div></section>
            <section className="border-t border-[#E1E8E2] pt-6"><div className="mb-3 flex items-center gap-2"><Building2 size={16} className="text-[#087E5A]" /><div><p className="eyebrow">Organização</p><h3 className="font-display text-base font-extrabold tracking-[-0.035em] text-[#27302D]">Dados da empresa</h3></div></div><div className="grid gap-3"><FormField label="Empresa"><Input value={deal.company} onChange={(event) => onUpdate({ company: event.target.value })} placeholder="Nome da organização" /></FormField><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1"><FormField label="Segmento"><Input value={companyData.industry ?? ""} onChange={(event) => updateCompany("industry", event.target.value)} placeholder="Ex.: Tecnologia" /></FormField><FormField label="Porte"><Input value={companyData.size ?? ""} onChange={(event) => updateCompany("size", event.target.value)} placeholder="Ex.: 51–200" /></FormField></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1"><FormField label="Cidade"><Input value={companyData.city ?? ""} onChange={(event) => updateCompany("city", event.target.value)} placeholder="Ex.: São Paulo" /></FormField><FormField label="Site"><Input value={companyData.website ?? ""} onChange={(event) => updateCompany("website", event.target.value)} placeholder="empresa.com.br" /></FormField></div></div></section>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GoalsWorkspace({ goals, averageGoalProgress, selectedMonth, onSelectedMonthChange, onNewGoal, onOpenPipeline, onEditGoal, onDeleteGoal, onReorderGoals, cadenceBlocks, onAddCadenceBlock, onMoveCadenceBlock, onEditCadenceBlock, onDeleteCadenceBlock, simulationStages, services, funnels, onAddSimulationStage, onUpdateSimulationStage, onDeleteSimulationStage, onSave, isSaving, syncConfirmed }: { goals: GoalItem[]; averageGoalProgress: number; selectedMonth: string; onSelectedMonthChange: (month: string) => void; onNewGoal: () => void; onOpenPipeline: () => void; onEditGoal: (goal: GoalItem) => void; onDeleteGoal: (id: string) => void; onReorderGoals: (fromId: string, toId: string) => void; cadenceBlocks: CadenceBlock[]; onAddCadenceBlock: (day: number, slot: CadenceSlot, details?: Pick<CadenceBlock, "title" | "channel" | "notes">) => void; onMoveCadenceBlock: (id: string, day: number, slot: CadenceSlot) => void; onEditCadenceBlock: (block: CadenceBlock) => void; onDeleteCadenceBlock: (id: string) => void; simulationStages: GoalSimulationStage[]; services: Service[]; funnels: SalesFunnel[]; onAddSimulationStage: () => void; onUpdateSimulationStage: (id: string, field: "name" | "color" | "probability" | "projectionMode" | "fixedValue" | "productId" | "conversionStageId" | "conversionRate" | "revenueBase" | "averageTicket", value: string | number) => void; onDeleteSimulationStage: (id: string) => void; onSave: () => void | Promise<void>; isSaving: boolean; syncConfirmed: boolean }) {
  const daysRemaining = daysUntilMonthEnd();
  const currentMonth = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date(`${selectedMonth}-01T12:00:00`));
  const calendar = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const leadingBlanks = (firstDay.getDay() + 6) % 7;
    return {
      year,
      month,
      holidays: brazilianNationalHolidays(year),
      days: Array.from({ length: leadingBlanks + daysInMonth }, (_, index) => index < leadingBlanks ? null : index - leadingBlanks + 1),
    };
  }, [selectedMonth]);

  return <div className="goals-page pt-[68px] md:pt-0">
    <header className="goals-header bg-transparent">
      <div className="goals-header-inner flex min-h-[72px] items-center justify-between gap-4 px-5 py-3 md:px-10">
        <div className="min-w-0">
          <p className="eyebrow">Planejamento comercial</p>
          <h1 className="page-title !mt-0 text-[26px] sm:text-[30px]">Planos e Metas</h1>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <label className="flex h-9 items-center gap-2 rounded-lg border border-[#DDE8E0] bg-white px-2.5 text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#6E7C74]">
            Mês
            <Input type="month" value={selectedMonth} onChange={(event) => onSelectedMonthChange(event.target.value)} className="h-7 w-[122px] border-0 bg-transparent p-0 text-xs font-bold normal-case tracking-normal text-[#1B2522] shadow-none focus-visible:ring-0" aria-label="Filtrar mês das metas" />
          </label>
          <button className="tool-button h-9 rounded-lg px-2.5 text-xs" onClick={onOpenPipeline}><Search size={15} /><span className="hidden sm:inline">Ver funil</span></button>
          <Button onClick={onNewGoal} className="h-9 gap-1.5 rounded-lg bg-[#10A97A] px-3 text-xs font-extrabold hover:bg-[#087E5A]"><Plus size={15} />Nova meta</Button>
        </div>
      </div>
    </header>

    <main className="goals-content space-y-4 px-5 pb-10 pt-2 md:px-10">
      <section className="grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_300px]" aria-label="Metas do período e fechamento do mês">
        <div className="goals-overview">
          <div className="goals-overview-head mb-2.5 flex items-center justify-between gap-3">
            <div className="min-w-0"><p className="eyebrow">Metas do período</p><p className="mt-0.5 text-xs font-semibold text-[#6F7E75]">Acompanhe o avanço sem perder o ritmo.</p></div>
            <div className="shrink-0 rounded-full border border-[#D8E9DF] bg-[#F0F8F3] px-2.5 py-1 text-[10px] font-extrabold text-[#087E5A]">Média {averageGoalProgress}%</div>
          </div>
          <div className="goals-grid">
            {goals.map((goal) => {
              const displayGoal = goalValuesForMonth(goal, selectedMonth);
              const progress = progressOf(displayGoal);
              const remaining = Math.max(displayGoal.target - displayGoal.actual, 0);
              return <article key={goal.id} draggable onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", goal.id); }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const fromId = event.dataTransfer.getData("text/plain"); if (fromId) onReorderGoals(fromId, goal.id); }} className="goal-compact-card group cursor-grab active:cursor-grabbing">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-1.5"><span className="pulse-dot h-1.5 w-1.5 shadow-[0_0_0_3px_rgba(141,226,196,0.13)]" /><span className="truncate text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#718078]">{goal.cadence}</span>{goal.recurring && <span className="rounded-full bg-[#E7F5EF] px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.08em] text-[#087E5E]">Recorrente</span>}</div>
                  <div className="flex items-center gap-0.5"><span className="mr-1 text-[10px] font-extrabold text-[#087E5A]">{progress}%</span><button type="button" onClick={() => onEditGoal(goal)} className="icon-button h-6 w-6 opacity-60 transition hover:opacity-100" aria-label={`Editar ${goal.title}`}><Pencil size={12} /></button><button type="button" onClick={() => onDeleteGoal(goal.id)} className="icon-button h-6 w-6 text-[#B04D45] opacity-60 transition hover:opacity-100" aria-label={`Excluir ${goal.title}`}><Trash2 size={12} /></button></div>
                </div>
                <div className="goal-card-main">
                  <div className="goal-meter goal-meter-compact shrink-0" style={{ "--progress": `${progress * 3.6}deg` } as React.CSSProperties}><span>{progress}%</span></div>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold tracking-[-0.02em] text-[#27302D]">{goal.title}</p><p className="mt-0.5 font-display text-[19px] font-extrabold tracking-[-0.055em] text-[#1B2522]">{formatGoalValue(displayGoal.actual, displayGoal.unit)}<span className="ml-1 text-[11px] font-bold text-[#85918B]">/ {formatGoalValue(displayGoal.target, displayGoal.unit)}</span></p></div>
                </div>
                <div className="goal-card-progress"><div className="goal-card-progress-bar" style={{ width: `${progress}%` }} /></div>
                <div className="goal-card-foot"><p className="text-[9px] font-medium text-[#85918B]">Faltam {formatGoalValue(remaining, displayGoal.unit)}</p><span className="inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-[0.1em] text-[#A0ACA5]" title="Arraste para reorganizar"><GripVertical size={11} />Mover</span></div>
              </article>;
            })}
            {goals.length === 0 && <button onClick={onNewGoal} className="flex min-h-[96px] items-center justify-center gap-2 rounded-xl border border-dashed border-[#C9DED0] bg-[#F5FBF7] text-sm font-bold text-[#087E5A]"><CirclePlus size={17} />Criar primeira meta</button>}
          </div>
        </div>

        <aside className="calendar-compact-card">
          <div className="flex items-start justify-between gap-2"><div><div className="flex items-center gap-1.5"><span className="pulse-dot h-1.5 w-1.5 bg-[#C88920] shadow-[0_0_0_3px_rgba(200,137,32,0.12)]" /><span className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#8A651D]">Fechamento do mês</span></div><p className="mt-1 font-display text-[19px] font-extrabold leading-none tracking-[-0.06em] text-[#6B4D12]">{daysRemaining} {daysRemaining === 1 ? "dia útil" : "dias úteis"}</p><p className="mt-0.5 text-[9px] font-semibold capitalize text-[#8A6D2A]">restantes em {currentMonth}</p></div><span className="rounded-full bg-[#FFF8E8] px-2 py-1 text-[8px] font-extrabold uppercase tracking-[0.08em] text-[#A87520]">Calendário</span></div>
          <div className="mt-2 rounded-xl border border-[#E7C983] bg-[#FFF8E8] p-1.5"><div className="grid grid-cols-7 gap-x-1 gap-y-0.5 text-center text-[8px] font-bold leading-3 text-[#A87520]"><div className="contents">{["S", "T", "Q", "Q", "S", "S", "D"].map((day, index) => <span key={`weekday-${index}`} className={`text-[8px] uppercase tracking-[0.1em] ${index >= 5 ? "font-black text-[#C62828]" : "text-[#8C641D]"}`}>{day}</span>)}</div>{calendar.days.map((day, index) => { const date = day === null ? null : new Date(calendar.year, calendar.month - 1, day); const isWeekend = Boolean(date && (date.getDay() === 0 || date.getDay() === 6)); const isHoliday = Boolean(date && calendar.holidays.has(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`)); const isRedDay = isWeekend || isHoliday; const isToday = Boolean(date && day === new Date().getDate() && selectedMonth === new Date().toISOString().slice(0, 7)); return <span key={`day-${index}`} title={isHoliday ? "Feriado nacional" : isWeekend ? "Fim de semana" : undefined} className={`rounded-md py-0.5 ${isToday ? isRedDay ? "bg-[#C62828] font-black text-white ring-1 ring-[#A61B1B] shadow-sm" : "bg-[#E5BE6B] text-[#5E4310] shadow-sm" : isRedDay ? "bg-[#FFE6E3] font-black text-[#B42318]" : "text-[#A87520]"}`}>{day ?? ""}</span>; })}</div></div>
        </aside>
      </section>

      <section className="goals-cadence-surface"><CadenceWorkspace blocks={cadenceBlocks} onAdd={onAddCadenceBlock} onMove={onMoveCadenceBlock} onEdit={onEditCadenceBlock} onDelete={onDeleteCadenceBlock} />
      </section>
      <GoalSimulator stages={simulationStages} services={services} funnels={funnels} onAddStage={onAddSimulationStage} onUpdateStage={onUpdateSimulationStage} onDeleteStage={onDeleteSimulationStage} onSave={onSave} isSaving={isSaving} syncConfirmed={syncConfirmed} />
    </main>
  </div>;
}

function GoalSimulator({ stages, services, funnels, onAddStage, onUpdateStage, onDeleteStage, onSave, isSaving, syncConfirmed }: { stages: GoalSimulationStage[]; services: Service[]; funnels: SalesFunnel[]; onAddStage: () => void; onUpdateStage: (id: string, field: "name" | "color" | "probability" | "projectionMode" | "fixedValue" | "productId" | "conversionStageId" | "conversionRate" | "revenueBase" | "averageTicket", value: string | number) => void; onDeleteStage: (id: string) => void; onSave: () => void | Promise<void>; isSaving: boolean; syncConfirmed: boolean }) {
  const [leadInput, setLeadInput] = useState(120);
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const leads = Math.max(0, Number(leadInput) || 0);
  const numberFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
  const simulationBase = leads;
  const formatSimulationValue = (value: number) => numberFormat.format(value);
  const stageName = (stage: GoalSimulationStage) => stage.name.trim().toLocaleLowerCase("pt-BR");
  const isWonStage = (stage: GoalSimulationStage) => stageName(stage) === "ganho" || stageName(stage) === "ganha";
  const startEditing = (stage: GoalSimulationStage) => { setEditingStageId(stage.id); setNameDraft(stage.name); };
  const saveName = (stage: GoalSimulationStage) => { onUpdateStage(stage.id, "name", nameDraft.trim() || stage.name); setEditingStageId(null); };
  const funnelStages = funnels.flatMap((funnel) => funnel.stages.map((stage) => ({ ...stage, funnelName: funnel.name })));
  const projections = useMemo(() => {
    let previousVolume = simulationBase;
    return stages.map((stage, index) => {
      const mode = stage.projectionMode ?? "percentual";
      const product = services.find((service) => service.id === (stage.productId ?? ""));
      const conversionStage = funnelStages.find((funnelStage) => funnelStage.id === (stage.conversionStageId ?? ""));
      const configuredRate = Math.min(100, Math.max(0, Number(stage.conversionRate ?? stage.probability) || 0));
      const rate = mode === "produto" ? conversionStage?.probability ?? 0 : mode === "fixo" ? configuredRate : index === 0 ? 100 : Math.min(100, Math.max(0, Number(stage.probability) || 0));
      const volume = index === 0 ? simulationBase : previousVolume * (rate / 100);
      const revenueUnit = mode === "fixo" && stage.revenueBase === "ticket" ? Math.max(0, Number(stage.averageTicket) || 0) : product?.price ?? 0;
      const projected = index === 0 ? volume : mode === "fixo" ? volume * revenueUnit : mode === "produto" ? volume * revenueUnit : volume;
      previousVolume = volume;
      const displayUnit = mode === "percentual" ? "volume" as const : "currency" as const;
      return { stage, mode, rate, volume, projected, displayUnit, product, conversionStage, revenueUnit };
    });
  }, [funnelStages, services, simulationBase, stages]);
  const projectionByStage = new Map(projections.map((projection) => [projection.stage.id, projection]));

  return <section className="simulator-panel overflow-hidden rounded-[18px] border border-[#D9E7DE] bg-[#F7FBF8] shadow-[0_10px_28px_rgba(35,54,43,0.04)]">
    <div className="simulator-toolbar flex flex-col gap-3 bg-[#FBFDFB] px-3 py-3 sm:px-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0"><div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-[#E8F6F0] text-[#087E5A]"><SlidersHorizontal size={14} /></span><div><p className="eyebrow">Simulação independente</p><h2 className="section-title !mt-0 text-[18px]">Simulador de metas</h2></div></div><p className="mt-1 pl-9 text-[10px] font-medium text-[#718078]">Teste cenários sem alterar o funil principal.</p></div>
      <div className="flex flex-wrap items-end gap-2"><label className="block"><span className="mb-1 block text-[8px] font-extrabold uppercase tracking-[0.1em] text-[#74827B]">Entradas</span><Input min="0" step="1" type="number" value={leadInput} onChange={(event) => setLeadInput(Number(event.target.value))} className="h-8 w-[92px] bg-white text-xs font-bold" /></label><Button type="button" onClick={onAddStage} className="h-8 gap-1 rounded-lg bg-[#18201E] px-2.5 text-[10px] font-extrabold text-white hover:bg-[#087E5A]"><CirclePlus size={14} />Etapa</Button><Button type="button" onClick={() => void onSave()} disabled={isSaving} className="h-8 gap-1 rounded-lg bg-[#10A97A] px-2.5 text-[10px] font-extrabold text-white hover:bg-[#087E5A] disabled:cursor-wait disabled:opacity-70">{isSaving ? <RotateCcw className="h-3.5 w-3.5 animate-spin" /> : <ClipboardCheck size={14} />}{isSaving ? "Salvando" : "Salvar"}</Button><span className={`inline-flex h-8 items-center rounded-lg border px-2 text-[8px] font-extrabold uppercase tracking-[0.08em] ${syncConfirmed ? "border-[#CBE5D7] bg-[#F0F8F3] text-[#087E5A]" : "border-[#E7D5A8] bg-[#FFF9E8] text-[#80621D]"}`}>{syncConfirmed ? "Sincronizado" : "Não salvo"}</span></div>
    </div>
    <div className="simulator-content-grid grid gap-3 p-3 sm:p-4 xl:grid-cols-[minmax(0,1.12fr)_minmax(330px,0.88fr)]">
      <div className="simulator-stage-panel min-w-0 rounded-xl border border-[#DEE9E1] bg-white/70 p-2.5 sm:p-3">
        <div className="mb-2 flex items-center justify-between gap-2"><div><p className="text-[9px] font-extrabold uppercase tracking-[0.13em] text-[#6D8176]">Etapas da simulação</p><p className="mt-0.5 text-xs font-semibold text-[#405148]">Uma regra curta para cada etapa.</p></div><span className="rounded-full bg-[#EEF7F0] px-2 py-1 text-[9px] font-extrabold text-[#087E5A]">{stages.length} etapas</span></div>
        <div className="simulator-stage-list">{stages.map((stage, index) => {
          const projection = projectionByStage.get(stage.id);
          const isEditing = editingStageId === stage.id;
          const mode = stage.projectionMode ?? "percentual";
          const selectedProduct = services.find((service) => service.id === (stage.productId ?? ""));
          const selectedConversionStage = funnelStages.find((funnelStage) => funnelStage.id === (stage.conversionStageId ?? ""));
          return <article key={stage.id} className="simulator-stage rounded-xl border border-[#E0E9E1] bg-[#FCFDFC] p-2.5 transition hover:border-[#BFD8C9]">
            <div className="flex items-center gap-2"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[#EEF7F0] text-[10px] font-extrabold text-[#5B7868]">{String(index + 1).padStart(2, "0")}</span><span className="h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-[#F1F6F1]" style={{ backgroundColor: stage.color }} /><div className="min-w-0 flex-1">{isEditing ? <Input autoFocus value={nameDraft} onChange={(event) => setNameDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") saveName(stage); if (event.key === "Escape") setEditingStageId(null); }} className="h-8 bg-white text-xs font-bold" /> : <div className="flex min-w-0 flex-wrap items-center gap-1.5"><h3 className="truncate text-sm font-extrabold tracking-[-0.02em] text-[#27302D]">{stage.name}</h3>{isWonStage(stage) && <span className="rounded-full bg-[#E7F5EF] px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.08em] text-[#087E5A]">Fechamento</span>}</div>}<p className="truncate text-[9px] font-medium text-[#829089]">{index === 0 ? "Entrada fixa do cenário" : "Regra de projeção"}</p></div><div className="flex shrink-0 items-center gap-0.5"><button type="button" onClick={() => isEditing ? saveName(stage) : startEditing(stage)} className="grid h-7 w-7 place-items-center rounded-lg text-[#718078] transition hover:bg-[#E8F6F0] hover:text-[#087E5A]" title={isEditing ? "Salvar nome" : "Editar etapa"} aria-label={isEditing ? `Salvar nome de ${stage.name}` : `Editar ${stage.name}`}>{isEditing ? <CheckCircle2 size={14} /> : <Pencil size={14} />}</button>{isEditing && <button type="button" onClick={() => setEditingStageId(null)} className="grid h-7 w-7 place-items-center rounded-lg text-[#718078] hover:bg-[#F6EAE8] hover:text-[#B44D46]" title="Cancelar edição" aria-label="Cancelar edição"><X size={14} /></button>}<button type="button" onClick={() => onDeleteStage(stage.id)} disabled={stages.length <= 2} className="grid h-7 w-7 place-items-center rounded-lg text-[#9C6D69] transition hover:bg-[#F6EAE8] hover:text-[#B44D46] disabled:cursor-not-allowed disabled:opacity-30" title={stages.length <= 2 ? "Mantenha pelo menos duas etapas" : "Excluir etapa"} aria-label={`Excluir ${stage.name}`}><Trash2 size={14} /></button></div></div>
            {index === 0 ? <div className="simulator-entry-result mt-2 flex items-center justify-between gap-2 rounded-lg border border-[#DDEBE1] bg-[#F4FAF6] px-2 py-1.5"><div className="flex items-center gap-2"><input type="color" value={stage.color} onChange={(event) => onUpdateStage(stage.id, "color", event.target.value)} className="h-6 w-8 cursor-pointer rounded-md border border-[#D7E4DA] bg-white p-0.5" aria-label={`Cor de ${stage.name}`} /><span className="text-[10px] font-semibold text-[#5F7468]">Entrada em 100%</span></div><strong className="font-display text-sm tracking-[-0.04em] text-[#087E5A]">{formatSimulationValue(leads)} leads</strong></div> : <>
              <div className="simulator-stage-controls mt-2 grid gap-2 lg:grid-cols-[140px_minmax(0,1fr)]"><label className="block"><span className="mb-1 block text-[8px] font-extrabold uppercase tracking-[0.1em] text-[#73837A]">Método</span><select value={mode} onChange={(event) => onUpdateStage(stage.id, "projectionMode", event.target.value as SimulationProjectionMode)} className="h-8 w-full rounded-lg border border-[#DCE6DD] bg-white px-2 text-[10px] font-bold text-[#34423B] outline-none transition focus:border-[#10A97A] focus:ring-2 focus:ring-[#10A97A]/15"><option value="percentual">Percentual</option><option value="fixo">Receita por conversão</option><option value="produto">Produto × conversão</option></select></label><div className="simulator-stage-fields rounded-lg border border-[#E5EBE5] bg-[#FBFCFA] p-1.5"><div className="simulator-field-grid grid gap-1.5 sm:grid-cols-2">{mode === "percentual" && <label className="block"><span className="mb-1 block text-[8px] font-extrabold uppercase tracking-[0.1em] text-[#73837A]">Conversão</span><div className="relative"><Input min="0" max="100" step="0.1" type="number" value={stage.probability} onChange={(event) => onUpdateStage(stage.id, "probability", event.target.value)} className="h-8 bg-white pr-7 text-right text-xs font-extrabold" /><span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#7C8A83]">%</span></div></label>}{(mode === "fixo" || mode === "produto") && <>{mode === "fixo" && <label className="block"><span className="mb-1 block text-[8px] font-extrabold uppercase tracking-[0.1em] text-[#73837A]">Conversão</span><div className="relative"><Input min="0" max="100" step="0.1" type="number" value={stage.conversionRate ?? stage.probability} onChange={(event) => onUpdateStage(stage.id, "conversionRate", event.target.value)} className="h-8 bg-white pr-7 text-right text-xs font-extrabold" /><span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#7C8A83]">%</span></div></label>}{mode === "fixo" && <label className="block"><span className="mb-1 block text-[8px] font-extrabold uppercase tracking-[0.1em] text-[#73837A]">Base de receita</span><select value={stage.revenueBase ?? "produto"} onChange={(event) => onUpdateStage(stage.id, "revenueBase", event.target.value)} className="h-8 w-full rounded-lg border border-[#DCE6DD] bg-white px-2 text-[10px] font-semibold text-[#34423B] outline-none focus:border-[#10A97A] focus:ring-2 focus:ring-[#10A97A]/15"><option value="produto">Produto do catálogo</option><option value="ticket">Ticket médio</option></select></label>}{mode === "fixo" && (stage.revenueBase ?? "produto") === "produto" && <label className="block"><span className="mb-1 block text-[8px] font-extrabold uppercase tracking-[0.1em] text-[#73837A]">Serviço</span><select value={stage.productId ?? ""} onChange={(event) => onUpdateStage(stage.id, "productId", event.target.value)} disabled={!services.length} className="h-8 w-full rounded-lg border border-[#DCE6DD] bg-white px-2 text-[10px] font-semibold text-[#34423B] outline-none focus:border-[#10A97A] focus:ring-2 focus:ring-[#10A97A]/15 disabled:bg-[#F0F3F0]"><option value="">{services.length ? "Selecione" : "Cadastre um serviço"}</option>{services.map((service) => <option key={service.id} value={service.id}>{service.name} · {formatCurrency(service.price)}</option>)}</select></label>}{mode === "fixo" && (stage.revenueBase ?? "produto") === "ticket" && <label className="block"><span className="mb-1 block text-[8px] font-extrabold uppercase tracking-[0.1em] text-[#73837A]">Ticket médio</span><div className="relative"><span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#7C8A83]">R$</span><Input min="0" step="0.01" type="number" value={stage.averageTicket ?? 0} onChange={(event) => onUpdateStage(stage.id, "averageTicket", event.target.value)} className="h-8 bg-white pl-7 text-right text-xs font-extrabold" /></div></label>}{mode === "produto" && <><label className="block"><span className="mb-1 block text-[8px] font-extrabold uppercase tracking-[0.1em] text-[#73837A]">Produto</span><select value={stage.productId ?? ""} onChange={(event) => onUpdateStage(stage.id, "productId", event.target.value)} disabled={!services.length} className="h-8 w-full rounded-lg border border-[#DCE6DD] bg-white px-2 text-[10px] font-semibold text-[#34423B] outline-none focus:border-[#10A97A] focus:ring-2 focus:ring-[#10A97A]/15 disabled:bg-[#F0F3F0]"><option value="">{services.length ? "Selecione" : "Cadastre um serviço"}</option>{services.map((service) => <option key={service.id} value={service.id}>{service.name} · {formatCurrency(service.price)}</option>)}</select></label><label className="block"><span className="mb-1 block text-[8px] font-extrabold uppercase tracking-[0.1em] text-[#73837A]">Etapa de conversão</span><select value={stage.conversionStageId ?? ""} onChange={(event) => onUpdateStage(stage.id, "conversionStageId", event.target.value)} disabled={!funnelStages.length} className="h-8 w-full rounded-lg border border-[#DCE6DD] bg-white px-2 text-[10px] font-semibold text-[#34423B] outline-none focus:border-[#10A97A] focus:ring-2 focus:ring-[#10A97A]/15 disabled:bg-[#F0F3F0]"><option value="">{funnelStages.length ? "Selecione" : "Cadastre uma etapa"}</option>{funnelStages.map((funnelStage) => <option key={funnelStage.id} value={funnelStage.id}>{funnelStage.funnelName} · {funnelStage.name} · {funnelStage.probability}%</option>)}</select></label></>}</>}</div></div></div>
              <div className="simulator-result mt-1.5 flex items-center justify-between gap-2 rounded-lg border border-[#E8EDE8] bg-[#F8FAF8] px-2 py-1.5"><div className="flex min-w-0 items-center gap-2"><input type="color" value={stage.color} onChange={(event) => onUpdateStage(stage.id, "color", event.target.value)} className="h-6 w-8 cursor-pointer rounded-md border border-[#D7E4DA] bg-white p-0.5" aria-label={`Cor de ${stage.name}`} /><div className="min-w-0"><p className="text-[8px] font-extrabold uppercase tracking-[0.1em] text-[#85928B]">Resultado</p><p className="truncate text-[10px] font-medium text-[#6E7D75]">{mode === "produto" ? `${selectedProduct?.name ?? "Produto não selecionado"} · ${selectedConversionStage ? `${selectedConversionStage.name} ${selectedConversionStage.probability}%` : "Etapa não selecionada"}` : mode === "fixo" ? `${formatSimulationValue(projection?.volume ?? 0)} negócios × ${formatCurrency(projection?.revenueUnit ?? 0)}` : `${stage.probability}% da etapa anterior`}</p></div></div><strong className="shrink-0 font-display text-sm tracking-[-0.04em] text-[#087E5A]">{projection?.displayUnit === "currency" ? formatCurrency(projection.projected) : `${formatSimulationValue(projection?.projected ?? 0)} leads`}</strong></div>
            </>}
          </article>;
        })}</div>
        <p className="mt-2 px-1 text-[9px] leading-4 text-[#829089]">Percentual encadeia volumes; Receita por conversão calcula negócios × serviço ou ticket; Produto × conversão estima receita pelo catálogo.</p>
      </div>
      <aside className="simulator-reading sticky top-3 self-start rounded-xl border border-[#CFE3D6] bg-gradient-to-br from-[#EEF9F2] to-[#F8FCF8] p-3"><div className="flex items-start justify-between gap-2"><div><p className="text-[9px] font-extrabold uppercase tracking-[0.13em] text-[#5D7569]">Leitura projetada</p><h3 className="mt-0.5 font-display text-base font-extrabold tracking-[-0.035em] text-[#24332D]">Cenário independente</h3></div><span className="rounded-full bg-white/80 px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.08em] text-[#087E5A]">{numberFormat.format(leads)} entradas</span></div><div className="mt-2 space-y-1">{stages.map((stage, index) => { const projection = projectionByStage.get(stage.id); if (!projection) return null; return <div key={stage.id} className="flex items-center gap-2 rounded-lg border border-white/80 bg-white/55 px-2 py-1.5"><span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: stage.color }} /><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-[#4B6257]">{stage.name}</p><p className="truncate text-[9px] font-semibold uppercase tracking-[0.07em] text-[#87968E]">{index === 0 ? "Base" : stage.projectionMode === "produto" ? "Receita estimada" : stage.projectionMode === "fixo" ? "Receita por conversão" : `${stage.probability}% conversão`}</p></div>{isWonStage(stage) && <span className="hidden rounded-full bg-[#E7F5EF] px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.07em] text-[#087E5A] sm:inline-flex">Final</span>}<strong className="font-display text-sm tracking-[-0.04em] text-[#1B2522]">{projection.displayUnit === "currency" ? formatCurrency(projection.projected) : formatSimulationValue(projection.projected)}</strong></div>; })}</div><div className="mt-2 border-t border-[#CFE0D5] pt-2"><p className="text-[10px] font-bold text-[#4F6F60]">Métodos combináveis</p><p className="mt-0.5 text-[9px] leading-4 text-[#71887D]">Cada etapa pode usar uma regra diferente sem alterar o funil principal.</p></div></aside>
    </div>
  </section>;
}

function GoalRow({ goal, funnels, onReorder }: { goal: GoalItem; funnels: SalesFunnel[]; onReorder: (fromId: string, toId: string) => void }) {
  return <div draggable onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", goal.id); }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const fromId = event.dataTransfer.getData("text/plain"); if (fromId) onReorder(fromId, goal.id); }} className="group relative flex min-h-[190px] flex-col justify-between gap-5 rounded-3xl border border-[#E2E9E2] bg-[#FCFCFA] p-5 shadow-[0_10px_24px_rgba(30,55,44,0.04)] transition hover:-translate-y-0.5 hover:border-[#BFD6C8] hover:shadow-[0_16px_32px_rgba(30,55,44,0.08)]">
    <div><div className="mb-1 flex flex-wrap items-center gap-2"><span className="tag-chip">{goal.type}</span><span className="rounded-full bg-[#F0F4F0] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#63736B]">{goal.cadence}</span>{goal.recurring && <span className="rounded-full bg-[#E7F5EF] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#087E5E]">Recorrente</span>}<span className="text-xs text-[#88938E]">{goal.recurring ? periodValueForDate(goal.cadence) : cleanGoalPeriod(goal.period)}</span></div><h3 className="font-display text-base font-bold tracking-[-0.025em] text-[#27302D]">{goal.title}</h3></div>
    <div className="flex items-center justify-between gap-3"><div><span className="text-sm font-bold text-[#35403B]">{formatGoalValue(goal.actual, goal.unit)}</span><span className="ml-2 text-xs font-medium text-[#7D8983]">de {formatGoalValue(goal.target, goal.unit)}</span></div><span className="inline-flex items-center gap-1.5 cursor-grab text-xs font-bold uppercase tracking-[0.1em] text-[#A0ACA5]" title="Arraste para reorganizar"><GripVertical size={15} />Mover</span></div>
  </div>;
}

function PeopleWorkspace({
  lists,
  onUpdate,
  onSave,
  savingPersonId,
}: {
  lists: ProspectList[];
  onUpdate: (listId: string, id: string, field: keyof Pick<ProspectRecord, "decisionMakerFirstName" | "decisionMakerLastName" | "decisionMakerRole" | "decisionMakerEmail" | "decisionMakerPhone">, value: string) => void;
  onSave: (id: string) => Promise<void>;
  savingPersonId: string | null;
}) {
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const people = lists.flatMap((list) => list.records.map((record) => ({ ...record, listId: list.id, listName: list.name })));

  return <div className="pt-[68px] md:pt-0"><header className="flex min-h-[116px] items-center justify-between px-5 py-6 md:px-10"><div><p className="eyebrow">Relacionamentos comerciais</p><h1 className="page-title">Pessoas <span className="text-[#10A97A]">em contato</span></h1></div><span className="rounded-full bg-[#E8F6F0] px-3 py-1.5 text-xs font-extrabold text-[#087E5E]">{people.length} {people.length === 1 ? "pessoa" : "pessoas"}</span></header><div className="px-5 pb-12 md:px-10"><section className="surface-panel overflow-hidden p-4 sm:p-6"><div className="mb-5"><p className="eyebrow">Base de pessoas</p><h2 className="section-title">Decisores das suas empresas</h2><p className="mt-1 text-sm text-[#718078]">Edite os dados por aqui e eles serão refletidos nos cards do funil.</p></div>{people.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{people.map((person) => {
    const isEditing = editingPersonId === person.id;
    const update = (field: keyof Pick<ProspectRecord, "decisionMakerFirstName" | "decisionMakerLastName" | "decisionMakerRole" | "decisionMakerEmail" | "decisionMakerPhone">, value: string) => onUpdate(person.listId, person.id, field, value);
    return <article key={person.id} className="rounded-2xl border border-[#E2E9E2] bg-[#FCFCFA] p-4 transition hover:-translate-y-0.5 hover:border-[#BFD6C8] hover:shadow-[0_10px_24px_rgba(30,55,44,0.06)]"><div className="flex items-start justify-between gap-3"><div className="min-w-0 flex-1"><h3 className="truncate font-display text-lg font-extrabold tracking-[-0.03em] text-[#27302D]">{`${person.decisionMakerFirstName} ${person.decisionMakerLastName}`.trim() || "Pessoa sem nome"}</h3><p className="mt-1 truncate text-xs font-bold text-[#087E5A]">{person.decisionMakerRole || "Cargo não informado"}</p></div>{isEditing ? <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-[#63736B] hover:bg-[#E8F6F0] hover:text-[#087E5A]" onClick={() => setEditingPersonId(null)} aria-label="Cancelar edição"><X size={16} /></Button> : <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-[#63736B] hover:bg-[#E8F6F0] hover:text-[#087E5A]" onClick={() => setEditingPersonId(person.id)} aria-label="Editar pessoa"><Pencil size={15} /></Button>}</div>{isEditing ? <div className="mt-4 space-y-3"><div className="grid gap-3 sm:grid-cols-2"><FormField label="Nome"><Input value={person.decisionMakerFirstName} onChange={(event) => update("decisionMakerFirstName", event.target.value)} /></FormField><FormField label="Sobrenome"><Input value={person.decisionMakerLastName} onChange={(event) => update("decisionMakerLastName", event.target.value)} /></FormField></div><FormField label="Cargo"><Input value={person.decisionMakerRole} onChange={(event) => update("decisionMakerRole", event.target.value)} placeholder="Cargo" /></FormField><FormField label="E-mail"><Input type="email" value={person.decisionMakerEmail} onChange={(event) => update("decisionMakerEmail", event.target.value)} placeholder="contato@empresa.com" /></FormField><FormField label="Telefone"><Input value={person.decisionMakerPhone} onChange={(event) => update("decisionMakerPhone", event.target.value)} placeholder="(11) 99999-9999" /></FormField><div className="flex items-center justify-between border-t border-[#E8EDE8] pt-3"><span className="truncate pr-3 text-xs text-[#718078]">Empresa: {person.company || "Não informada"}</span><Button type="button" className="h-8 shrink-0 gap-1.5 bg-[#10A97A] px-3 text-xs font-bold hover:bg-[#087E5A]" disabled={savingPersonId === person.id} onClick={() => { void onSave(person.id); setEditingPersonId(null); }}><CheckCircle2 size={14} />{savingPersonId === person.id ? "Salvando..." : "Salvar"}</Button></div></div> : <><div className="mt-4 space-y-2 text-sm text-[#5E7067]"><p className="truncate"><strong className="text-[#27302D]">Empresa:</strong> {person.company || "Não informada"}</p><p className="truncate"><strong className="text-[#27302D]">E-mail:</strong> {person.decisionMakerEmail || "Não informado"}</p><p><strong className="text-[#27302D]">Telefone:</strong> {person.decisionMakerPhone || "Não informado"}</p></div><p className="mt-4 border-t border-[#E8EDE8] pt-3 text-[11px] font-bold uppercase tracking-[0.1em] text-[#8A9690]">Lista · {person.listName}</p></>}</article>;
  })}</div> : <div className="grid min-h-56 place-items-center rounded-2xl border border-dashed border-[#D6DED8] bg-[#FAFBF9] p-6 text-center"><Users className="mb-2 h-6 w-6 text-[#10A97A]" /><p className="font-bold text-[#27302D]">Ainda não há pessoas cadastradas</p><p className="mt-1 text-sm text-[#718078]">Adicione contatos na aba Empresas para vê-los aqui.</p></div>}</section></div></div>;
}

function ProspectingMetric({ label, value, detail, accent = false }: { label: string; value: string; detail: string; accent?: boolean }) {
  return <div className="rounded-2xl border border-[#DDE5DE] bg-[#FCFCFA] px-4 py-3 shadow-[0_8px_22px_rgba(43,61,53,0.04)]"><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#7B8882]">{label}</span><span className={`h-1.5 w-1.5 rounded-full ${accent ? "bg-[#10A97A] shadow-[0_0_0_4px_rgba(16,169,122,0.11)]" : "bg-[#A6B2AB]"}`} /></div><div className={`mt-2 font-display text-2xl font-extrabold tracking-[-0.05em] ${accent ? "text-[#087E5A]" : "text-[#27302D]"}`}>{value}</div><p className="mt-0.5 text-xs font-medium text-[#87938D]">{detail}</p></div>;
}

const PROSPECT_EXPORT_COLUMNS: Array<{ key: keyof Omit<ProspectRecord, "id">; label: string }> = [
  { key: "decisionMakerFirstName", label: "Nome do decisor" },
  { key: "decisionMakerLastName", label: "Sobrenome do decisor" },
  { key: "decisionMakerRole", label: "Cargo" },
  { key: "decisionMakerEmail", label: "E-mail do decisor" },
  { key: "decisionMakerPhone", label: "Telefone principal" },
  { key: "decisionMakerSecondaryPhone", label: "Telefone secundário" },
  { key: "monthlyVisits", label: "Visitas mensais" },
  { key: "company", label: "Empresa" },
  { key: "companyWebsite", label: "Site da empresa" },
  { key: "analysis", label: "Análise" },
];

function exportProspects(activeListName: string, prospects: ProspectRecord[], format: "csv" | "xls") {
  const safeName = (activeListName.trim() || "lista-prospeccao").replace(/[^a-zA-Z0-9À-ÿ]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
  const rows = [PROSPECT_EXPORT_COLUMNS.map((column) => column.label), ...prospects.map((prospect) => PROSPECT_EXPORT_COLUMNS.map((column) => prospect[column.key] ?? ""))];
  const escapeCsv = (value: string) => `"${String(value).replace(/"/g, '""')}"`;
  const anchor = document.createElement("a");
  if (format === "csv") {
    const csv = "\uFEFF" + rows.map((row) => row.map(escapeCsv).join(";")) .join("\r\n");
    anchor.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    anchor.download = `${safeName}.csv`;
  } else {
    const html = `<html><head><meta charset="utf-8" /></head><body><table><thead><tr>${rows[0].map((cell) => `<th>${String(cell).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</th>`).join("")}</tr></thead><tbody>${rows.slice(1).map((row) => `<tr>${row.map((cell) => `<td>${String(cell).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
    anchor.href = URL.createObjectURL(new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" }));
    anchor.download = `${safeName}.xls`;
  }
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(anchor.href), 1000);
}

function adaptiveFieldWidth(value: string, minimum: number) {
  return `${Math.min(Math.max(value.length + 2, minimum), 42)}ch`;
}

function ProspectingWorkspace({ lists, trashedLists, funnels, activeListId, activeListName, prospects, onSelectList, onCreateList, onRenameList, onDeleteList, onRestoreList, onPermanentDeleteList, onAdd, onUpdate, onReorder, onDelete, onImportList, onSave, onSaveProspect, isSaving, savingProspectId, onConnect }: { lists: ProspectList[]; trashedLists: TrashedProspectList[]; funnels: SalesFunnel[]; activeListId: string; activeListName: string; prospects: ProspectRecord[]; onSelectList: (id: string) => void; onCreateList: () => void; onRenameList: (name: string) => void; onDeleteList: () => void; onRestoreList: (id: string) => void; onPermanentDeleteList: (id: string) => void; onAdd: () => void; onUpdate: (id: string, field: keyof Omit<ProspectRecord, "id">, value: string) => void; onReorder: (fromId: string, toId: string) => void; onDelete: (id: string) => void; onImportList: (listId: string, funnelId: string, stageId: string) => void; onSave: () => void; onSaveProspect: (id: string) => void; isSaving: boolean; savingProspectId: string | null; onConnect: () => void }) {
  const [trashOpen, setTrashOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importFunnelId, setImportFunnelId] = useState(funnels[0]?.id ?? "");
  const importFunnel = funnels.find((funnel) => funnel.id === importFunnelId) ?? funnels[0];
  const [importStageId, setImportStageId] = useState(importFunnel?.stages[0]?.id ?? "");
  const [pendingProspectDeleteId, setPendingProspectDeleteId] = useState<string | null>(null);
  const columns: Array<{ key: keyof Omit<ProspectRecord, "id">; label: string; width: string; multiline?: boolean }> = [
    { key: "decisionMakerFirstName", label: "Nome", width: "w-[135px] min-w-[135px]" },
    { key: "decisionMakerLastName", label: "Sobrenome", width: "w-[145px] min-w-[145px]" },
    { key: "decisionMakerRole", label: "Cargo", width: "w-[125px] min-w-[125px]" },
    { key: "decisionMakerEmail", label: "E-mail", width: "w-[235px] min-w-[235px]" },
    { key: "decisionMakerPhone", label: "Telefone", width: "w-[145px] min-w-[145px]" },
    { key: "decisionMakerSecondaryPhone", label: "Telefone 2", width: "w-[135px] min-w-[135px]" },
    { key: "monthlyVisits", label: "Visitas", width: "w-[105px] min-w-[105px]" },
    { key: "company", label: "Empresa", width: "w-[160px] min-w-[160px]" },
    { key: "companyWebsite", label: "Site", width: "w-[180px] min-w-[180px]" },
    { key: "analysis", label: "Análise", width: "w-[520px] min-w-[520px]", multiline: true },
  ];
  const companyCount = prospects.filter((prospect) => prospect.company.trim()).length;

  return <div className="min-h-screen bg-[#F6F5F1] px-5 pb-8 pt-[92px] md:px-8 md:pt-8">
    <div className="mx-auto w-full max-w-none">
      <header className="flex flex-wrap items-center gap-3 border-b border-[#E2E7E1] pb-3">
        <div className="mr-auto flex min-w-[220px] items-center gap-2"><div><p className="eyebrow">Prospecção comercial</p><div className="mt-0.5 flex items-center gap-2"><h1 className="page-title text-2xl">Empresas</h1><span className="h-2 w-2 rounded-full bg-[#10A97A] shadow-[0_0_0_4px_rgba(16,169,122,0.12)]" /></div></div></div>
        <div className="flex min-w-0 items-center gap-2 rounded-xl border border-[#DDE5DE] bg-[#FCFCFA] px-2 py-1.5"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#E8F6F0] text-[#087E5A]"><ClipboardList size={17} /></div><label htmlFor="prospect-list-select" className="sr-only">Lista ativa</label><select id="prospect-list-select" value={activeListId} onChange={(event) => onSelectList(event.target.value)} className="block max-w-[180px] truncate border-0 bg-transparent p-0 pr-7 text-sm font-extrabold text-[#27302D] outline-none"><option value="" disabled>Selecione uma lista</option>{lists.map((list) => <option key={list.id} value={list.id}>{list.name}</option>)}</select><input aria-label="Nome da lista ativa" value={activeListName} onChange={(event) => onRenameList(event.target.value)} className="h-8 w-[160px] rounded-lg border border-[#DDE5DE] bg-white px-2.5 text-sm font-semibold text-[#27302D] outline-none focus:border-[#10A97A]" /><Button variant="outline" onClick={onCreateList} className="h-8 gap-1 rounded-lg border-[#C8D9CF] px-2.5 text-xs font-extrabold text-[#087E5A] hover:bg-[#E8F6F0]"><Plus size={14} />Nova lista</Button><Button variant="outline" onClick={onDeleteList} className="h-8 gap-1 rounded-lg border-[#F0D5D1] px-2.5 text-xs font-extrabold text-[#B04D45] hover:bg-[#FCEDEB]"><Trash2 size={14} />Excluir</Button><Button variant="outline" onClick={() => setTrashOpen((open) => !open)} className="h-8 gap-1 rounded-lg border-[#DDE5DE] px-2.5 text-xs font-extrabold text-[#63706B] hover:bg-[#F3F5F1]"><Trash2 size={14} />Lixeira{trashedLists.length ? ` (${trashedLists.length})` : ""}</Button></div>
        <div className="flex flex-wrap gap-2"><Button onClick={() => setImportOpen(true)} variant="outline" className="h-9 gap-1.5 rounded-xl border-[#C8D9CF] px-3 text-xs font-extrabold text-[#087E5A] hover:bg-[#E8F6F0]"><ArrowRight size={15} />Adicionar ao funil</Button><Button onClick={onAdd} className="h-9 gap-1.5 rounded-xl bg-[#10A97A] px-3 font-bold hover:bg-[#087E5A]"><Plus size={17} />Nova linha</Button><Button variant="outline" onClick={() => exportProspects(activeListName, prospects, "csv")} className="h-9 gap-1 rounded-xl border-[#C8D9CF] px-2.5 text-xs font-extrabold text-[#087E5A] hover:bg-[#E8F6F0]"><Download size={14} />CSV</Button><Button variant="outline" onClick={() => exportProspects(activeListName, prospects, "xls")} className="h-9 gap-1 rounded-xl border-[#C8D9CF] px-2.5 text-xs font-extrabold text-[#087E5A] hover:bg-[#E8F6F0]"><Download size={14} />Excel</Button></div>
      </header>
      {trashOpen && <section className="mt-3 rounded-2xl border border-[#E4DDD5] bg-[#FFFDF9] p-4 shadow-[0_8px_22px_rgba(75,61,43,0.04)]"><div className="flex flex-col gap-2 border-b border-[#EEE6DC] pb-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><p className="text-sm font-extrabold text-[#3B3934]">Lixeira</p><span className="h-1.5 w-1.5 rounded-full bg-[#D8952E]" /></div><p className="mt-1 text-xs text-[#8B8177]">Listas excluídas ficam disponíveis por 30 dias para restauração.</p></div><span className="rounded-full bg-[#FFF2D9] px-3 py-1.5 text-xs font-extrabold text-[#9A6819]">{trashedLists.length} {trashedLists.length === 1 ? "lista" : "listas"}</span></div>{trashedLists.length ? <div className="mt-3 space-y-2">{trashedLists.map((list) => { const daysLeft = Math.max(0, Math.ceil((new Date(list.deletedAt).getTime() + PROSPECT_TRASH_RETENTION_MS - Date.now()) / (24 * 60 * 60 * 1000))); return <div key={list.id} className="flex flex-col gap-3 rounded-xl border border-[#EEE6DC] bg-white p-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-sm font-bold text-[#3B3934]">{list.name || "Lista sem nome"}</p><p className="mt-1 text-xs text-[#8B8177]">{list.records.length} {list.records.length === 1 ? "registro" : "registros"} · expira em {daysLeft} {daysLeft === 1 ? "dia" : "dias"}</p></div><div className="flex shrink-0 gap-2"><Button variant="outline" onClick={() => onRestoreList(list.id)} className="h-8 gap-1.5 rounded-lg border-[#C8D9CF] px-3 text-xs font-extrabold text-[#087E5E] hover:bg-[#E8F6F0]"><RotateCcw size={14} />Restaurar</Button><Button variant="outline" onClick={() => onPermanentDeleteList(list.id)} className="h-8 gap-1.5 rounded-lg border-[#F0D5D1] px-3 text-xs font-extrabold text-[#B04D45] hover:bg-[#FCEDEB]"><Trash2 size={14} />Excluir definitivamente</Button></div></div>; })}</div> : <p className="mt-4 text-sm text-[#8B8177]">A Lixeira está vazia.</p>}</section>}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-md rounded-2xl border-[#DDE5DE] bg-[#FFFDF9]">
          <DialogHeader><DialogTitle>Adicionar lista ao funil</DialogTitle><DialogDescription>{prospects.length} {prospects.length === 1 ? "registro será convertido em card." : "registros serão convertidos em cards individuais."}</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div><label className="mb-1.5 block text-xs font-extrabold uppercase tracking-[0.12em] text-[#75837C]">Funil de destino</label><select value={importFunnelId} onChange={(event) => { const nextFunnelId = event.target.value; setImportFunnelId(nextFunnelId); setImportStageId(funnels.find((funnel) => funnel.id === nextFunnelId)?.stages[0]?.id ?? ""); }} className="h-11 w-full rounded-xl border border-[#DDE5DE] bg-white px-3 text-sm font-semibold text-[#27302D] outline-none focus:border-[#10A97A]">{funnels.map((funnel) => <option key={funnel.id} value={funnel.id}>{funnel.name}</option>)}</select></div>
            <div><label className="mb-1.5 block text-xs font-extrabold uppercase tracking-[0.12em] text-[#75837C]">Etapa de destino</label><select value={importStageId} onChange={(event) => setImportStageId(event.target.value)} className="h-11 w-full rounded-xl border border-[#DDE5DE] bg-white px-3 text-sm font-semibold text-[#27302D] outline-none focus:border-[#10A97A]">{(importFunnel?.stages ?? []).map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}</select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setImportOpen(false)} className="rounded-xl">Cancelar</Button><Button onClick={() => { onImportList(activeListId, importFunnelId, importStageId); setImportOpen(false); }} disabled={!prospects.length || !importFunnelId || !importStageId} className="rounded-xl bg-[#10A97A] font-bold hover:bg-[#087E5A]">Criar cards</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="mt-6 max-w-sm">
        <ProspectingMetric label="Empresas preenchidas" value={companyCount.toString()} detail="empresas com nome cadastrado" accent />
      </div>
      <section className="mt-4 overflow-hidden rounded-2xl border border-[#DDE5DE] bg-white shadow-[0_14px_40px_rgba(43,61,53,0.06)]">
        <div className="flex flex-col gap-3 border-b border-[#E5EAE5] bg-[#FBFCFA] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div><div className="flex items-center gap-2"><p className="text-sm font-extrabold text-[#27302D]">Base de contatos</p><span className="h-1.5 w-1.5 rounded-full bg-[#10A97A]" /></div><p className="mt-1 text-xs text-[#7B8882]">{prospects.length} {prospects.length === 1 ? "registro" : "registros"} · edição direta na bancada</p></div><div className="flex items-center gap-2"><span className="hidden text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#87938D] sm:inline">Tabuleiro operacional</span><span className="rounded-full bg-[#E8F6F0] px-3 py-1.5 text-xs font-extrabold text-[#087E5E]">Rascunho comercial</span></div></div>
        <div className="overflow-x-auto overscroll-x-contain [scrollbar-color:#AAB8AF_#F1F4F1] [scrollbar-width:auto]">
          <table className="w-full min-w-[1660px] table-fixed border-collapse text-left">
            <thead><tr className="sticky top-0 z-20 border-b border-[#DDE5DE] bg-[#F4F7F3]">{columns.map((column, columnIndex) => <th key={column.key} className={`${column.width} ${columnIndex === 0 ? "sticky left-0 z-30 bg-[#F4F7F3]" : ""} border-r border-[#E4EAE4] px-3 py-3 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#75837C]`}>{column.label}</th>)}<th className="w-[78px] min-w-[78px] px-2 py-3" aria-label="Ações" title="Salvar ou excluir" /></tr></thead>
            <tbody>{prospects.map((prospect, index) => <tr key={prospect.id} draggable onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", prospect.id); }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const fromId = event.dataTransfer.getData("text/plain"); if (fromId) onReorder(fromId, prospect.id); }} className="group cursor-grab border-b border-[#E8EDE8] align-top transition hover:bg-[#FBFDFB] active:cursor-grabbing">
              {columns.map((column, columnIndex) => <td key={column.key} className={`${columnIndex === 0 ? "sticky left-0 z-10 bg-white group-hover:bg-[#FBFDFB]" : ""} border-r border-[#EEF2EE] px-2 py-1.5`}><label className="sr-only">{column.label} — linha {index + 1}</label>{column.multiline ? <textarea value={prospect[column.key]} onChange={(event) => onUpdate(prospect.id, column.key, event.target.value)} onKeyDown={(event) => { if (event.ctrlKey && event.key === "Enter") { event.preventDefault(); const target = event.currentTarget; const start = target.selectionStart; const end = target.selectionEnd; const nextValue = `${target.value.slice(0, start)}\n\n${target.value.slice(end)}`; onUpdate(prospect.id, column.key, nextValue); requestAnimationFrame(() => target.setSelectionRange(start + 2, start + 2)); } }} placeholder="Escreva sua hipótese, contexto e próximo passo…" style={{ width: "100%" }} className="min-h-[150px] w-full min-w-0 resize-y rounded-lg border border-transparent bg-transparent px-2 py-2 text-sm leading-5 text-[#27302D] outline-none transition placeholder:text-[#A2ADA6] hover:border-[#DCE7DF] focus:border-[#10A97A] focus:bg-white" /> : <input value={prospect[column.key]} onChange={(event) => onUpdate(prospect.id, column.key, event.target.value)} placeholder="Preencher" type={column.key === "decisionMakerEmail" ? "email" : "text"} style={{ width: "100%" }} className="h-9 w-full min-w-0 rounded-lg border border-transparent bg-transparent px-2 text-sm text-[#27302D] outline-none transition placeholder:text-[#A2ADA6] hover:border-[#DCE7DF] focus:border-[#10A97A] focus:bg-white" />}</td>)}
              <td className="px-1.5 py-1.5"><div className="flex min-h-[150px] items-start justify-center gap-1 pt-1"><button type="button" onClick={() => onSaveProspect(prospect.id)} disabled={isSaving || savingProspectId === prospect.id} className="grid h-8 w-8 place-items-center rounded-lg border border-[#C8D9CF] text-[#087E5A] transition hover:bg-[#E8F6F0] disabled:opacity-60" aria-label={savingProspectId === prospect.id ? `Salvando linha ${index + 1}` : `Salvar linha ${index + 1}`} title={savingProspectId === prospect.id ? "Salvando" : "Salvar"}>{savingProspectId === prospect.id ? <Circle size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}</button><button type="button" onClick={() => setPendingProspectDeleteId(prospect.id)} className="grid h-8 w-8 place-items-center rounded-lg text-[#A0AAA4] opacity-60 transition hover:bg-[#FCEDEB] hover:text-[#B94D45] group-hover:opacity-100" aria-label={`Excluir linha ${index + 1}`} title="Excluir linha"><Trash2 size={15} /></button></div></td>
            </tr>)}</tbody>
          </table>
          {!prospects.length && <div className="px-6 py-16 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#E8F6F0] text-[#087E5A]"><ClipboardList size={23} /></div><p className="mt-4 font-display text-xl font-extrabold tracking-[-0.03em] text-[#27302D]">Sua lista começa aqui</p><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#78857F]">Adicione uma linha para registrar o decisor, a empresa e a leitura comercial que vai orientar sua abordagem.</p><Button onClick={onAdd} className="mt-5 h-10 rounded-xl bg-[#10A97A] px-4 font-bold hover:bg-[#087E5A]"><Plus size={17} />Adicionar primeiro contato</Button></div>}
        </div>
      </section>
      <Dialog open={Boolean(pendingProspectDeleteId)} onOpenChange={(open) => { if (!open) setPendingProspectDeleteId(null); }}>
        <DialogContent className="max-w-md rounded-2xl border-[#DDE5DE] bg-[#FCFCFA]">
          <DialogHeader><DialogTitle className="font-display text-xl font-extrabold text-[#27302D]">Remover contato?</DialogTitle><DialogDescription className="text-sm leading-6 text-[#6F7C74]">O registro será removido da lista ativa e essa ação poderá ser sincronizada com o Supabase.</DialogDescription></DialogHeader>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setPendingProspectDeleteId(null)} className="rounded-xl border-[#DDE5DE]">Cancelar</Button><Button onClick={() => { if (pendingProspectDeleteId) onDelete(pendingProspectDeleteId); setPendingProspectDeleteId(null); }} className="rounded-xl bg-[#B94D45] text-white hover:bg-[#963C35]">Remover</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  </div>;
}

function CadenceWorkspace({ blocks, onAdd, onMove, onEdit, onDelete }: { blocks: CadenceBlock[]; onAdd: (day: number, slot: CadenceSlot, details?: Pick<CadenceBlock, "title" | "channel" | "notes">) => void; onMove: (id: string, day: number, slot: CadenceSlot) => void; onEdit: (block: CadenceBlock) => void; onDelete: (id: string) => void }) {
  const [draft, setDraft] = useState<CadenceBlock | null>(null);
  const [createSlot, setCreateSlot] = useState<{ day: number; slot: CadenceSlot } | null>(null);
  const weekdays = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo", "segunda", "terça", "quarta"];
  const channels: CadenceChannel[] = ["E-mail", "WhatsApp", "Ligação", "Tarefa", "LinkedIn", "Instagram"];
  const channelIcon: Record<CadenceChannel, typeof Mail> = { "E-mail": Mail, WhatsApp: MessageCircle, Ligação: PhoneCall, Tarefa: ClipboardCheck, LinkedIn: Linkedin, Instagram };
  const channelIconTone: Record<CadenceChannel, string> = { "E-mail": "border-[#B9D2F6] bg-[#E5EEFF] text-[#355E9A]", WhatsApp: "border-[#B6E4CF] bg-[#DDF6E9] text-[#087E5A]", Ligação: "border-[#F1D39B] bg-[#FFF0D0] text-[#99631A]", Tarefa: "border-[#D6D0C4] bg-[#EEEAE3] text-[#4E5752]", LinkedIn: "border-[#B6D3F4] bg-[#E3F0FF] text-[#155A9C]", Instagram: "border-[#EEC1D4] bg-[#FBE4EE] text-[#A33D6C]" };
  const slotLabel: Record<CadenceSlot, string> = { morning: "Manhã", afternoon: "Tarde" };
  const blockAt = (day: number, slot: CadenceSlot) => blocks.find((block) => block.day === day && block.slot === slot);
  const beginEdit = (block: CadenceBlock) => setDraft({ ...block });
  const openCreate = (day: number, slot: CadenceSlot) => { setCreateSlot({ day, slot }); setDraft({ id: "", day, slot, title: "", channel: "E-mail", notes: "" }); };
  const saveDraft = () => { if (draft?.title.trim()) { if (createSlot) { onAdd(createSlot.day, createSlot.slot, { title: draft.title, channel: draft.channel, notes: draft.notes }); } else { onEdit(draft); } setDraft(null); setCreateSlot(null); } };

  return <section className="planos-cadence mt-0 overflow-hidden rounded-[14px] border border-[#E0E5DF] bg-[#FBFBF9] shadow-none">
    <div className="cadence-inner mx-auto max-w-[1500px] px-4 pb-4 pt-4 md:px-5 md:pb-5">
      <div className="mb-4">
        <h1 className="font-display text-3xl font-extrabold tracking-[-0.06em] text-[#1B2522]">Cadência de prospecção</h1>
      </div>
      <div className="cadence-board overflow-hidden rounded-[24px] border border-[#E0E5DF] bg-[#FBFBF9] shadow-[0_18px_50px_rgba(27,37,34,0.06)]">
        <div className="cadence-scroll overflow-x-auto">
          <div className="cadence-grid min-w-[1120px]">
            <div className="cadence-header grid grid-cols-[112px_repeat(10,minmax(100px,1fr))] border-b border-[#E3E6E0] bg-[#18201E] text-white">
              <div className="flex items-center px-4 py-4 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#B9D7CA]">Turno</div>
              {weekdays.map((weekday, index) => <div key={index} className="border-l border-white/10 px-3 py-3 text-center"><div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#B9D7CA]">Dia {String(index + 1).padStart(2, "0")}</div><div className="mt-1 text-xs font-bold capitalize">{weekday}</div></div>)}
            </div>
            {(["morning", "afternoon"] as CadenceSlot[]).map((slot) => <div key={slot} className="grid grid-cols-[112px_repeat(10,minmax(100px,1fr))] border-b border-[#E3E6E0] last:border-b-0"><div className="flex items-center bg-[#EFF4EF] px-4 text-xs font-extrabold uppercase tracking-[0.08em] text-[#315C4D]">{slotLabel[slot]}</div>{Array.from({ length: 10 }, (_, index) => { const day = index + 1; const block = blockAt(day, slot); return <div key={day} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { if (block) return; const id = event.dataTransfer?.getData("text/plain"); if (id) onMove(id, day, slot); }} className="cadence-cell min-h-[172px] border-l border-[#E3E6E0] bg-[#FCFCFA] p-2 transition-colors hover:bg-[#F3F8F4]">{block ? <div draggable onDragStart={(event) => { event.dataTransfer.setData("text/plain", block.id); }} onDoubleClick={() => beginEdit(block)} className="cadence-block group relative flex h-full min-h-[150px] cursor-grab flex-col items-center rounded-2xl border border-[#CFE6DA] bg-[#E8F6F0] p-3 text-center shadow-[0_8px_18px_rgba(16,169,122,0.08)] active:cursor-grabbing"><div className="mb-3 flex w-full justify-center"><div title={block.channel} aria-label={`Canal: ${block.channel}`} className={`grid h-16 w-16 place-items-center rounded-[22px] border shadow-[0_8px_16px_rgba(27,37,34,0.08)] ${channelIconTone[block.channel]}`}>{(() => { const Icon = channelIcon[block.channel]; return <Icon size={34} strokeWidth={2.35} aria-hidden="true" />; })()}</div></div><p className="text-sm font-extrabold leading-tight text-[#1B2522]">{block.title}</p>{block.notes && <p className="mt-2 line-clamp-3 text-[11px] font-medium leading-4 text-[#577066]">{block.notes}</p>}<div className="mt-auto flex items-center justify-center gap-3 pt-3 text-[10px] font-bold text-[#087E5E]"><button onClick={(event) => { event.stopPropagation(); beginEdit(block); }} className="opacity-0 transition-opacity group-hover:opacity-100">Editar</button><button onClick={(event) => { event.stopPropagation(); onDelete(block.id); }} className="text-[#B04A43] opacity-0 transition-opacity group-hover:opacity-100">Excluir</button></div></div> : <button onClick={() => openCreate(day, slot)} className="cadence-empty flex h-full min-h-[150px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-[#D7DFD8] text-[#A0AAA4] transition hover:border-[#10A97A] hover:bg-[#F3F8F4] hover:text-[#087E5A]"><Plus size={18} /><span className="mt-2 text-[10px] font-bold">Adicionar ação</span></button>}</div>; })}</div>)}
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs font-medium text-[#87928D]">Dica: arraste um bloco para uma célula vazia. Dê duplo clique ou use “Editar” para alterar canal, título e observações.</p>
    </div>
    <Dialog open={Boolean(draft)} onOpenChange={(open) => { if (!open) { setDraft(null); setCreateSlot(null); } }}><DialogContent className="max-w-[480px] border-[#E2E7E0] bg-[#FCFCFA]"><DialogHeader><DialogTitle className="font-display text-2xl tracking-[-0.04em]">{createSlot ? "Nova ação da cadência" : "Editar ação da cadência"}</DialogTitle><DialogDescription>Defina a mensagem e o canal desse ponto da sequência.</DialogDescription></DialogHeader>{draft && <div className="space-y-4"><div><Label>Título</Label><Input className="mt-1" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></div><div><Label>Canal</Label><select className="form-select mt-1" value={draft.channel} onChange={(event) => setDraft({ ...draft, channel: event.target.value as CadenceChannel })}>{channels.map((channel) => <option key={channel}>{channel}</option>)}</select></div><div><Label>Observações</Label><textarea className="form-textarea mt-1 min-h-[110px]" value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} /></div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setDraft(null)}>Cancelar</Button><Button onClick={saveDraft} className="bg-[#10A97A] hover:bg-[#087E5A]">Salvar ação</Button></div></div>}</DialogContent></Dialog>
  </section>;
}

function PipelineWorkspace({ funnels, activeFunnel, activeFunnelId, deals, wonDeals, lostDeals, wonStage, lostStage, totalPipeline, weightedPipeline, draggedDealId, overStageId, draggedStageId, overStageReorderId, onSelectFunnel, onNewFunnel, onEditFunnel, onNewDeal, onEditDeal, onDeleteDeal, onNewStage, onEditStage, onDragStart, onDrop, onWinDrop, onLoseDrop, onDragOver, onDragEnd, onStageDragStart, onStageDragOver, onStageDrop, onStageDragEnd }: { funnels: SalesFunnel[]; activeFunnel?: SalesFunnel; activeFunnelId: string; deals: Deal[]; wonDeals: Deal[]; lostDeals: Deal[]; wonStage?: Stage; lostStage?: Stage; totalPipeline: number; weightedPipeline: number; draggedDealId: string | null; overStageId: string | null; draggedStageId: string | null; overStageReorderId: string | null; onSelectFunnel: (id: string) => void; onNewFunnel: () => void; onEditFunnel: () => void; onNewDeal: () => void; onEditDeal: (deal: Deal) => void; onDeleteDeal: (deal: Deal) => void; onNewStage: () => void; onEditStage: (stage: Stage) => void; onDragStart: (event: DragEvent<HTMLElement>, dealId: string) => void; onDrop: (stageId: string, event?: DragEvent<HTMLElement>) => void; onWinDrop: (event?: DragEvent<HTMLElement>) => void; onLoseDrop: (event?: DragEvent<HTMLElement>) => void; onDragOver: (event: DragEvent<HTMLElement>, stageId: string) => void; onDragEnd: () => void; onStageDragStart: (event: DragEvent<HTMLElement>, stageId: string) => void; onStageDragOver: (event: DragEvent<HTMLElement>, stageId: string) => void; onStageDrop: (stageId: string, event?: DragEvent<HTMLElement>) => void; onStageDragEnd: () => void }) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [showWonSales, setShowWonSales] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [compactView, setCompactView] = useState(false);
  const visibleDeals = deals.filter((deal) => {
    const term = searchTerm.trim().toLowerCase();
    return !term || `${deal.title} ${deal.company} ${deal.tag}`.toLowerCase().includes(term);
  });
  const visibleWonDeals = wonDeals.filter((deal) => {
    const term = searchTerm.trim().toLowerCase();
    return !term || `${deal.title} ${deal.company} ${deal.tag}`.toLowerCase().includes(term);
  });
  const wonSalesValue = visibleWonDeals.reduce((sum, deal) => sum + deal.value, 0);
  if (!activeFunnel) return <div className="pipeline-shell grid min-h-screen place-items-center px-5 pt-[68px] md:pt-0"><div className="max-w-md text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#E8F6F0] text-[#087E5A]"><GitBranch size={26} /></div><p className="eyebrow mt-6">Operação comercial</p><h1 className="page-title">Seu primeiro funil começa aqui</h1><p className="mt-3 text-sm leading-6 text-[#718079]">Crie etapas próprias para conduzir oportunidades, acompanhar valores e mover a receita com clareza.</p><Button onClick={onNewFunnel} className="mt-6 h-11 gap-2 rounded-xl bg-[#10A97A] px-5 font-bold hover:bg-[#087E5A]"><CirclePlus size={18} />Criar funil</Button></div></div>;
  return <div className="pipeline-shell pt-[68px] md:pt-0"><header><div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between"><div className="flex min-w-0 flex-wrap items-center gap-2.5"><div className="flex items-center gap-2"><h1 className="page-title">Funis</h1><span className="hidden h-2 w-2 rounded-full bg-[#10A97A] sm:block" /></div><span className="hidden h-5 w-px bg-[#DDE4DE] sm:block" /><div className="relative"><select aria-label="Selecionar funil" className="funnel-selector appearance-none" value={activeFunnelId} onChange={(event) => onSelectFunnel(event.target.value)}>{funnels.map((funnel) => <option key={funnel.id} value={funnel.id}>{funnel.name}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#77847E]" /></div><button onClick={onEditFunnel} className="icon-button" aria-label="Editar funil"><Pencil size={16} /></button><button onClick={onNewFunnel} className="hidden items-center gap-1.5 text-sm font-bold text-[#087E5A] sm:flex"><CirclePlus size={17} />Novo funil</button></div><div className="flex flex-wrap items-center gap-2"><div className="flex gap-2"><MiniMetric label="Em aberto" value={formatCurrency(totalPipeline)} /><MiniMetric label="Previsão" value={formatCurrency(weightedPipeline)} accent /></div><button className={`tool-button ${showWonSales ? "bg-[#E8F6F0] text-[#087E5A]" : ""}`} onClick={() => setShowWonSales((open) => !open)} aria-pressed={showWonSales}><CircleDollarSign size={16} /><span>Vendas ({wonDeals.length})</span></button><button className={`icon-button hidden sm:grid ${filterOpen || searchTerm ? "bg-[#E8F6F0] text-[#087E5A]" : ""}`} onClick={() => setFilterOpen((open) => !open)} aria-label="Filtrar oportunidades" aria-expanded={filterOpen}><Filter size={17} /></button><button className={`tool-button hidden sm:flex ${compactView ? "bg-[#E8F6F0] text-[#087E5A]" : ""}`} onClick={() => setCompactView((compact) => !compact)} aria-pressed={compactView}><SlidersHorizontal size={17} /><span>{compactView ? "Confortável" : "Compacta"}</span></button><Button onClick={onNewDeal} className="h-10 gap-2 rounded-xl bg-[#10A97A] px-4 font-bold hover:bg-[#087E5A]"><Plus size={18} />Oportunidade</Button></div></div></header>
    {filterOpen && <div className="mx-5 mt-4 flex items-center gap-3 rounded-2xl border border-[#DDE8E0] bg-[#F7FBF8] p-3 md:mx-8"><Search size={16} className="text-[#6F7D75]" /><Input autoFocus value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar por negócio, empresa ou etiqueta" className="h-9 max-w-sm border-0 bg-transparent shadow-none focus-visible:ring-0" /><span className="ml-auto text-xs font-semibold text-[#7B8882]">{visibleDeals.length} em aberto</span></div>}
    {showWonSales && <section className="mx-5 mt-4 rounded-[24px] border border-[#BDE5D5] bg-[#F3FBF7] p-4 md:mx-8 md:p-5"><div className="flex flex-col gap-3 border-b border-[#D8EEE3] pb-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow text-[#087E5A]">Histórico comercial</p><h2 className="font-display text-xl font-extrabold tracking-[-0.04em] text-[#1F3029]">Vendas convertidas</h2><p className="mt-1 text-xs font-medium text-[#6C8177]">Cards que foram movidos para Ganho neste funil.</p></div><div className="text-left sm:text-right"><p className="text-[9px] font-extrabold uppercase tracking-[0.13em] text-[#6C8177]">Valor ganho</p><p className="mt-0.5 font-display text-lg font-extrabold tracking-[-0.04em] text-[#087E5A]">{formatCurrency(wonSalesValue)}</p></div></div><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{visibleWonDeals.map((deal) => <DealCard key={deal.id} deal={deal} isDragging={false} readOnly onEdit={() => onEditDeal(deal)} onDelete={() => onDeleteDeal(deal)} onDragStart={onDragStart} onDragEnd={onDragEnd} />)}{visibleWonDeals.length === 0 && <div className="sm:col-span-2 xl:col-span-3 rounded-2xl border border-dashed border-[#BBDCCD] bg-white/60 px-5 py-8 text-center text-sm font-medium text-[#6F8178]">Nenhuma venda convertida encontrada{searchTerm ? " para esta busca" : " ainda"}.</div>}</div></section>}
    <div className="relative overflow-hidden px-5 pb-5 pt-4 md:px-8"><div className="pointer-events-none absolute right-8 top-2 hidden h-44 w-80 overflow-hidden rounded-full opacity-[0.13] xl:block"><img src={funnelArtUrl} alt="" className="h-full w-full object-cover" /></div><div className="relative z-10 overflow-x-auto pb-3"><div className="flex min-w-max items-stretch gap-4">{activeFunnel?.stages.filter((stage) => !isWonStage(stage) && !isLostStage(stage)).map((stage) => <PipelineColumn key={stage.id} stage={stage} deals={visibleDeals.filter((deal) => deal.stageId === stage.id)} isOver={overStageId === stage.id} draggedDealId={draggedDealId} draggedStageId={draggedStageId} isStageReorderTarget={overStageReorderId === stage.id} onEditStage={() => onEditStage(stage)} onEditDeal={onEditDeal} onDeleteDeal={onDeleteDeal} onDragStart={onDragStart} onStageDragStart={onStageDragStart} onStageDragOver={onStageDragOver} onStageDrop={onStageDrop} onStageDragEnd={onStageDragEnd} compactView={compactView} onDragOver={onDragOver} onDrop={onDrop} onDragEnd={onDragEnd} />)}<button onClick={onNewStage} className="stage-add-button"><CirclePlus size={20} /><span>Nova etapa</span></button></div></div>
      <div className={`outcome-dropzones ${draggedDealId ? "outcome-dropzones-dragging" : ""}`} aria-live="polite"><OutcomeDropzone type="won" stage={wonStage} deals={wonDeals} isOver={wonStage ? overStageId === wonStage.id : overStageId === "won"} onDragOver={onDragOver} onDrop={onWinDrop} /><OutcomeDropzone type="lost" stage={lostStage} deals={lostDeals} isOver={overStageId === "lost" || (lostStage ? overStageId === lostStage.id : false)} onDragOver={(event) => onDragOver(event, lostStage?.id ?? "lost")} onDrop={onLoseDrop} /></div>
      <div className="mt-3 flex items-center gap-2 text-xs text-[#728079]"><GripVertical size={15} /><span>{draggedDealId ? "Solte a oportunidade em Ganho ou Perdido para concluir a decisão." : "Arraste oportunidades entre as etapas; Ganho e Perdido ficam no rodapé."}</span></div></div></div>;
}

function MiniMetric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <div className={`metric-instrument rounded-xl border px-3 py-2 ${accent ? "border-[#BDE5D5] bg-[#E8F6F0]" : "border-[#E0E6E0] bg-white"}`}><p className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#7B8882]">{accent && <span className="pulse-dot h-1.5 w-1.5 shadow-[0_0_0_3px_rgba(16,169,122,0.12)]" />}{label}</p><p className={`font-display mt-0.5 text-[16px] font-extrabold tracking-[-0.05em] ${accent ? "text-[#087E5A]" : "text-[#27302D]"}`}>{value}</p></div>;
}

function OutcomeDropzone({ type, stage, deals, isOver, onDragOver, onDrop }: { type: "won" | "lost"; stage?: Stage; deals: Deal[]; isOver: boolean; onDragOver: (event: DragEvent<HTMLElement>, stageId: string) => void; onDrop: (event: DragEvent<HTMLElement>) => void }) {
  const isWon = type === "won";
  const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);
  const stageId = stage?.id ?? type;
  return <section onDragEnterCapture={(event) => onDragOver(event, stageId)} onDragOverCapture={(event) => onDragOver(event, stageId)} onDropCapture={(event) => { event.preventDefault(); event.stopPropagation(); onDrop(event); }} className={`outcome-dropzone outcome-dropzone-${type} ${isOver ? `outcome-dropzone-${type}-over` : ""}`} aria-label={isWon ? "Zona de ganho" : "Zona de oportunidade perdida"}><div className="flex min-w-0 items-center gap-3"><div className="outcome-dropzone-icon">{isWon ? <CircleDollarSign size={19} /> : <X size={20} />}</div><div className="min-w-0"><p className="text-[9px] font-extrabold uppercase tracking-[0.15em] opacity-75">Decisão comercial</p><h2 className="font-display text-base font-extrabold tracking-[-0.035em]">{isWon ? "Ganhar oportunidade" : "Marcar como perdido"}</h2></div></div><div className="ml-auto hidden items-center gap-4 text-right sm:flex"><div><p className="text-[9px] font-bold uppercase tracking-[0.13em] opacity-75">{isWon ? "Ganhas" : "Perdidas"}</p><p className="font-display mt-0.5 text-sm font-extrabold tracking-[-0.04em]">{deals.length}</p></div><div><p className="text-[9px] font-bold uppercase tracking-[0.13em] opacity-75">Valor</p><p className="font-display mt-0.5 text-sm font-extrabold tracking-[-0.04em]">{formatCurrency(totalValue)}</p></div></div></section>;
}

function PipelineColumn({ stage, deals, isOver, draggedDealId, draggedStageId, isStageReorderTarget, compactView, onEditStage, onEditDeal, onDeleteDeal, onDragStart, onStageDragStart, onStageDragOver, onStageDrop, onStageDragEnd, onDragOver, onDrop, onDragEnd }: { stage: Stage; deals: Deal[]; isOver: boolean; draggedDealId: string | null; draggedStageId: string | null; isStageReorderTarget: boolean; compactView: boolean; onEditStage: () => void; onEditDeal: (deal: Deal) => void; onDeleteDeal: (deal: Deal) => void; onDragStart: (event: DragEvent<HTMLElement>, dealId: string) => void; onStageDragStart: (event: DragEvent<HTMLElement>, stageId: string) => void; onStageDragOver: (event: DragEvent<HTMLElement>, stageId: string) => void; onStageDrop: (stageId: string, event?: DragEvent<HTMLElement>) => void; onStageDragEnd: () => void; onDragOver: (event: DragEvent<HTMLElement>, stageId: string) => void; onDrop: (stageId: string, event?: DragEvent<HTMLElement>) => void; onDragEnd: () => void }) {
  const columnValue = deals.reduce((sum, deal) => sum + deal.value, 0);
  const estimatedColumnValue = columnValue * (stage.probability / 100);
  const isStageReorderDrag = (event: DragEvent<HTMLElement>) => draggedStageId !== null || Array.from(event.dataTransfer.types).includes("application/x-ritmo-stage");
  return <section onDragEnter={(event) => { if (isStageReorderDrag(event)) onStageDragOver(event, stage.id); }} onDragOver={(event) => { if (isStageReorderDrag(event)) onStageDragOver(event, stage.id); else onDragOver(event, stage.id); }} onDrop={(event) => { event.preventDefault(); if (isStageReorderDrag(event)) onStageDrop(stage.id, event); else onDrop(stage.id, event); }} className={`pipeline-column ${isOver ? "pipeline-column-over" : ""} ${isStageReorderTarget ? "ring-2 ring-[#10A97A]/40" : ""}`}><header draggable onDragStart={(event) => onStageDragStart(event, stage.id)} onDragOver={(event) => onStageDragOver(event, stage.id)} onDrop={(event) => onStageDrop(stage.id, event)} onDragEnd={onStageDragEnd} className={`mb-4 flex select-none cursor-grab items-center gap-2 rounded-xl px-1 ${draggedStageId === stage.id ? "opacity-50" : ""}`}>
<GripVertical size={15} className="shrink-0 text-[#9AA79F]" aria-hidden="true" /><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color }} /><div className="min-w-0 flex-1"><h2 className="truncate text-sm font-extrabold text-[#2C3632]">{stage.name}</h2><p className="mt-0.5 text-xs text-[#7B8882]">{deals.length} {deals.length === 1 ? "negócio" : "negócios"} · {stage.probability}%</p></div><button onClick={(event) => event.stopPropagation()} onMouseDown={(event) => event.stopPropagation()} onClickCapture={onEditStage} className="icon-button h-7 w-7 opacity-70 hover:opacity-100" aria-label={`Editar etapa ${stage.name}`}><MoreHorizontal size={16} /></button></header><div className="column-instrument-grid mb-4 grid grid-cols-2 gap-2 px-1 py-2.5"><div><p className="text-[9px] font-extrabold uppercase tracking-[0.11em] text-[#829089]">Em aberto</p><p className="column-value mt-0.5 text-sm font-extrabold tracking-[-0.02em] text-[#44524C]">{formatCurrency(columnValue)}</p></div><div className="column-estimated-value border-l border-[#DCE9E2] pl-2.5"><p className="text-[9px] font-extrabold uppercase tracking-[0.11em] text-[#0A8C65]">Estimado</p><p className="mt-0.5 text-sm font-extrabold tracking-[-0.02em] text-[#087E5A]">{formatCurrency(estimatedColumnValue)}</p></div></div><div className={`min-h-[420px] space-y-3 ${compactView ? "[&_.deal-card]:!p-3 [&_.deal-card]:!min-h-0 [&_.deal-card_h3]:!text-sm [&_.deal-card_.mt-4]:!mt-2" : ""}`}>{deals.map((deal) => <DealCard key={deal.id} deal={deal} isDragging={draggedDealId === deal.id} onEdit={() => onEditDeal(deal)} onDelete={() => onDeleteDeal(deal)} onDragStart={onDragStart} onDragEnd={onDragEnd} />)}{deals.length === 0 && <div className="grid min-h-28 place-items-center rounded-xl border border-dashed border-[#D6DED8] bg-white/45 p-4 text-center text-xs font-medium text-[#87928D]">Solte uma oportunidade aqui</div>}</div></section>;
}

function FinanceWorkspace({ entries, onAdd, onUpdate, onDelete }: { entries: FinanceEntry[]; onAdd: () => void; onUpdate: (id: string, field: keyof Omit<FinanceEntry, "id">, value: string | number) => void; onDelete: (id: string) => void }) {
  const today = new Date();
  const { total, count, nextDue, daysRemaining } = summarizeFinanceEntries(entries, today);
  return <div className="grid gap-5 pb-8">
    <div className="flex flex-col gap-4 rounded-[26px] border border-[#E3E9E3] bg-[#FCFCFA] p-5 shadow-[0_12px_32px_rgba(30,55,44,0.04)] sm:flex-row sm:items-end sm:justify-between">
      <div><p className="eyebrow">Controle financeiro</p><h1 className="font-display text-3xl font-bold tracking-[-0.04em] text-[#27302D]">Financeiro<span className="text-[#10A97A]">.</span></h1><p className="mt-2 max-w-xl text-sm text-[#77847D]">Acompanhe despesas, parcelas e próximos vencimentos em uma bancada simples e editável.</p></div>
      <Button onClick={onAdd} className="w-full bg-[#10A97A] text-white hover:bg-[#087E5A] sm:w-auto"><Plus size={16} /> Novo lançamento</Button>
    </div>
    <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-[#E3E9E3] bg-[#FCFCFA] p-4"><p className="eyebrow">Total lançado</p><p className="mt-2 text-2xl font-bold text-[#087E5A]">{formatCurrency(total)}</p><p className="mt-1 text-xs text-[#8A958F]">{count} {count === 1 ? "despesa" : "despesas"}</p></div><div className="rounded-2xl border border-[#E3E9E3] bg-[#FCFCFA] p-4"><p className="eyebrow">Próximo vencimento</p><p className="mt-2 text-base font-bold text-[#27302D]">{nextDue?.expense || "Nenhum lançamento"}</p><p className="mt-1 text-xs text-[#8A958F]">{daysRemaining === null ? "Cadastre uma data" : daysRemaining < 0 ? `Vencido há ${Math.abs(daysRemaining)} dias` : `${daysRemaining} dias restantes`}</p></div><div className="rounded-2xl border border-[#E3E9E3] bg-[#FCFCFA] p-4"><p className="eyebrow">Período</p><p className="mt-2 text-base font-bold text-[#27302D]">Visão atual</p><p className="mt-1 text-xs text-[#8A958F]">Atualização automática dos valores</p></div></div>
    <div className="overflow-hidden rounded-[26px] border border-[#E3E9E3] bg-[#FCFCFA] shadow-[0_12px_32px_rgba(30,55,44,0.04)]"><div className="flex items-center justify-between border-b border-[#E7EBE6] px-5 py-4"><div><p className="eyebrow">Lançamentos</p><h2 className="font-display text-lg font-bold text-[#27302D]">Despesas e compromissos</h2></div><span className="rounded-full bg-[#E7F5EF] px-3 py-1 text-xs font-bold text-[#087E5A]">{formatCurrency(total)}</span></div><div className="overflow-x-auto"><table className="min-w-[780px] w-full text-left"><thead className="bg-[#F1F5F0] text-[10px] uppercase tracking-[0.14em] text-[#6F7D75]"><tr><th className="px-4 py-3">Despesa</th><th className="px-4 py-3">Valor</th><th className="px-4 py-3">Parcela</th><th className="px-4 py-3">Data</th><th className="px-4 py-3">Faltam</th><th className="px-4 py-3"></th></tr></thead><tbody>{entries.map((entry) => { const remaining = entry.dueDate ? Math.round((new Date(`${entry.dueDate}T00:00:00`).getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86400000) : null; return <tr key={entry.id} className="border-t border-[#EDF0EC] align-top"><td className="px-4 py-3"><Input value={entry.expense} onChange={(event) => onUpdate(entry.id, "expense", event.target.value)} placeholder="Ex.: Aluguel" className="min-w-[190px] bg-white" /></td><td className="px-4 py-3"><Input type="number" min="0" step="0.01" value={entry.amount} onChange={(event) => onUpdate(entry.id, "amount", Number(event.target.value))} className="w-[130px] bg-white" /></td><td className="px-4 py-3"><Input value={entry.installment} onChange={(event) => onUpdate(entry.id, "installment", event.target.value)} placeholder="Parcela 1 de 12" className="min-w-[150px] bg-white" /></td><td className="px-4 py-3"><Input type="date" value={entry.dueDate} onChange={(event) => onUpdate(entry.id, "dueDate", event.target.value)} className="w-[150px] bg-white" /></td><td className="px-4 py-3 text-sm font-semibold text-[#087E5A]">{remaining === null ? "—" : remaining < 0 ? `-${Math.abs(remaining)}d` : `${remaining}d`}</td><td className="px-4 py-3"><button onClick={() => onDelete(entry.id)} className="icon-button hover:text-[#B04A43]" aria-label={`Excluir ${entry.expense || "lançamento"}`}><Trash2 size={15} /></button></td></tr> })}</tbody></table>{!entries.length && <div className="px-5 py-12 text-center text-sm text-[#7D8983]">Nenhum lançamento ainda. Adicione a primeira despesa para começar.</div>}</div></div>
  </div>;
}

function ServicesWorkspace({ services, onAdd, onUpdate, onDelete, onSave, onReorder, savingServiceId }: { services: Service[]; onAdd: () => void; onUpdate: (id: string, field: keyof Omit<Service, "id">, value: string | number) => void; onDelete: (id: string) => void; onSave: (id: string) => void | Promise<void>; onReorder: (fromId: string, toId: string) => void | Promise<void>; savingServiceId: string | null }) {
  const [viewMode, setViewMode] = useState<"cards" | "lista">("lista");
  const [draggedServiceId, setDraggedServiceId] = useState<string | null>(null);
  const orderedServices = useMemo(() => [...services].sort((a, b) => a.position - b.position), [services]);

  const startServiceDrag = (event: DragEvent<HTMLElement>, serviceId: string) => {
    setDraggedServiceId(serviceId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", serviceId);
  };
  const dropService = (event: DragEvent<HTMLElement>, targetId: string) => {
    event.preventDefault();
    const sourceId = draggedServiceId ?? event.dataTransfer.getData("text/plain");
    if (sourceId && sourceId !== targetId) void onReorder(sourceId, targetId);
    setDraggedServiceId(null);
  };
  const finishServiceDrag = () => setDraggedServiceId(null);
  const serviceName = (service: Service) => service.name.trim() || "Serviço sem nome";
  const serviceAction = (service: Service) => <div className="flex items-center gap-1.5">
    <Button type="button" onClick={() => void onSave(service.id)} disabled={savingServiceId === service.id} className="grid h-8 w-8 place-items-center rounded-lg bg-[#10A97A] p-0 text-white hover:bg-[#087E5A] disabled:cursor-wait disabled:opacity-70" aria-label={`Salvar ${serviceName(service)}`} title="Salvar serviço">
      {savingServiceId === service.id ? <RotateCcw className="h-3.5 w-3.5 animate-spin" /> : <ClipboardCheck className="h-3.5 w-3.5" />}
    </Button>
    <button type="button" onClick={() => onDelete(service.id)} className="grid h-8 w-8 place-items-center rounded-lg text-[#9AA59F] transition hover:bg-[#FCECEA] hover:text-[#B04A43]" aria-label={`Excluir ${serviceName(service)}`} title="Excluir serviço"><Trash2 size={15} /></button>
  </div>;
  const serviceEditor = (service: Service, compact = false) => <>
    <label className="block min-w-0"><span className="mb-1 block text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#74827B]">Nome</span><Input value={service.name} onChange={(event) => onUpdate(service.id, "name", event.target.value)} placeholder="Ex.: Consultoria comercial" className="h-9 bg-white font-bold" /></label>
    <label className="block min-w-0"><span className="mb-1 block text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#74827B]">Prazo</span><div className="flex gap-2"><Input type="number" min="1" max="3650" value={service.deadline} onChange={(event) => onUpdate(service.id, "deadline", Number(event.target.value))} className="h-9 min-w-0 bg-white" /><select className="form-select h-9 min-w-0 bg-white" value={service.deadlineUnit} onChange={(event) => onUpdate(service.id, "deadlineUnit", event.target.value as ServiceDeadlineUnit)}><option value="dias">dias</option><option value="semanas">semanas</option><option value="meses">meses</option></select></div></label>
    <label className="block min-w-0"><span className="mb-1 block text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#74827B]">Cobrança</span><select className="form-select h-9 w-full bg-white" value={service.pricingType} onChange={(event) => onUpdate(service.id, "pricingType", event.target.value as ServicePricingType)}><option value="Fixo">Fixo</option><option value="Mensal">Mensal</option><option value="A partir de">A partir de</option></select></label>
    <label className={`${compact ? "sm:col-span-2" : ""} block min-w-0`}><span className="mb-1 block text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#74827B]">Entregáveis</span><textarea value={service.deliverables} onChange={(event) => onUpdate(service.id, "deliverables", event.target.value)} placeholder="Escopo, etapas ou resultados incluídos" rows={compact ? 2 : 1} className="form-textarea min-h-0 w-full resize-y bg-white text-sm leading-5" /></label>
  </>;

  return <div className="grid gap-5 pb-8">
    <div className="flex items-center justify-between rounded-[26px] border border-[#E3E9E3] bg-[#FCFCFA] p-5 shadow-[0_12px_32px_rgba(30,55,44,0.04)]">
      <h1 className="font-display text-3xl font-bold tracking-[-0.04em] text-[#27302D]">Serviços<span className="text-[#10A97A]">.</span></h1>
      <Button onClick={onAdd} className="bg-[#10A97A] text-white hover:bg-[#087E5A]"><Plus size={16} /> Novo serviço</Button>
    </div>
    <div className="rounded-[26px] border border-[#E3E9E3] bg-[#FCFCFA] p-4 shadow-[0_12px_32px_rgba(30,55,44,0.04)] sm:p-5">
      <div className="flex flex-col gap-4 border-b border-[#E7EBE6] pb-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="eyebrow">Itens do catálogo</p><div className="mt-1 flex flex-wrap items-center gap-2"><h2 className="font-display text-lg font-bold text-[#27302D]">Oferta pronta para apresentar</h2><span className="inline-flex items-center gap-1.5 rounded-full bg-[#E7F5EF] px-2.5 py-1 text-xs font-bold text-[#087E5E]"><BriefcaseBusiness size={13} />{services.length}</span></div><p className="mt-1 text-xs text-[#7D8983]">Arraste pelo ícone para reorganizar a ordem.</p></div><div className="flex items-center gap-2"><div className="flex items-center rounded-xl border border-[#DDE7DF] bg-[#F7FAF7] p-1" role="group" aria-label="Modo de visualização"><button type="button" onClick={() => setViewMode("cards")} aria-pressed={viewMode === "cards"} className={`grid h-8 w-9 place-items-center rounded-lg transition ${viewMode === "cards" ? "bg-white text-[#087E5A] shadow-sm" : "text-[#85918B] hover:text-[#087E5A]"}`} title="Visualização em cards"><LayoutGrid size={15} /></button><button type="button" onClick={() => setViewMode("lista")} aria-pressed={viewMode === "lista"} className={`grid h-8 w-9 place-items-center rounded-lg transition ${viewMode === "lista" ? "bg-white text-[#087E5A] shadow-sm" : "text-[#85918B] hover:text-[#087E5A]"}`} title="Visualização em lista"><List size={16} /></button></div></div></div>
      {orderedServices.length ? viewMode === "cards" ? <div className="mt-4 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">{orderedServices.map((service) => <article key={service.id} draggable onDragStart={(event) => startServiceDrag(event, service.id)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropService(event, service.id)} onDragEnd={finishServiceDrag} className={`rounded-2xl border border-[#E3E9E3] bg-[#FBFCFA] p-3.5 transition hover:border-[#B8DCCB] hover:shadow-[0_8px_20px_rgba(30,55,44,0.06)] ${draggedServiceId === service.id ? "opacity-50" : ""}`}><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-2"><GripVertical className="h-4 w-4 shrink-0 cursor-grab text-[#AAB7AF]" aria-hidden="true" /><span className="tag-chip bg-[#E8F6F0] text-[#087E5A]">{service.pricingType}</span></div><div className="flex items-start gap-3"><div className="text-right"><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#81908A]">Valor</p><p className="font-display text-xl font-extrabold tracking-[-0.045em] text-[#087E5A]">{formatCurrency(service.price)}</p></div>{serviceAction(service)}</div></div><div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,0.8fr)_minmax(0,0.9fr)]">{serviceEditor(service, true)}</div></article>)}</div> : <div className="mt-4 overflow-x-auto rounded-2xl border border-[#E3E9E3] bg-[#FBFCFA]"><div className="min-w-[980px]"><div className="grid grid-cols-[28px_minmax(180px,1.4fr)_140px_175px_130px_minmax(190px,1fr)_84px] items-center gap-3 border-b border-[#E7EBE6] bg-[#F7FAF7] px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#7A8881]"><span /><span>Serviço</span><span>Valor</span><span>Prazo</span><span>Cobrança</span><span>Entregáveis</span><span className="text-right">Ações</span></div>{orderedServices.map((service) => <div key={service.id} draggable onDragStart={(event) => startServiceDrag(event, service.id)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropService(event, service.id)} onDragEnd={finishServiceDrag} className={`grid grid-cols-[28px_minmax(180px,1.4fr)_140px_175px_130px_minmax(190px,1fr)_84px] items-center gap-3 border-b border-[#EDF0EC] px-3 py-3 last:border-b-0 hover:bg-[#FAFCFA] ${draggedServiceId === service.id ? "bg-[#F0F8F3] opacity-60" : ""}`}><GripVertical className="h-4 w-4 cursor-grab text-[#AAB7AF]" aria-label="Arrastar para reordenar" /><label className="min-w-0"><span className="sr-only">Nome do serviço</span><Input value={service.name} onChange={(event) => onUpdate(service.id, "name", event.target.value)} className="h-9 bg-white font-bold" /></label><label className="min-w-0"><span className="sr-only">Valor</span><Input type="number" min="0" step="0.01" value={service.price} onChange={(event) => onUpdate(service.id, "price", Number(event.target.value))} className="h-9 bg-white font-bold text-[#087E5A]" /></label><label className="flex min-w-0 gap-2"><span className="sr-only">Prazo</span><Input type="number" min="1" max="3650" value={service.deadline} onChange={(event) => onUpdate(service.id, "deadline", Number(event.target.value))} className="h-9 min-w-0 bg-white" /><select className="form-select h-9 min-w-0 bg-white" value={service.deadlineUnit} onChange={(event) => onUpdate(service.id, "deadlineUnit", event.target.value as ServiceDeadlineUnit)}><option value="dias">dias</option><option value="semanas">semanas</option><option value="meses">meses</option></select></label><label className="min-w-0"><span className="sr-only">Cobrança</span><select className="form-select h-9 w-full bg-white" value={service.pricingType} onChange={(event) => onUpdate(service.id, "pricingType", event.target.value as ServicePricingType)}><option value="Fixo">Fixo</option><option value="Mensal">Mensal</option><option value="A partir de">A partir de</option></select></label><label className="min-w-0"><span className="sr-only">Entregáveis</span><textarea value={service.deliverables} onChange={(event) => onUpdate(service.id, "deliverables", event.target.value)} rows={1} className="form-textarea min-h-0 w-full resize-y bg-white text-sm leading-5" /></label><div className="flex justify-end">{serviceAction(service)}</div></div>)}</div></div> : <div className="mt-4 grid min-h-64 place-items-center rounded-2xl border border-dashed border-[#C9D9CF] bg-[#F7FBF8] px-5 py-10 text-center"><div><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#E8F6F0] text-[#087E5A]"><BriefcaseBusiness size={21} /></div><p className="mt-4 font-display font-extrabold text-[#27302D]">Seu catálogo começa aqui</p><p className="mt-1 max-w-sm text-sm leading-5 text-[#74817A]">Cadastre seu primeiro serviço com escopo, prazo e valor para ganhar agilidade nas propostas.</p><Button onClick={onAdd} className="mt-5 bg-[#10A97A] font-bold text-white hover:bg-[#087E5A]"><Plus size={16} />Cadastrar primeiro serviço</Button></div></div>}
    </div>
  </div>;
}
function ActivitiesWorkspace({ deals, onToggleActivity, onOpenDeal }: { deals: Deal[]; onToggleActivity: (deal: Deal, activity: DealActivity) => void; onOpenDeal: (deal: Deal) => void }) {
  const rows = deals.flatMap((deal) => {
    const activities = deal.activities?.length ? deal.activities : [{ id: `next-${deal.id}`, subject: "Próxima atividade", dueAt: deal.nextActivity, done: deal.nextActivity === "Sem pendências" }];
    return activities.map((activity) => ({ deal, activity }));
  });
  const pendingCount = rows.filter(({ activity }) => !activity.done).length;
  return <div className="min-h-screen bg-[#F6F5F1] px-5 pb-8 pt-[92px] md:px-8 md:pt-8"><div className="mx-auto max-w-[1420px]"><header className="flex flex-col gap-4 border-b border-[#E2E7E1] pb-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">Cadência comercial</p><div className="mt-1 flex items-center gap-2"><h1 className="page-title">Atividades</h1><span className="h-2 w-2 rounded-full bg-[#10A97A]" /></div><p className="mt-2 text-sm text-[#728079]">Acompanhe os próximos passos que mantêm suas oportunidades em movimento.</p></div></header><section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_270px]"><div className="surface-panel overflow-hidden"><div className="flex items-center justify-between border-b border-[#E5EAE5] px-5 py-4 sm:px-6"><div><p className="text-sm font-extrabold text-[#27302D]">Agenda comercial</p><p className="mt-1 text-xs text-[#7B8882]">{pendingCount} {pendingCount === 1 ? "atividade pendente" : "atividades pendentes"}</p></div><span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F6F0] px-3 py-1.5 text-xs font-extrabold text-[#087E5A]"><Activity size={14} />Em andamento</span></div><div className="divide-y divide-[#E9EDE9]">{rows.map(({ deal, activity }) => <div key={activity.id} className="group flex gap-3 px-5 py-4 transition hover:bg-[#FAFBF9] sm:items-center sm:px-6"><button onClick={() => onToggleActivity(deal, activity)} className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border transition sm:mt-0 ${activity.done ? "border-[#10A97A] bg-[#10A97A] text-white" : "border-[#B8C7BE] bg-white text-transparent hover:border-[#10A97A] hover:text-[#10A97A]"}`} aria-label={activity.done ? "Reabrir atividade" : "Concluir atividade"}><CheckCircle2 size={14} /></button><button onClick={() => onOpenDeal(deal)} className="min-w-0 flex-1 text-left"><div className="flex flex-wrap items-center gap-2"><p className={`font-display text-sm font-extrabold tracking-[-0.025em] ${activity.done ? "text-[#8A9690] line-through" : "text-[#27302D]"}`}>{activity.subject}</p><span className="tag-chip bg-[#F1F4F1] text-[#64716B]">{deal.tag}</span></div><p className="mt-1 truncate text-xs font-medium text-[#74817A]">{deal.title} · {deal.company}</p></button><div className="ml-auto hidden min-w-[108px] items-center justify-end gap-1.5 text-xs font-bold text-[#607068] sm:flex"><Clock3 size={14} /><span>{activity.dueAt || "Sem data"}</span></div></div>)}{rows.length === 0 && <div className="grid min-h-64 place-items-center p-8 text-center"><div><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#E8F6F0] text-[#087E5A]"><Calendar size={21} /></div><p className="mt-4 font-display font-extrabold text-[#27302D]">Nenhuma atividade pendente</p><p className="mt-1 text-sm text-[#74817A]">Abra uma oportunidade para programar seu próximo passo.</p></div></div>}</div></div><aside className="surface-panel h-fit p-5"><p className="eyebrow">Leitura rápida</p><p className="mt-2 font-display text-4xl font-extrabold tracking-[-0.07em] text-[#17201E]">{pendingCount}</p><p className="mt-1 text-sm font-medium text-[#65746C]">ações que pedem continuidade</p><div className="mt-5 rounded-2xl bg-[#E8F6F0] p-4"><p className="text-xs font-extrabold text-[#087E5A]">Próximo passo</p><p className="mt-1 text-sm leading-5 text-[#315C4D]">Conclua uma atividade ou abra a oportunidade para registrar uma nova cadência.</p></div></aside></section></div></div>;
}

function DealCard({ deal, isDragging, readOnly = false, onEdit, onDelete, onDragStart, onDragEnd }: { deal: Deal; isDragging: boolean; readOnly?: boolean; onEdit: () => void; onDelete: () => void; onDragStart: (event: DragEvent<HTMLElement>, dealId: string) => void; onDragEnd: () => void }) {
  const pendingActivities = (deal.activities ?? []).filter((activity) => !activity.done).length;
  const noteCount = (deal.notes ?? []).length;
  return <div draggable={!readOnly} onDragStart={readOnly ? undefined : (event) => onDragStart(event, deal.id)} onDragEnd={readOnly ? undefined : onDragEnd} onClick={onEdit} className={`deal-card group ${isDragging ? "deal-card-dragging" : ""}`} role="button" tabIndex={0} onKeyDown={(event) => event.key === "Enter" && onEdit()}><div className="mb-3 flex items-center justify-between gap-2"><span className="tag-chip bg-[#F3F5F1] text-[#617069]">{deal.tag}</span><div className="flex items-center gap-1"><button type="button" draggable={false} onClick={(event) => { event.stopPropagation(); onDelete(); }} onKeyDown={(event) => event.stopPropagation()} className="grid h-7 w-7 place-items-center rounded-lg text-[#9AA59F] transition hover:bg-[#FCECEA] hover:text-[#B04A43]" aria-label={`Excluir ${deal.title}`} title="Excluir negócio"><Trash2 className="h-3.5 w-3.5" /></button>{!readOnly && <GripVertical className="h-4 w-4 text-[#ADB8B1]" />}</div></div><h3 className="font-display text-[15px] font-bold leading-5 tracking-[-0.025em] text-[#29332F]">{deal.title}</h3><div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[#728079]"><Building2 size={13} /><span className="truncate">{deal.company}</span></div>{(pendingActivities > 0 || noteCount > 0 || deal.contactName) && <div className="mt-3 flex flex-wrap gap-1.5">{pendingActivities > 0 && <span className="inline-flex items-center gap-1 rounded-md bg-[#E8F6F0] px-1.5 py-1 text-[10px] font-extrabold text-[#087E5A]"><Calendar size={11} />{pendingActivities}</span>}{noteCount > 0 && <span className="inline-flex items-center gap-1 rounded-md bg-[#F1F3F0] px-1.5 py-1 text-[10px] font-extrabold text-[#63706B]"><ClipboardList size={11} />{noteCount}</span>}{deal.contactName && <span className="inline-flex max-w-[112px] items-center gap-1 truncate rounded-md bg-[#F1F3F0] px-1.5 py-1 text-[10px] font-extrabold text-[#63706B]"><Users size={11} /><span className="truncate">{deal.contactName}</span></span>}</div>}<div className="mt-4 flex items-end justify-between gap-2"><div><p className="text-base font-extrabold tracking-[-0.03em] text-[#1B2522]">{formatCurrency(deal.value)}</p><div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-[#718079]"><Clock3 size={12} /><span>{deal.nextActivity}</span></div></div><div className="grid h-7 w-7 place-items-center rounded-full bg-[#E7F2ED] text-[9px] font-extrabold text-[#087E5A]">{deal.owner}</div></div></div>;
}
