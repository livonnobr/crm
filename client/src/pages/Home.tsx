/**
 * Oficina de Receita — página principal do CRM Ritmo.
 * Estilo: minimalismo tátil contemporâneo, superfícies marfim, grafite e Verde Ritmo.
 * O layout usa um trilho operacional lateral e uma bancada horizontal de oportunidades.
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect, useMemo, useState, type DragEvent, type FormEvent } from "react";
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
import { businessDaysUntilMonthEnd } from "@/lib/business-days";

type Page = "goals" | "pipeline" | "activities" | "people" | "prospecting" | "cadence" | "finance";

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
type GoalUnit = "atividades" | "R$";
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
  unit: "atividades",
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
  return unit === "R$" ? formatCurrency(value) : new Intl.NumberFormat("pt-BR").format(value);
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
  // The useAuth hook provides authentication state.
  // To implement login/logout, call logout(), or start login from an event
  // handler: onClick={() => startLogin()} (imported from "@/const"). Never call
  // startLogin() during render (no href={startLogin()}) — it mints a one-time
  // nonce cookie and must run only at the moment of navigation.
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  const [page, setPage] = useState<Page>(() => {
    const tab = new URLSearchParams(window.location.search).get("aba");
    return tab === "funil" ? "pipeline" : tab === "atividades" ? "activities" : tab === "cadencia" ? "cadence" : tab === "prospeccao" ? "prospecting" : tab === "financeiro" ? "finance" : "goals";
  });
  const [isSidebarPinned, setIsSidebarPinned] = useState(false);
  const [isSidebarHovering, setIsSidebarHovering] = useState(false);
  const [goals, setGoals] = useState<GoalItem[]>(() => storedValue("ritmo-goals", initialGoals));
  const [selectedGoalMonth, setSelectedGoalMonth] = useState(() => periodValueForDate("Mensal"));
  const [funnels, setFunnels] = useState<SalesFunnel[]>(() => storedValue("ritmo-funnels", initialFunnels));
  const [conversionRates, setConversionRates] = useState<ConversionRates>(() => storedValue("ritmo-conversion-rates", {}));
  const [deals, setDeals] = useState<Deal[]>(() => storedValue<Deal[]>("ritmo-deals", initialDeals).map((deal) => ({ ...deal, stageHistory: deal.stageHistory?.length ? deal.stageHistory : [deal.stageId], stageEvents: stageEventsForDeal(deal) })));
  const [prospectLists, setProspectLists] = useState<ProspectList[]>(() => storedProspectLists());
  const [trashedProspectLists, setTrashedProspectLists] = useState<TrashedProspectList[]>(() => storedTrashedProspectLists());
  const [cadenceBlocks, setCadenceBlocks] = useState<CadenceBlock[]>(() => storedValue("ritmo-cadence-blocks", initialCadenceBlocks));
  const [financeEntries, setFinanceEntries] = useState<FinanceEntry[]>(() => storedValue("ritmo-finance-entries", []));
  const [draggedCadenceId, setDraggedCadenceId] = useState<string | null>(null);
  const [cadenceEditId, setCadenceEditId] = useState<string | null>(null);
  const [activeProspectListId, setActiveProspectListId] = useState(() => storedValue("ritmo-active-prospect-list", "prospect-list-default"));
  const [activeFunnelId, setActiveFunnelId] = useState(() => storedValue("ritmo-active-funnel", "primary-funnel"));
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [isCloudLoading, setIsCloudLoading] = useState(isSupabaseConfigured);
  const [isCloudHydrating, setIsCloudHydrating] = useState(false);
  const [isProspectSaving, setIsProspectSaving] = useState(false);
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
  const [detailDealId, setDetailDealId] = useState<string | null>(null);
  const [deleteDealId, setDeleteDealId] = useState<string | null>(null);
  const pendingDeleteDeal = deals.find((deal) => deal.id === deleteDealId) ?? null;
  const cadenceEditBlock = cadenceBlocks.find((block) => block.id === cadenceEditId) ?? null;

  async function loadCloudWorkspace(userId: string) {
    if (!supabase) return;
    setIsCloudHydrating(true);
    setIsCloudLoading(true);
    const client = getSupabaseClient();
    const { data: existingWorkspace, error: workspaceLookupError } = await client
      .from("workspaces")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();

    if (workspaceLookupError) {
      toast.error("Não foi possível abrir seu espaço comercial.");
      setIsCloudLoading(false);
      setIsCloudHydrating(false);
      return;
    }

    let currentWorkspaceId = existingWorkspace?.id as string | undefined;
    if (!currentWorkspaceId) {
      const { data: createdWorkspace, error: createWorkspaceError } = await client
        .from("workspaces")
        .insert({ owner_id: userId, name: "Meu espaço comercial" })
        .select("id")
        .single();
      if (createWorkspaceError || !createdWorkspace) {
        toast.error("Não foi possível criar seu espaço comercial.");
        setIsCloudLoading(false);
        setIsCloudHydrating(false);
        return;
      }
      currentWorkspaceId = createdWorkspace.id as string;
    }

    const [{ data: goalRows, error: goalsError }, { data: funnelRows, error: funnelsError }, { data: conversionSettingsRow, error: conversionSettingsError }, { data: prospectListRows, error: prospectListsError }, { data: prospectRecordRows, error: prospectRecordsError }, { data: cadenceBlockRows, error: cadenceBlocksError }, { data: financeRows, error: financeError }] = await Promise.all([
      client.from("goals").select("id, title, goal_type, target, actual, unit, period, color, recurring, position, linked_funnel_id, linked_stage_id").eq("workspace_id", currentWorkspaceId).order("position", { ascending: true }),
      client.from("funnels").select("id, name, currency, position").eq("workspace_id", currentWorkspaceId).order("position"),
      client.from("conversion_settings").select("workspace_id, rates").eq("workspace_id", currentWorkspaceId).maybeSingle(),
      client.from("prospect_lists").select("id, workspace_id, name, deleted_at").eq("workspace_id", currentWorkspaceId).order("created_at"),
      client.from("prospect_records").select("id, list_id, decision_maker_first_name, decision_maker_last_name, decision_maker_role, decision_maker_email, decision_maker_phone, decision_maker_secondary_phone, monthly_visits, company, company_website, analysis, position").order("position"),
      client.from("cadence_blocks").select("id, workspace_id, day, slot, title, channel, notes, position").eq("workspace_id", currentWorkspaceId).order("position"),
      client.from("finance_entries").select("id, workspace_id, expense, amount, installment, due_date, notes, position").eq("workspace_id", currentWorkspaceId).order("position"),
    ]);

    if (goalsError || funnelsError || conversionSettingsError || prospectListsError || prospectRecordsError || cadenceBlocksError || financeError) {
      toast.error("Não foi possível carregar os dados salvos.");
      setIsCloudLoading(false);
      setIsCloudHydrating(false);
      return;
    }

    const cloudFunnels = (funnelRows ?? []) as FunnelRecord[];
    const funnelIds = cloudFunnels.map((funnel) => funnel.id);
    const [{ data: stageRows, error: stagesError }, { data: opportunityRows, error: opportunitiesError }] = funnelIds.length
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
    setDeals(normalizedDeals);
    setCadenceBlocks(normalizedCadenceBlocks.length ? normalizedCadenceBlocks : initialCadenceBlocks);
    setFinanceEntries(normalizedFinanceEntries);
    setProspectLists(normalizedProspectLists.length ? normalizedProspectLists : initialProspectLists);
    setTrashedProspectLists(normalizedProspectTrash);
    setActiveProspectListId(normalizedProspectLists[0]?.id ?? initialProspectLists[0].id);
    setActiveFunnelId(normalizedFunnels[0]?.id ?? "");
    setWorkspaceId(currentWorkspaceId);
    setIsCloudLoading(false);
    setIsCloudHydrating(false);
  }

  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        setAccountEmail(session.user.email ?? null);
        void loadCloudWorkspace(session.user.id);
      } else {
        setIsCloudLoading(false);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setAccountEmail(session.user.email ?? null);
        void loadCloudWorkspace(session.user.id);
      } else {
        setWorkspaceId(null);
        setAccountEmail(null);
        setIsCloudLoading(false);
      }
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

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
    }
  }, [prospectLists, trashedProspectLists, activeProspectListId, cadenceBlocks, financeEntries, workspaceId]);

  useEffect(() => {
    if (!workspaceId || !supabase || isCloudHydrating) return;
    const client = getSupabaseClient();
    const stageToFunnel = new Map(funnels.flatMap((funnel) => funnel.stages.map((stage) => [stage.id, funnel.id] as const)));
    const syncCloudState = async () => {
      if (goals.length) await client.from("goals").upsert(goals.map((goal, position) => ({ id: goal.id, workspace_id: workspaceId, title: goal.title, goal_type: goal.type, target: goal.target, actual: goal.actual, unit: goal.unit, period: goalPeriodValue(goal), color: goal.color, recurring: goal.recurring, monthly_overrides: goal.monthlyOverrides ?? {}, linked_funnel_id: goal.linkedFunnelId || null, linked_stage_id: goal.linkedStageId || null, position })));
      await client.from("conversion_settings").upsert({ workspace_id: workspaceId, rates: conversionRates, updated_at: new Date().toISOString() });
      const funnelIds = funnels.map((funnel) => funnel.id);
      const { data: remoteFunnels } = await client.from("funnels").select("id").eq("workspace_id", workspaceId);
      const staleFunnelIds = ((remoteFunnels ?? []) as Array<{ id: string }>).map((funnel) => funnel.id).filter((id) => !funnelIds.includes(id));
      if (staleFunnelIds.length) {
        await client.from("opportunities").delete().in("funnel_id", staleFunnelIds);
        await client.from("stages").delete().in("funnel_id", staleFunnelIds);
        await client.from("funnels").delete().in("id", staleFunnelIds);
      }
      if (funnels.length) await client.from("funnels").upsert(funnels.map((funnel, position) => ({ id: funnel.id, workspace_id: workspaceId, name: funnel.name, currency: funnel.currency, position })));
      const stageRows = funnels.flatMap((funnel) => funnel.stages.map((stage, position) => ({ id: stage.id, funnel_id: funnel.id, name: stage.name, color: stage.color, probability: stage.probability, position })));
      if (funnelIds.length) {
        const { data: remoteStages } = await client.from("stages").select("id, funnel_id").in("funnel_id", funnelIds);
        const stageIds = stageRows.map((stage) => stage.id);
        const staleStageIds = ((remoteStages ?? []) as Array<{ id: string; funnel_id: string }>).map((stage) => stage.id).filter((id) => !stageIds.includes(id));
        if (staleStageIds.length) await client.from("stages").delete().in("id", staleStageIds);
      }
      if (stageRows.length) await client.from("stages").upsert(stageRows);
      const opportunityRows = deals.flatMap((deal, position) => {
        const funnelId = stageToFunnel.get(deal.stageId);
        return funnelId ? [{ id: deal.id, funnel_id: funnelId, stage_id: deal.stageId, title: deal.title, company: deal.company, value: deal.value, owner_initials: deal.owner, tag: deal.tag, next_activity: deal.nextActivity, contact_name: deal.contactName ?? null, contact_role: deal.contactRole ?? null, contact_email: deal.contactEmail ?? null, contact_phone: deal.contactPhone ?? null, company_data: { ...(deal.companyData ?? {}), __ritmoStageHistory: deal.stageHistory ?? [deal.stageId], __ritmoStageEvents: stageEventsForDeal(deal) }, activities: deal.activities ?? [], notes: deal.notes ?? [], position }] : [];
      });
      if (funnelIds.length) {
        const { data: remoteOpportunities } = await client.from("opportunities").select("id, funnel_id").in("funnel_id", funnelIds);
        const opportunityIds = opportunityRows.map((deal) => deal.id);
        const staleOpportunityIds = ((remoteOpportunities ?? []) as Array<{ id: string; funnel_id: string }>).map((deal) => deal.id).filter((id) => !opportunityIds.includes(id));
        if (staleOpportunityIds.length) await client.from("opportunities").delete().in("id", staleOpportunityIds);
      }
      if (opportunityRows.length) await client.from("opportunities").upsert(opportunityRows);

      const desiredProspectLists = [...prospectLists, ...trashedProspectLists];
      const desiredListIds = desiredProspectLists.map((list) => list.id);
      const { data: existingProspectLists } = await client.from("prospect_lists").select("id").eq("workspace_id", workspaceId);
      const staleListIds = ((existingProspectLists ?? []) as Array<{ id: string }>).map((list) => list.id).filter((id) => !desiredListIds.includes(id));
      if (staleListIds.length) await client.from("prospect_lists").delete().in("id", staleListIds);
      if (desiredProspectLists.length) {
        await client.from("prospect_lists").upsert(desiredProspectLists.map((list) => ({ id: list.id, workspace_id: workspaceId, name: list.name, deleted_at: "deletedAt" in list ? list.deletedAt : null, updated_at: new Date().toISOString() })));
      }
      const prospectRecordRows = desiredProspectLists.flatMap((list) => list.records.map((record, position) => ({ id: record.id, list_id: list.id, decision_maker_first_name: record.decisionMakerFirstName, decision_maker_last_name: record.decisionMakerLastName, decision_maker_role: record.decisionMakerRole, decision_maker_email: record.decisionMakerEmail, decision_maker_phone: record.decisionMakerPhone, decision_maker_secondary_phone: record.decisionMakerSecondaryPhone, monthly_visits: record.monthlyVisits, company: record.company, company_website: record.companyWebsite, analysis: record.analysis, position, updated_at: new Date().toISOString() })));
      for (const list of desiredProspectLists) {
        const { data: existingRecords } = await client.from("prospect_records").select("id").eq("list_id", list.id);
        const desiredRecordIds = list.records.map((record) => record.id);
        const staleRecordIds = ((existingRecords ?? []) as Array<{ id: string }>).map((record) => record.id).filter((id) => !desiredRecordIds.includes(id));
        if (staleRecordIds.length) await client.from("prospect_records").delete().in("id", staleRecordIds);
      }
      if (prospectRecordRows.length) await client.from("prospect_records").upsert(prospectRecordRows);

      const { data: existingCadenceBlocks } = await client.from("cadence_blocks").select("id").eq("workspace_id", workspaceId);
      const cadenceIds = cadenceBlocks.map((block) => block.id);
      const staleCadenceIds = ((existingCadenceBlocks ?? []) as Array<{ id: string }>).map((block) => block.id).filter((id) => !cadenceIds.includes(id));
      if (staleCadenceIds.length) await client.from("cadence_blocks").delete().in("id", staleCadenceIds);
      if (cadenceBlocks.length) await client.from("cadence_blocks").upsert(cadenceBlocks.map((block, position) => ({ id: block.id, workspace_id: workspaceId, day: block.day, slot: block.slot, title: block.title, channel: block.channel, notes: block.notes, position, updated_at: new Date().toISOString() })));
      const { data: existingFinanceEntries } = await client.from("finance_entries").select("id").eq("workspace_id", workspaceId);
      const financeIds = financeEntries.map((entry) => entry.id);
      const staleFinanceIds = ((existingFinanceEntries ?? []) as Array<{ id: string }>).map((entry) => entry.id).filter((id) => !financeIds.includes(id));
      if (staleFinanceIds.length) await client.from("finance_entries").delete().in("id", staleFinanceIds);
      if (financeEntries.length) await client.from("finance_entries").upsert(financeEntries.map((entry, position) => ({ id: entry.id, workspace_id: workspaceId, expense: entry.expense, amount: entry.amount, installment: entry.installment, due_date: entry.dueDate || null, notes: entry.notes, position, updated_at: new Date().toISOString() })));
    };
    void syncCloudState();
  }, [goals, funnels, deals, conversionRates, cadenceBlocks, financeEntries, workspaceId, isCloudHydrating]);

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
    else url.searchParams.set("aba", nextPage === "pipeline" ? "funil" : nextPage === "activities" ? "atividades" : nextPage === "people" ? "pessoas" : nextPage === "cadence" ? "cadencia" : nextPage === "finance" ? "financeiro" : "prospeccao");
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

  async function saveProspectsToCloud() {
    if (!workspaceId || !supabase) {
      toast.error("Conecte sua conta para salvar Empresas no Supabase.");
      return;
    }
    setIsProspectSaving(true);
    try {
      const client = getSupabaseClient();
      const desiredLists = [...prospectLists, ...trashedProspectLists];
      const { data: existingLists, error: listsError } = await client.from("prospect_lists").select("id").eq("workspace_id", workspaceId);
      if (listsError) throw listsError;
      const desiredListIds = desiredLists.map((list) => list.id);
      const staleListIds = ((existingLists ?? []) as Array<{ id: string }>).map((list) => list.id).filter((id) => !desiredListIds.includes(id));
      if (staleListIds.length) {
        const { error } = await client.from("prospect_lists").delete().in("id", staleListIds);
        if (error) throw error;
      }
      if (desiredLists.length) {
        const { error } = await client.from("prospect_lists").upsert(desiredLists.map((list) => ({ id: list.id, workspace_id: workspaceId, name: list.name, deleted_at: "deletedAt" in list ? list.deletedAt : null, updated_at: new Date().toISOString() })));
        if (error) throw error;
      }
      for (const list of desiredLists) {
        const { data: existingRecords, error: recordsError } = await client.from("prospect_records").select("id").eq("list_id", list.id);
        if (recordsError) throw recordsError;
        const desiredRecordIds = list.records.map((record) => record.id);
        const staleRecordIds = ((existingRecords ?? []) as Array<{ id: string }>).map((record) => record.id).filter((id) => !desiredRecordIds.includes(id));
        if (staleRecordIds.length) {
          const { error } = await client.from("prospect_records").delete().in("id", staleRecordIds);
          if (error) throw error;
        }
        if (list.records.length) {
          const { error } = await client.from("prospect_records").upsert(list.records.map((record, position) => ({ id: record.id, list_id: list.id, decision_maker_first_name: record.decisionMakerFirstName, decision_maker_last_name: record.decisionMakerLastName, decision_maker_role: record.decisionMakerRole, decision_maker_email: record.decisionMakerEmail, decision_maker_phone: record.decisionMakerPhone, decision_maker_secondary_phone: record.decisionMakerSecondaryPhone, monthly_visits: record.monthlyVisits, company: record.company, company_website: record.companyWebsite, analysis: record.analysis, position, updated_at: new Date().toISOString() })));
          if (error) throw error;
        }
      }
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
    const override = goal.recurring ? goal.monthlyOverrides?.[selectedGoalMonth] : undefined;
    setGoalOverrideMonth(override ? selectedGoalMonth : null);
    setGoalDraft(override ? { ...goal, target: override.target, actual: override.actual } : goal);
    setGoalDialogOpen(true);
  }

  function reorderGoals(fromId: string, toId: string) {
    if (fromId === toId) return;
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
    setGoals((current) => {
      const index = current.findIndex((goal) => goal.id === goalId);
      const nextIndex = direction === "up" ? index - 1 : index + 1;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next.map((goal, position) => ({ ...goal, position }));
    });
  }

  function saveGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!goalDraft.title.trim() || goalDraft.target <= 0) {
      toast.error("Dê um nome e um objetivo válido para a meta.");
      return;
    }
    if (goalDraft.id) {
      setGoals((current) => current.map((goal) => {
        if (goal.id !== goalDraft.id) return goal;
        if (goalOverrideMonth && goal.recurring) {
          return { ...goal, monthlyOverrides: { ...(goal.monthlyOverrides ?? {}), [goalOverrideMonth]: { target: goalDraft.target, actual: goalDraft.actual } } };
        }
        return { ...goalDraft, monthlyOverrides: goal.monthlyOverrides ?? goalDraft.monthlyOverrides ?? {} };
      }));
      toast.success(goalOverrideMonth ? `Exceção salva para ${goalOverrideMonth}.` : "Meta atualizada.");
    } else {
      setGoals((current) => [{ ...goalDraft, id: uniqueId("goal"), position: 0 }, ...current.map((goal, index) => ({ ...goal, position: index + 1 }))]);
      toast.success("Meta criada e adicionada ao seu ritmo.");
    }
        setGoalOverrideMonth(null);
    setGoalDialogOpen(false);
  }
  async function deleteGoal(goalId: string) {
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
            <SidebarItem icon={<Target size={19} />} label="Metas" active={page === "goals"} onClick={() => selectPage("goals")} />
            <SidebarItem icon={<GitBranch size={19} />} label="Funil de vendas" active={page === "pipeline"} onClick={() => selectPage("pipeline")} />
            <SidebarItem icon={<Users size={19} />} label="Pessoas" active={page === "people"} onClick={() => selectPage("people")} />
            <SidebarItem icon={<Calendar size={19} />} label="Atividades" active={page === "activities"} onClick={() => selectPage("activities")} />
            <SidebarItem icon={<ClipboardList size={19} />} label="Empresas" active={page === "prospecting"} onClick={() => selectPage("prospecting")} />
            <SidebarItem icon={<GitBranch size={19} />} label="Cadência" active={page === "cadence"} onClick={() => selectPage("cadence")} />
            <SidebarItem icon={<CircleDollarSign size={19} />} label="Financeiro" active={page === "finance"} onClick={() => selectPage("finance")} />
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-7 p-0">
          <SidebarGroupLabel className="px-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#9AA59F] group-data-[collapsible=icon]:hidden">Visões</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarItem icon={<Activity size={18} />} label="Ritmo do mês" onClick={() => setPage("goals")} />
              <SidebarItem icon={<Settings size={18} />} label="Configurações" onClick={() => setAuthDialogOpen(true)} />
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
            <SidebarMenuButton tooltip={accountEmail ? "Conta conectada" : isSupabaseConfigured ? "Conectar à nuvem" : "Modo local"} onClick={() => accountEmail ? void signOutOfCloud() : setAuthDialogOpen(true)} className="h-auto rounded-xl px-2 py-2 text-left hover:bg-[#F0F3EF]">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#18201E] text-[9px] font-bold text-white">{accountEmail ? accountEmail.slice(0, 2).toUpperCase() : "AR"}</span>
              <span className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden"><span className="block truncate text-sm font-bold text-[#27302D]">{accountEmail ? "Conta conectada" : isSupabaseConfigured ? "Conectar à nuvem" : "Modo local"}</span><span className="block truncate text-xs text-[#87928D]">{accountEmail ?? (isCloudLoading ? "Carregando conexão..." : isSupabaseConfigured ? "Entrar com e-mail" : "Dados neste navegador")}</span></span>
              <ChevronDown className="h-4 w-4 text-[#87928D] group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );

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
        <button onClick={page === "goals" ? openNewGoal : page === "prospecting" || page === "people" ? addProspect : page === "cadence" ? () => addCadenceBlock(1, "morning") : page === "finance" ? addFinanceEntry : openNewDeal} className="grid h-10 w-10 place-items-center rounded-xl bg-[#10A97A] text-white" aria-label="Criar">
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
            funnels={funnels}
            conversionRates={conversionRates}
            onSaveConversionRates={(rates) => { setConversionRates(rates); toast.success("Taxas de conversão salvas."); }}
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
          <ActivitiesWorkspace deals={openDeals} onToggleActivity={toggleWorkspaceActivity} onOpenDeal={openDealDetail} onNewDeal={openNewDeal} />
        ) : page === "people" ? (
          <PeopleWorkspace lists={prospectLists.filter((list) => !list.deletedAt)} />
        ) : page === "cadence" ? (
          <CadenceWorkspace blocks={cadenceBlocks} onAdd={addCadenceBlock} onMove={moveCadenceBlock} onEdit={editCadenceBlock} onDelete={deleteCadenceBlock} />
        ) : page === "finance" ? (
          <FinanceWorkspace entries={financeEntries} onAdd={addFinanceEntry} onUpdate={updateFinanceEntry} onDelete={deleteFinanceEntry} />
        ) : (
          <ProspectingWorkspace lists={prospectLists} trashedLists={trashedProspectLists} funnels={funnels} activeListId={activeProspectList?.id ?? ""} activeListName={activeProspectList?.name ?? "Lista principal"} prospects={prospects} onSelectList={selectProspectList} onCreateList={createProspectList} onRenameList={renameProspectList} onDeleteList={deleteProspectList} onRestoreList={restoreProspectList} onPermanentDeleteList={permanentlyDeleteProspectList} onAdd={addProspect} onUpdate={updateProspect} onDelete={deleteProspect} onImportList={importProspectList} onSave={saveProspectsToCloud} isSaving={isProspectSaving} />
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
            <div className="grid gap-4 sm:grid-cols-2"><FormField label="Periodicidade"><select className="form-select" value={goalDraft.cadence} onChange={(event) => { const cadence = event.target.value as GoalCadence; setGoalDraft({ ...goalDraft, cadence, period: goalPeriodInputValue({ ...goalDraft, cadence }) }); }}><option>Diária</option><option>Semanal</option><option>Mensal</option></select></FormField><FormField label={goalDraft.cadence === "Mensal" ? "Mês da meta" : goalDraft.cadence === "Semanal" ? "Semana da meta" : "Dia da meta"}><Input type={goalPeriodInputType(goalDraft.cadence)} value={goalPeriodInputValue(goalDraft)} onChange={(event) => setGoalDraft({ ...goalDraft, period: event.target.value })} aria-label="Selecionar período da meta" className="bg-white" /></FormField></div>
            <label className="flex items-center gap-3 rounded-xl border border-[#DDE8E1] bg-[#F5FAF7] px-3 py-3 text-sm font-semibold text-[#35403B]"><input type="checkbox" checked={goalDraft.recurring} onChange={(event) => { const recurring = event.target.checked; setGoalDraft({ ...goalDraft, recurring }); if (!recurring) setGoalOverrideMonth(null); }} className="h-4 w-4 accent-[#10A97A]" />Meta recorrente<span className="ml-auto text-xs font-medium text-[#7D8983]">Repete sem duplicar</span></label>
            {goalDraft.id && goalDraft.recurring && <label className="flex items-center gap-3 rounded-xl border border-[#DDE8E1] bg-[#FFF9E8] px-3 py-3 text-sm font-semibold text-[#35403B]"><input type="checkbox" checked={goalOverrideMonth === selectedGoalMonth} onChange={(event) => { if (event.target.checked) { const effective = goalValuesForMonth(goalDraft, selectedGoalMonth); setGoalDraft({ ...goalDraft, target: effective.target, actual: effective.actual }); setGoalOverrideMonth(selectedGoalMonth); } else { const baseGoal = goals.find((goal) => goal.id === goalDraft.id); if (baseGoal) setGoalDraft(baseGoal); setGoalOverrideMonth(null); } }} className="h-4 w-4 accent-[#C88920]" />Personalizar apenas {selectedGoalMonth}<span className="ml-auto text-xs font-medium text-[#8A6D2A]">Não altera a recorrência</span></label>}
            <FormField label="Atualização automática pelo funil"><select className="form-select" value={goalDraft.linkedStageId ?? ""} onChange={(event) => { const stageId = event.target.value; const funnel = funnels.find((item) => item.stages.some((stage) => stage.id === stageId)); setGoalDraft({ ...goalDraft, linkedStageId: stageId, linkedFunnelId: funnel?.id ?? "" }); }}><option value="">Sem vínculo automático</option>{funnels.flatMap((funnel) => funnel.stages.map((stage) => <option key={`${funnel.id}-${stage.id}`} value={stage.id}>{funnel.name} · {stage.name}</option>))}</select><p className="mt-1 text-xs text-[#7D8983]">Cada oportunidade conta uma vez quando entra na etapa escolhida.</p></FormField>
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

      <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
        <DialogContent className="max-w-[460px] border-[#E2E7E0] bg-[#FCFCFA] p-0">
          <div className="border-b border-[#E8ECE6] px-6 py-5"><DialogHeader><DialogTitle className="font-display text-2xl tracking-[-0.04em]">Conectar ao Ritmo</DialogTitle><DialogDescription>Use seu e-mail para abrir um espaço comercial protegido e sincronizado no Supabase.</DialogDescription></DialogHeader></div>
          <form onSubmit={sendMagicLink} className="space-y-5 px-6 py-6"><FormField label="Seu e-mail"><Input type="email" autoFocus value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="voce@empresa.com" /></FormField><div className="flex justify-end gap-2 border-t border-[#E8ECE6] pt-5"><Button type="button" variant="outline" onClick={() => setAuthDialogOpen(false)}>Cancelar</Button><Button disabled={isAuthSending} type="submit" className="bg-[#10A97A] hover:bg-[#087E5A]">{isAuthSending ? "Enviando..." : "Enviar link de acesso"}</Button></div></form>
        </DialogContent>
      </Dialog>
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

function GoalsWorkspace({ goals, averageGoalProgress, selectedMonth, onSelectedMonthChange, onNewGoal, onOpenPipeline, onEditGoal, onDeleteGoal, onReorderGoals, funnels, conversionRates, onSaveConversionRates }: { goals: GoalItem[]; averageGoalProgress: number; selectedMonth: string; onSelectedMonthChange: (month: string) => void; onNewGoal: () => void; onOpenPipeline: () => void; onEditGoal: (goal: GoalItem) => void; onDeleteGoal: (id: string) => void; onReorderGoals: (fromId: string, toId: string) => void; funnels: SalesFunnel[]; conversionRates: ConversionRates; onSaveConversionRates: (rates: ConversionRates) => void }) {
  const daysRemaining = daysUntilMonthEnd();
  const currentMonth = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date(`${selectedMonth}-01T12:00:00`));
  const calendarDays = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const leadingBlanks = (firstDay.getDay() + 6) % 7;
    return Array.from({ length: leadingBlanks + daysInMonth }, (_, index) => index < leadingBlanks ? null : index - leadingBlanks + 1);
  }, [selectedMonth]);
  return (
    <div className="pt-[68px] md:pt-0">
      <header className="flex min-h-[116px] items-center justify-between px-5 py-6 md:px-10">
        <div><p className="eyebrow">Plano mensal <span className="mx-1 text-[#10A97A]">•</span> ciclo em andamento</p><h1 className="page-title">Metas <span className="text-[#10A97A]">em movimento</span></h1></div>
        <div className="hidden items-center gap-3 sm:flex"><label className="flex items-center gap-2 rounded-xl border border-[#DDE8E0] bg-white px-3 text-xs font-bold uppercase tracking-[0.08em] text-[#6E7C74]">Mês <Input type="month" value={selectedMonth} onChange={(event) => onSelectedMonthChange(event.target.value)} className="h-9 w-[132px] border-0 bg-transparent p-0 text-sm font-bold normal-case tracking-normal text-[#1B2522] shadow-none focus-visible:ring-0" aria-label="Filtrar mês das metas" /></label><button className="tool-button" onClick={onOpenPipeline}><Search size={18} /><span>Ver funil</span></button><Button onClick={onNewGoal} className="h-11 gap-2 rounded-xl bg-[#10A97A] px-5 font-bold hover:bg-[#087E5A]"><Plus size={18} />Nova meta</Button></div>
      </header>

      <div className="px-5 pb-12 md:px-10">
        <section className="instrument-strip" aria-label="Instrumentos de acompanhamento comercial">
          {goals.map((goal, index) => {
            const displayGoal = goalValuesForMonth(goal, selectedMonth);
            const progress = progressOf(displayGoal);
            const remaining = Math.max(displayGoal.target - displayGoal.actual, 0);
            return <div key={goal.id} draggable onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", goal.id); }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const fromId = event.dataTransfer.getData("text/plain"); if (fromId) onReorderGoals(fromId, goal.id); }} className="instrument-cell group cursor-grab active:cursor-grabbing"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 flex-wrap items-center gap-2"><span className="pulse-dot" /><span className="rounded-full bg-[#F0F4F0] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#63736B]">{goal.cadence}</span>{goal.recurring && <span className="rounded-full bg-[#E7F5EF] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#087E5E]">Recorrente</span>}<span className="text-xs text-[#88938E]">{goal.recurring ? periodValueForDate(goal.cadence) : cleanGoalPeriod(goal.period)}</span></div><div className="flex items-center gap-1"><span className="text-xs font-extrabold text-[#087E5A]">{progress}%</span><button type="button" onClick={() => onEditGoal(goal)} className="icon-button h-7 w-7 opacity-70 transition hover:opacity-100" aria-label={`Editar ${goal.title}`}><Pencil size={13} /></button><button type="button" onClick={() => onDeleteGoal(goal.id)} className="icon-button h-7 w-7 text-[#B04D45] opacity-70 transition hover:opacity-100" aria-label={`Excluir ${goal.title}`}><Trash2 size={13} /></button></div></div><div className="mt-3 flex items-center gap-3"><div className="goal-meter shrink-0" style={{ "--progress": `${progress * 3.6}deg` } as React.CSSProperties}><span>{progress}%</span></div><div className="min-w-0 flex-1"><p className="truncate text-base font-bold tracking-[-0.02em] text-[#27302D]">{goal.title}</p><p className="mt-0.5 font-display text-[24px] font-extrabold tracking-[-0.06em] text-[#1B2522]">{formatGoalValue(displayGoal.actual, displayGoal.unit)}<span className="ml-1 text-sm font-bold text-[#85918B]">/ {formatGoalValue(displayGoal.target, displayGoal.unit)}</span></p></div></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#E8ECE7]"><div className="h-full rounded-full bg-[#10A97A] transition-[width]" style={{ width: `${progress}%` }} /></div><div className="mt-2 flex items-center justify-between gap-2"><p className="text-[11px] font-medium text-[#85918B]">Faltam {formatGoalValue(remaining, displayGoal.unit)}</p><span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#A0ACA5]" title="Arraste para reorganizar"><GripVertical size={14} />Mover</span></div>{index < goals.length - 1 && <span className="instrument-divider" />}</div>;
          })}
          {goals.length === 0 && <button onClick={onNewGoal} className="flex items-center gap-2 text-sm font-bold text-[#087E5A]"><CirclePlus size={18} />Criar primeiro instrumento</button>}
          <div className="instrument-cell relative isolate overflow-hidden border-[#E5BE6B] bg-[#FFF4D9] shadow-[0_10px_24px_rgba(196,141,35,0.12)]"><div className="pointer-events-none absolute inset-0 -z-10 p-5 opacity-45"><div className="grid grid-cols-7 gap-x-3 gap-y-2 text-center text-[12px] font-bold text-[#C99D4B]">{["S", "T", "Q", "Q", "S", "S", "D"].map((day, index) => <span key={`weekday-${index}`} className="text-[9px] uppercase tracking-[0.12em] text-[#B78B38]">{day}</span>)}{calendarDays.map((day, index) => <span key={`day-${index}`} className={`rounded-md py-1 ${day === new Date().getDate() && selectedMonth === new Date().toISOString().slice(0, 7) ? "bg-[#E5BE6B] text-[#6B4D12]" : ""}`}>{day ?? ""}</span>)}</div></div><div className="relative"><div className="flex items-center gap-2"><span className="pulse-dot bg-[#C88920]" /><span className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#8A651D]">Fechamento do mês</span></div><p className="mt-4 font-display text-[38px] font-extrabold tracking-[-0.07em] text-[#6B4D12]">{daysRemaining} {daysRemaining === 1 ? "dia útil" : "dias úteis"}</p><p className="mt-2 text-[14px] font-semibold capitalize text-[#8A6D2A]">restantes em {currentMonth}</p></div></div>
        </section>
        <GoalSimulator funnels={funnels} conversionRates={conversionRates} onSaveConversionRates={onSaveConversionRates} />
      </div>
    </div>
  );
}

function GoalSimulator({ funnels, conversionRates, onSaveConversionRates }: { funnels: SalesFunnel[]; conversionRates: ConversionRates; onSaveConversionRates: (rates: ConversionRates) => void }) {
  const [selectedFunnelId, setSelectedFunnelId] = useState(funnels[0]?.id ?? "");
  const [leadInput, setLeadInput] = useState(120);
  const [draftRates, setDraftRates] = useState<ConversionRates>(() => ({ ...defaultConversionRates(funnels), ...conversionRates }));
  const activeFunnel = funnels.find((funnel) => funnel.id === selectedFunnelId) ?? funnels[0];

  useEffect(() => {
    setDraftRates({ ...defaultConversionRates(funnels), ...conversionRates });
    if (!funnels.some((funnel) => funnel.id === selectedFunnelId)) setSelectedFunnelId(funnels[0]?.id ?? "");
  }, [funnels, conversionRates, selectedFunnelId]);

  if (!activeFunnel) return null;

  const leads = Math.max(0, Number(leadInput) || 0);
  const simulatorStages = activeFunnel.stages.filter((stage) => !isLostStage(stage)).sort((left, right) => Number(isWonStage(left)) - Number(isWonStage(right)));
  let enteringStage = leads;
  const projections = simulatorStages.map((stage, index) => {
    const rate = index === 0 ? 100 : Math.min(100, Math.max(0, Number(draftRates[stage.id] ?? stage.probability) || 0));
    const projected = index === 0 ? enteringStage : enteringStage * (rate / 100);
    enteringStage = projected;
    return { stage, rate, projected };
  });
  const finalProjection = projections.find(({ stage }) => isWonStage(stage))?.projected ?? projections.at(-1)?.projected ?? 0;
  const numberFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
  const updateRate = (stageId: string, value: string) => setDraftRates((current) => ({ ...current, [stageId]: Math.min(100, Math.max(0, Number(value) || 0)) }));
  const resetRates = () => setDraftRates(defaultConversionRates([activeFunnel]));

  return <section className="surface-panel mt-5 overflow-hidden p-4 sm:p-6">
    <div className="flex flex-col gap-4 border-b border-[#E8ECE6] pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-xl bg-[#E8F6F0] text-[#087E5A]"><SlidersHorizontal size={16} /></span><p className="eyebrow">Planejamento de volume</p></div><h2 className="mt-2 section-title">Simulador de metas</h2></div>
      <div className="flex flex-wrap items-end gap-3"><label className="block"><span className="mb-1 block text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#74827B]">Funil de referência</span><select className="form-select min-w-[190px]" value={activeFunnel.id} onChange={(event) => setSelectedFunnelId(event.target.value)}>{funnels.map((funnel) => <option key={funnel.id} value={funnel.id}>{funnel.name}</option>)}</select></label><label className="block"><span className="mb-1 block text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#74827B]">Leads de entrada</span><Input min="0" type="number" value={leadInput} onChange={(event) => setLeadInput(Number(event.target.value))} className="h-10 w-[132px] bg-white font-bold" /></label></div>
    </div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
      <div><div className="space-y-2">{projections.map(({ stage, rate }, index) => <div key={stage.id} className="grid grid-cols-[minmax(0,1fr)_92px] items-center gap-3 rounded-xl border border-[#E7EBE6] bg-[#FCFCFA] px-3 py-2.5"><div className="flex min-w-0 items-center gap-2.5"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: stage.color }} /><div className="min-w-0"><p className="truncate text-sm font-bold text-[#35403B]">{stage.name}</p><p className="text-[11px] text-[#8A9690]">{index === 0 ? "Base do simulador" : `${rate}% da etapa anterior`}</p></div></div><label className="relative"><span className="sr-only">Taxa para {stage.name}</span><Input min="0" max="100" step="0.1" type="number" value={rate} disabled={index === 0} onChange={(event) => updateRate(stage.id, event.target.value)} className="h-9 bg-white pr-7 text-right font-extrabold disabled:bg-[#F0F4F0] disabled:text-[#087E5A]" /><span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-[#7C8A83]">%</span></label></div>)}</div><div className="mt-4 flex justify-end"><Button type="button" onClick={() => onSaveConversionRates(draftRates)} className="h-9 gap-2 rounded-xl bg-[#18201E] px-4 text-xs font-extrabold text-white hover:bg-[#087E5A]"><CheckCircle2 size={15} />Salvar taxas</Button></div></div>
      <div className="rounded-2xl border border-[#D5E3DA] bg-[#F0F8F3] p-4 sm:p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#5D7569]">Leitura projetada</p><p className="mt-1 text-sm font-bold text-[#27302D]">{activeFunnel.name}</p></div><span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#087E5A]">{numberFormat.format(leads)} leads</span></div><div className="mt-4 space-y-2">{projections.map(({ stage, projected }, index) => <div key={stage.id} className="flex items-center gap-3"><div className="flex w-5 justify-center"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: stage.color }} /></div><p className="min-w-0 flex-1 truncate text-sm font-semibold text-[#53665D]">{stage.name}</p><strong className="font-display text-lg tracking-[-0.04em] text-[#1B2522]">{numberFormat.format(projected)}</strong>{index < projections.length - 1 && <span className="sr-only">evolui para a próxima etapa</span>}</div>)}</div><div className="mt-5 border-t border-[#CFE0D5] pt-4"><p className="text-xs font-bold text-[#668074]">Fechamentos projetados em Ganho</p><p className="mt-1 font-display text-4xl font-extrabold tracking-[-0.07em] text-[#087E5A]">{numberFormat.format(finalProjection)}</p><p className="mt-1 text-xs leading-5 text-[#71887D]">Ajuste as taxas conforme os dados do seu histórico para tomar decisões de volume com mais precisão.</p></div></div>
    </div>
  </section>;
}

function GoalRow({ goal, funnels, onReorder }: { goal: GoalItem; funnels: SalesFunnel[]; onReorder: (fromId: string, toId: string) => void }) {
  return <div draggable onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", goal.id); }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const fromId = event.dataTransfer.getData("text/plain"); if (fromId) onReorder(fromId, goal.id); }} className="group relative flex min-h-[190px] flex-col justify-between gap-5 rounded-3xl border border-[#E2E9E2] bg-[#FCFCFA] p-5 shadow-[0_10px_24px_rgba(30,55,44,0.04)] transition hover:-translate-y-0.5 hover:border-[#BFD6C8] hover:shadow-[0_16px_32px_rgba(30,55,44,0.08)]">
    <div><div className="mb-1 flex flex-wrap items-center gap-2"><span className="tag-chip">{goal.type}</span><span className="rounded-full bg-[#F0F4F0] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#63736B]">{goal.cadence}</span>{goal.recurring && <span className="rounded-full bg-[#E7F5EF] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#087E5E]">Recorrente</span>}<span className="text-xs text-[#88938E]">{goal.recurring ? periodValueForDate(goal.cadence) : cleanGoalPeriod(goal.period)}</span></div><h3 className="font-display text-base font-bold tracking-[-0.025em] text-[#27302D]">{goal.title}</h3></div>
    <div className="flex items-center justify-between gap-3"><div><span className="text-sm font-bold text-[#35403B]">{formatGoalValue(goal.actual, goal.unit)}</span><span className="ml-2 text-xs font-medium text-[#7D8983]">de {formatGoalValue(goal.target, goal.unit)}</span></div><span className="inline-flex items-center gap-1.5 cursor-grab text-xs font-bold uppercase tracking-[0.1em] text-[#A0ACA5]" title="Arraste para reorganizar"><GripVertical size={15} />Mover</span></div>
  </div>;
}

function PeopleWorkspace({ lists }: { lists: ProspectList[] }) {
  const people = lists.flatMap((list) => list.records.map((record) => ({ ...record, listName: list.name })));
  return <div className="pt-[68px] md:pt-0"><header className="flex min-h-[116px] items-center justify-between px-5 py-6 md:px-10"><div><p className="eyebrow">Relacionamentos comerciais</p><h1 className="page-title">Pessoas <span className="text-[#10A97A]">em contato</span></h1></div><span className="rounded-full bg-[#E8F6F0] px-3 py-1.5 text-xs font-extrabold text-[#087E5E]">{people.length} {people.length === 1 ? "pessoa" : "pessoas"}</span></header><div className="px-5 pb-12 md:px-10"><section className="surface-panel overflow-hidden p-4 sm:p-6"><div className="mb-5"><p className="eyebrow">Base de pessoas</p><h2 className="section-title">Decisores das suas empresas</h2><p className="mt-1 text-sm text-[#718078]">Uma visão dedicada aos contatos, separada da aba Empresas.</p></div>{people.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{people.map((person) => <article key={person.id} className="rounded-2xl border border-[#E2E9E2] bg-[#FCFCFA] p-4 transition hover:-translate-y-0.5 hover:border-[#BFD6C8] hover:shadow-[0_10px_24px_rgba(30,55,44,0.06)]"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-display text-lg font-extrabold tracking-[-0.03em] text-[#27302D]">{`${person.decisionMakerFirstName} ${person.decisionMakerLastName}`.trim() || "Pessoa sem nome"}</h3><p className="mt-1 truncate text-xs font-bold text-[#087E5A]">{person.decisionMakerRole || "Cargo não informado"}</p></div><span className="h-2 w-2 shrink-0 rounded-full bg-[#10A97A]" /></div><div className="mt-4 space-y-2 text-sm text-[#5E7067]"><p className="truncate"><strong className="text-[#27302D]">Empresa:</strong> {person.company || "Não informada"}</p><p className="truncate"><strong className="text-[#27302D]">E-mail:</strong> {person.decisionMakerEmail || "Não informado"}</p><p><strong className="text-[#27302D]">Telefone:</strong> {person.decisionMakerPhone || "Não informado"}</p></div><p className="mt-4 border-t border-[#E8EDE8] pt-3 text-[11px] font-bold uppercase tracking-[0.1em] text-[#8A9690]">Lista · {person.listName}</p></article>)}</div> : <div className="grid min-h-56 place-items-center rounded-2xl border border-dashed border-[#D6DED8] bg-[#FAFBF9] p-6 text-center"><Users className="mb-2 h-6 w-6 text-[#10A97A]" /><p className="font-bold text-[#27302D]">Ainda não há pessoas cadastradas</p><p className="mt-1 text-sm text-[#718078]">Adicione contatos na aba Empresas para vê-los aqui.</p></div>}</section></div></div>;
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

function ProspectingWorkspace({ lists, trashedLists, funnels, activeListId, activeListName, prospects, onSelectList, onCreateList, onRenameList, onDeleteList, onRestoreList, onPermanentDeleteList, onAdd, onUpdate, onDelete, onImportList, onSave, isSaving }: { lists: ProspectList[]; trashedLists: TrashedProspectList[]; funnels: SalesFunnel[]; activeListId: string; activeListName: string; prospects: ProspectRecord[]; onSelectList: (id: string) => void; onCreateList: () => void; onRenameList: (name: string) => void; onDeleteList: () => void; onRestoreList: (id: string) => void; onPermanentDeleteList: (id: string) => void; onAdd: () => void; onUpdate: (id: string, field: keyof Omit<ProspectRecord, "id">, value: string) => void; onDelete: (id: string) => void; onImportList: (listId: string, funnelId: string, stageId: string) => void; onSave: () => void; isSaving: boolean }) {
  const [trashOpen, setTrashOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importFunnelId, setImportFunnelId] = useState(funnels[0]?.id ?? "");
  const importFunnel = funnels.find((funnel) => funnel.id === importFunnelId) ?? funnels[0];
  const [importStageId, setImportStageId] = useState(importFunnel?.stages[0]?.id ?? "");
  const [pendingProspectDeleteId, setPendingProspectDeleteId] = useState<string | null>(null);
  const columns: Array<{ key: keyof Omit<ProspectRecord, "id">; label: string; width: string; multiline?: boolean }> = [
    { key: "decisionMakerFirstName", label: "Nome do decisor", width: "min-w-[170px]" },
    { key: "decisionMakerLastName", label: "Sobrenome do decisor", width: "min-w-[190px]" },
    { key: "decisionMakerRole", label: "Cargo", width: "min-w-[170px]" },
    { key: "decisionMakerEmail", label: "E-mail do decisor", width: "min-w-[300px]" },
    { key: "decisionMakerPhone", label: "Telefone principal", width: "min-w-[190px]" },
    { key: "decisionMakerSecondaryPhone", label: "Telefone secundário", width: "min-w-[190px]" },
    { key: "monthlyVisits", label: "Visitas mensais", width: "min-w-[170px]" },
    { key: "company", label: "Empresa", width: "min-w-[190px]" },
    { key: "companyWebsite", label: "Site da empresa", width: "min-w-[230px]" },
    { key: "analysis", label: "Análise", width: "min-w-[340px]", multiline: true },
  ];
  const companyCount = prospects.filter((prospect) => prospect.company.trim()).length;

  return <div className="min-h-screen bg-[#F6F5F1] px-5 pb-8 pt-[92px] md:px-8 md:pt-8">
    <div className="mx-auto max-w-[1600px]">
      <header className="flex flex-wrap items-center gap-3 border-b border-[#E2E7E1] pb-3">
        <div className="mr-auto flex min-w-[220px] items-center gap-2"><div><p className="eyebrow">Prospecção comercial</p><div className="mt-0.5 flex items-center gap-2"><h1 className="page-title text-2xl">Empresas</h1><span className="h-2 w-2 rounded-full bg-[#10A97A] shadow-[0_0_0_4px_rgba(16,169,122,0.12)]" /></div></div></div>
        <div className="flex min-w-0 items-center gap-2 rounded-xl border border-[#DDE5DE] bg-[#FCFCFA] px-2 py-1.5"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#E8F6F0] text-[#087E5A]"><ClipboardList size={17} /></div><label htmlFor="prospect-list-select" className="sr-only">Lista ativa</label><select id="prospect-list-select" value={activeListId} onChange={(event) => onSelectList(event.target.value)} className="block max-w-[180px] truncate border-0 bg-transparent p-0 pr-7 text-sm font-extrabold text-[#27302D] outline-none"><option value="" disabled>Selecione uma lista</option>{lists.map((list) => <option key={list.id} value={list.id}>{list.name}</option>)}</select><input aria-label="Nome da lista ativa" value={activeListName} onChange={(event) => onRenameList(event.target.value)} className="h-8 w-[160px] rounded-lg border border-[#DDE5DE] bg-white px-2.5 text-sm font-semibold text-[#27302D] outline-none focus:border-[#10A97A]" /><Button variant="outline" onClick={onCreateList} className="h-8 gap-1 rounded-lg border-[#C8D9CF] px-2.5 text-xs font-extrabold text-[#087E5A] hover:bg-[#E8F6F0]"><Plus size={14} />Nova lista</Button><Button variant="outline" onClick={onDeleteList} className="h-8 gap-1 rounded-lg border-[#F0D5D1] px-2.5 text-xs font-extrabold text-[#B04D45] hover:bg-[#FCEDEB]"><Trash2 size={14} />Excluir</Button><Button variant="outline" onClick={() => setTrashOpen((open) => !open)} className="h-8 gap-1 rounded-lg border-[#DDE5DE] px-2.5 text-xs font-extrabold text-[#63706B] hover:bg-[#F3F5F1]"><Trash2 size={14} />Lixeira{trashedLists.length ? ` (${trashedLists.length})` : ""}</Button></div>
        <div className="flex flex-wrap gap-2"><Button onClick={onSave} disabled={isSaving} variant="outline" className="h-9 gap-1.5 rounded-xl border-[#10A97A] px-3 text-xs font-extrabold text-[#087E5E] hover:bg-[#E8F6F0]">{isSaving ? "Salvando…" : "Salvar"}</Button><Button onClick={() => setImportOpen(true)} variant="outline" className="h-9 gap-1.5 rounded-xl border-[#C8D9CF] px-3 text-xs font-extrabold text-[#087E5A] hover:bg-[#E8F6F0]"><ArrowRight size={15} />Adicionar ao funil</Button><Button onClick={onAdd} className="h-9 gap-1.5 rounded-xl bg-[#10A97A] px-3 font-bold hover:bg-[#087E5A]"><Plus size={17} />Nova linha</Button><Button variant="outline" onClick={() => exportProspects(activeListName, prospects, "csv")} className="h-9 gap-1 rounded-xl border-[#C8D9CF] px-2.5 text-xs font-extrabold text-[#087E5A] hover:bg-[#E8F6F0]"><Download size={14} />CSV</Button><Button variant="outline" onClick={() => exportProspects(activeListName, prospects, "xls")} className="h-9 gap-1 rounded-xl border-[#C8D9CF] px-2.5 text-xs font-extrabold text-[#087E5A] hover:bg-[#E8F6F0]"><Download size={14} />Excel</Button></div>
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
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1500px] border-collapse text-left">
            <thead><tr className="border-b border-[#DDE5DE] bg-[#F4F7F3]">{columns.map((column) => <th key={column.key} className={`${column.width} px-3 py-3 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#75837C]`}>{column.label}</th>)}<th className="w-14 px-3 py-3" aria-label="Ações" /></tr></thead>
            <tbody>{prospects.map((prospect, index) => <tr key={prospect.id} className="group border-b border-[#E8EDE8] align-top transition hover:bg-[#FBFDFB]">
              {columns.map((column) => <td key={column.key} className="px-2 py-2"><label className="sr-only">{column.label} — linha {index + 1}</label>{column.multiline ? <textarea value={prospect[column.key]} onChange={(event) => onUpdate(prospect.id, column.key, event.target.value)} onKeyDown={(event) => { if (event.ctrlKey && event.key === "Enter") { event.preventDefault(); const target = event.currentTarget; const start = target.selectionStart; const end = target.selectionEnd; const nextValue = `${target.value.slice(0, start)}\n\n${target.value.slice(end)}`; onUpdate(prospect.id, column.key, nextValue); requestAnimationFrame(() => target.setSelectionRange(start + 2, start + 2)); } }} placeholder="Escreva sua hipótese, contexto e próximo passo…" style={{ width: adaptiveFieldWidth(prospect[column.key], 34) }} className="min-h-[180px] max-w-[60ch] resize-y rounded-lg border border-transparent bg-transparent px-2 py-2 text-sm leading-5 text-[#27302D] outline-none transition placeholder:text-[#A2ADA6] hover:border-[#DCE7DF] focus:border-[#10A97A] focus:bg-white" /> : <input value={prospect[column.key]} onChange={(event) => onUpdate(prospect.id, column.key, event.target.value)} placeholder="Preencher" type={column.key === "decisionMakerEmail" ? "email" : "text"} style={{ width: adaptiveFieldWidth(prospect[column.key], column.key === "decisionMakerEmail" ? 30 : 18) }} className="h-10 max-w-[42ch] rounded-lg border border-transparent bg-transparent px-2 text-sm text-[#27302D] outline-none transition placeholder:text-[#A2ADA6] hover:border-[#DCE7DF] focus:border-[#10A97A] focus:bg-white" />}</td>)}
              <td className="px-2 py-2"><button type="button" onClick={() => setPendingProspectDeleteId(prospect.id)} className="mt-1 grid h-9 w-9 place-items-center rounded-lg text-[#A0AAA4] opacity-60 transition hover:bg-[#FCEDEB] hover:text-[#B94D45] group-hover:opacity-100" aria-label={`Excluir linha ${index + 1}`}><Trash2 size={16} /></button></td>
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
  const channelTone: Record<CadenceChannel, string> = { "E-mail": "bg-[#E8F0FF] text-[#355E9A]", WhatsApp: "bg-[#E8F6F0] text-[#087E5A]", Ligação: "bg-[#FFF2DD] text-[#99631A]", Tarefa: "bg-[#EEEAE3] text-[#4E5752]", LinkedIn: "bg-[#E1EEFF] text-[#155A9C]", Instagram: "bg-[#FBE7F0] text-[#A33D6C]" };
  const channelIcon: Record<CadenceChannel, typeof Mail> = { "E-mail": Mail, WhatsApp: MessageCircle, Ligação: PhoneCall, Tarefa: ClipboardCheck, LinkedIn: Linkedin, Instagram };
  const channelIconTone: Record<CadenceChannel, string> = { "E-mail": "bg-[#DCE9FF] text-[#355E9A]", WhatsApp: "bg-[#D5F2E4] text-[#087E5A]", Ligação: "bg-[#FFE8BD] text-[#99631A]", Tarefa: "bg-[#E4DED3] text-[#4E5752]", LinkedIn: "bg-[#D6E8FF] text-[#155A9C]", Instagram: "bg-[#F8D8E6] text-[#A33D6C]" };
  const slotLabel: Record<CadenceSlot, string> = { morning: "Manhã", afternoon: "Tarde" };
  const blockAt = (day: number, slot: CadenceSlot) => blocks.find((block) => block.day === day && block.slot === slot);
  const beginEdit = (block: CadenceBlock) => setDraft({ ...block });
  const openCreate = (day: number, slot: CadenceSlot) => { setCreateSlot({ day, slot }); setDraft({ id: "", day, slot, title: "", channel: "E-mail", notes: "" }); };
  const saveDraft = () => { if (draft?.title.trim()) { if (createSlot) { onAdd(createSlot.day, createSlot.slot, { title: draft.title, channel: draft.channel, notes: draft.notes }); } else { onEdit(draft); } setDraft(null); setCreateSlot(null); } };

  return <div className="min-h-screen bg-[#F6F5F1] px-4 pb-10 pt-[84px] md:px-8 md:pt-8">
    <div className="mx-auto max-w-[1500px]">
      <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div><p className="eyebrow">Operação comercial</p><h1 className="font-display text-3xl font-extrabold tracking-[-0.06em] text-[#1B2522]">Cadência de prospecção</h1><p className="mt-1 max-w-xl text-sm font-medium text-[#77827C]">Desenhe a sequência de contatos por dia e turno. Arraste os blocos para reorganizar o ritmo.</p></div>
        <div className="flex items-center gap-2"><span className="rounded-full bg-[#E8F6F0] px-3 py-1.5 text-xs font-bold text-[#087E5A]">{blocks.length} {blocks.length === 1 ? "ação" : "ações"} planejadas</span></div>
      </div>
      <div className="overflow-hidden rounded-[24px] border border-[#E0E5DF] bg-[#FBFBF9] shadow-[0_18px_50px_rgba(27,37,34,0.06)]">
        <div className="overflow-x-auto">
          <div className="min-w-[1120px]">
            <div className="grid grid-cols-[112px_repeat(10,minmax(100px,1fr))] border-b border-[#E3E6E0] bg-[#18201E] text-white">
              <div className="flex items-center px-4 py-4 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#B9D7CA]">Turno</div>
              {weekdays.map((weekday, index) => <div key={index} className="border-l border-white/10 px-3 py-3 text-center"><div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#B9D7CA]">Dia {String(index + 1).padStart(2, "0")}</div><div className="mt-1 text-xs font-bold capitalize">{weekday}</div></div>)}
            </div>
            {(["morning", "afternoon"] as CadenceSlot[]).map((slot) => <div key={slot} className="grid grid-cols-[112px_repeat(10,minmax(100px,1fr))] border-b border-[#E3E6E0] last:border-b-0"><div className="flex items-center bg-[#EFF4EF] px-4 text-xs font-extrabold uppercase tracking-[0.08em] text-[#315C4D]">{slotLabel[slot]}</div>{Array.from({ length: 10 }, (_, index) => { const day = index + 1; const block = blockAt(day, slot); return <div key={day} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { if (block) return; const id = event.dataTransfer?.getData("text/plain"); if (id) onMove(id, day, slot); }} className="min-h-[172px] border-l border-[#E3E6E0] bg-[#FCFCFA] p-2 transition-colors hover:bg-[#F3F8F4]">{block ? <div draggable onDragStart={(event) => { event.dataTransfer.setData("text/plain", block.id); }} onDoubleClick={() => beginEdit(block)} className="group relative flex h-full min-h-[150px] cursor-grab flex-col rounded-2xl border border-[#CFE6DA] bg-[#E8F6F0] p-3 shadow-[0_8px_18px_rgba(16,169,122,0.08)] active:cursor-grabbing"><div className="mb-2 flex items-start justify-between gap-2"><div className={`grid h-14 w-14 place-items-center rounded-2xl shadow-inner ${channelIconTone[block.channel]}`}>{(() => { const Icon = channelIcon[block.channel]; return <Icon size={30} strokeWidth={2.1} aria-label={block.channel} />; })()}</div><div className="flex items-center gap-1.5"><span className={`rounded-full px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.08em] ${channelTone[block.channel]}`}>{block.channel}</span><GripVertical size={15} className="text-[#86A99B]" /></div></div><p className="text-sm font-extrabold leading-tight text-[#1B2522]">{block.title}</p><p className="mt-2 line-clamp-3 text-[11px] font-medium leading-4 text-[#577066]">{block.notes || "Sem observações"}</p><div className="mt-auto flex items-center justify-between pt-3 text-[10px] font-bold text-[#087E5A]"><button onClick={(event) => { event.stopPropagation(); beginEdit(block); }} className="opacity-0 transition-opacity group-hover:opacity-100">Editar</button><button onClick={(event) => { event.stopPropagation(); onDelete(block.id); }} className="text-[#B04A43] opacity-0 transition-opacity group-hover:opacity-100">Excluir</button></div></div> : <button onClick={() => openCreate(day, slot)} className="flex h-full min-h-[150px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-[#D7DFD8] text-[#A0AAA4] transition hover:border-[#10A97A] hover:bg-[#F3F8F4] hover:text-[#087E5A]"><Plus size={18} /><span className="mt-2 text-[10px] font-bold">Adicionar ação</span></button>}</div>; })}</div>)}
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs font-medium text-[#87928D]">Dica: arraste um bloco para uma célula vazia. Dê duplo clique ou use “Editar” para alterar canal, título e observações.</p>
    </div>
    <Dialog open={Boolean(draft)} onOpenChange={(open) => { if (!open) { setDraft(null); setCreateSlot(null); } }}><DialogContent className="max-w-[480px] border-[#E2E7E0] bg-[#FCFCFA]"><DialogHeader><DialogTitle className="font-display text-2xl tracking-[-0.04em]">{createSlot ? "Nova ação da cadência" : "Editar ação da cadência"}</DialogTitle><DialogDescription>Defina a mensagem e o canal desse ponto da sequência.</DialogDescription></DialogHeader>{draft && <div className="space-y-4"><div><Label>Título</Label><Input className="mt-1" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></div><div><Label>Canal</Label><select className="form-select mt-1" value={draft.channel} onChange={(event) => setDraft({ ...draft, channel: event.target.value as CadenceChannel })}>{channels.map((channel) => <option key={channel}>{channel}</option>)}</select></div><div><Label>Observações</Label><textarea className="form-textarea mt-1 min-h-[110px]" value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} /></div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setDraft(null)}>Cancelar</Button><Button onClick={saveDraft} className="bg-[#10A97A] hover:bg-[#087E5A]">Salvar ação</Button></div></div>}</DialogContent></Dialog>
  </div>;
}

function PipelineWorkspace({ funnels, activeFunnel, activeFunnelId, deals, wonDeals, lostDeals, wonStage, lostStage, totalPipeline, weightedPipeline, draggedDealId, overStageId, onSelectFunnel, onNewFunnel, onEditFunnel, onNewDeal, onEditDeal, onDeleteDeal, onNewStage, onEditStage, onDragStart, onDrop, onWinDrop, onLoseDrop, onDragOver, onDragEnd }: { funnels: SalesFunnel[]; activeFunnel?: SalesFunnel; activeFunnelId: string; deals: Deal[]; wonDeals: Deal[]; lostDeals: Deal[]; wonStage?: Stage; lostStage?: Stage; totalPipeline: number; weightedPipeline: number; draggedDealId: string | null; overStageId: string | null; onSelectFunnel: (id: string) => void; onNewFunnel: () => void; onEditFunnel: () => void; onNewDeal: () => void; onEditDeal: (deal: Deal) => void; onDeleteDeal: (deal: Deal) => void; onNewStage: () => void; onEditStage: (stage: Stage) => void; onDragStart: (event: DragEvent<HTMLElement>, dealId: string) => void; onDrop: (stageId: string, event?: DragEvent<HTMLElement>) => void; onWinDrop: (event?: DragEvent<HTMLElement>) => void; onLoseDrop: (event?: DragEvent<HTMLElement>) => void; onDragOver: (event: DragEvent<HTMLElement>, stageId: string) => void; onDragEnd: () => void }) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [compactView, setCompactView] = useState(false);
  const visibleDeals = deals.filter((deal) => {
    const term = searchTerm.trim().toLowerCase();
    return !term || `${deal.title} ${deal.company} ${deal.tag}`.toLowerCase().includes(term);
  });
  if (!activeFunnel) return <div className="pipeline-shell grid min-h-screen place-items-center px-5 pt-[68px] md:pt-0"><div className="max-w-md text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#E8F6F0] text-[#087E5A]"><GitBranch size={26} /></div><p className="eyebrow mt-6">Operação comercial</p><h1 className="page-title">Seu primeiro funil começa aqui</h1><p className="mt-3 text-sm leading-6 text-[#718079]">Crie etapas próprias para conduzir oportunidades, acompanhar valores e mover a receita com clareza.</p><Button onClick={onNewFunnel} className="mt-6 h-11 gap-2 rounded-xl bg-[#10A97A] px-5 font-bold hover:bg-[#087E5A]"><CirclePlus size={18} />Criar funil</Button></div></div>;
  return <div className="pipeline-shell pt-[68px] md:pt-0"><header><div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between"><div className="flex min-w-0 flex-wrap items-center gap-2.5"><div className="flex items-center gap-2"><h1 className="page-title">Funil de vendas</h1><span className="hidden h-2 w-2 rounded-full bg-[#10A97A] sm:block" /></div><span className="hidden h-5 w-px bg-[#DDE4DE] sm:block" /><div className="relative"><select aria-label="Selecionar funil" className="funnel-selector appearance-none" value={activeFunnelId} onChange={(event) => onSelectFunnel(event.target.value)}>{funnels.map((funnel) => <option key={funnel.id} value={funnel.id}>{funnel.name}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#77847E]" /></div><button onClick={onEditFunnel} className="icon-button" aria-label="Editar funil"><Pencil size={16} /></button><button onClick={onNewFunnel} className="hidden items-center gap-1.5 text-sm font-bold text-[#087E5A] sm:flex"><CirclePlus size={17} />Novo funil</button></div><div className="flex flex-wrap items-center gap-2"><div className="flex gap-2"><MiniMetric label="Em aberto" value={formatCurrency(totalPipeline)} /><MiniMetric label="Previsão" value={formatCurrency(weightedPipeline)} accent /></div><button className={`icon-button hidden sm:grid ${filterOpen || searchTerm ? "bg-[#E8F6F0] text-[#087E5A]" : ""}`} onClick={() => setFilterOpen((open) => !open)} aria-label="Filtrar oportunidades" aria-expanded={filterOpen}><Filter size={17} /></button><button className={`tool-button hidden sm:flex ${compactView ? "bg-[#E8F6F0] text-[#087E5A]" : ""}`} onClick={() => setCompactView((compact) => !compact)} aria-pressed={compactView}><SlidersHorizontal size={17} /><span>{compactView ? "Confortável" : "Compacta"}</span></button><Button onClick={onNewDeal} className="h-10 gap-2 rounded-xl bg-[#10A97A] px-4 font-bold hover:bg-[#087E5A]"><Plus size={18} />Oportunidade</Button></div></div></header>
    {filterOpen && <div className="mx-5 mt-4 flex items-center gap-3 rounded-2xl border border-[#DDE8E0] bg-[#F7FBF8] p-3 md:mx-8"><Search size={16} className="text-[#6F7D75]" /><Input autoFocus value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar por negócio, empresa ou etiqueta" className="h-9 max-w-sm border-0 bg-transparent shadow-none focus-visible:ring-0" /><span className="ml-auto text-xs font-semibold text-[#7B8882]">{visibleDeals.length} em aberto</span></div>}
    <div className="relative overflow-hidden px-5 pb-5 pt-4 md:px-8"><div className="pointer-events-none absolute right-8 top-2 hidden h-44 w-80 overflow-hidden rounded-full opacity-[0.13] xl:block"><img src={funnelArtUrl} alt="" className="h-full w-full object-cover" /></div><div className="relative z-10 overflow-x-auto pb-3"><div className="flex min-w-max items-stretch gap-4">{activeFunnel?.stages.filter((stage) => !isWonStage(stage) && !isLostStage(stage)).map((stage) => <PipelineColumn key={stage.id} stage={stage} deals={visibleDeals.filter((deal) => deal.stageId === stage.id)} isOver={overStageId === stage.id} draggedDealId={draggedDealId} onEditStage={() => onEditStage(stage)} onEditDeal={onEditDeal} onDeleteDeal={onDeleteDeal} onDragStart={onDragStart} compactView={compactView} onDragOver={onDragOver} onDrop={onDrop} onDragEnd={onDragEnd} />)}<button onClick={onNewStage} className="stage-add-button"><CirclePlus size={20} /><span>Nova etapa</span></button></div></div>
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

function PipelineColumn({ stage, deals, isOver, draggedDealId, compactView, onEditStage, onEditDeal, onDeleteDeal, onDragStart, onDragOver, onDrop, onDragEnd }: { stage: Stage; deals: Deal[]; isOver: boolean; draggedDealId: string | null; compactView: boolean; onEditStage: () => void; onEditDeal: (deal: Deal) => void; onDeleteDeal: (deal: Deal) => void; onDragStart: (event: DragEvent<HTMLElement>, dealId: string) => void; onDragOver: (event: DragEvent<HTMLElement>, stageId: string) => void; onDrop: (stageId: string, event?: DragEvent<HTMLElement>) => void; onDragEnd: () => void }) {
  const columnValue = deals.reduce((sum, deal) => sum + deal.value, 0);
  const estimatedColumnValue = columnValue * (stage.probability / 100);
  return <section onDragOver={(event) => onDragOver(event, stage.id)} onDrop={(event) => { event.preventDefault(); onDrop(stage.id, event); }} className={`pipeline-column ${isOver ? "pipeline-column-over" : ""}`}><header className="mb-4 flex items-center gap-2 px-1"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color }} /><div className="min-w-0 flex-1"><h2 className="truncate text-sm font-extrabold text-[#2C3632]">{stage.name}</h2><p className="mt-0.5 text-xs text-[#7B8882]">{deals.length} {deals.length === 1 ? "negócio" : "negócios"} · {stage.probability}%</p></div><button onClick={onEditStage} className="icon-button h-7 w-7 opacity-70 hover:opacity-100" aria-label={`Editar etapa ${stage.name}`}><MoreHorizontal size={16} /></button></header><div className="column-instrument-grid mb-4 grid grid-cols-2 gap-2 px-1 py-2.5"><div><p className="text-[9px] font-extrabold uppercase tracking-[0.11em] text-[#829089]">Em aberto</p><p className="column-value mt-0.5 text-sm font-extrabold tracking-[-0.02em] text-[#44524C]">{formatCurrency(columnValue)}</p></div><div className="column-estimated-value border-l border-[#DCE9E2] pl-2.5"><p className="text-[9px] font-extrabold uppercase tracking-[0.11em] text-[#0A8C65]">Estimado</p><p className="mt-0.5 text-sm font-extrabold tracking-[-0.02em] text-[#087E5A]">{formatCurrency(estimatedColumnValue)}</p></div></div><div className={`min-h-[420px] space-y-3 ${compactView ? "[&_.deal-card]:!p-3 [&_.deal-card]:!min-h-0 [&_.deal-card_h3]:!text-sm [&_.deal-card_.mt-4]:!mt-2" : ""}`}>{deals.map((deal) => <DealCard key={deal.id} deal={deal} isDragging={draggedDealId === deal.id} onEdit={() => onEditDeal(deal)} onDelete={() => onDeleteDeal(deal)} onDragStart={onDragStart} onDragEnd={onDragEnd} />)}{deals.length === 0 && <div className="grid min-h-28 place-items-center rounded-xl border border-dashed border-[#D6DED8] bg-white/45 p-4 text-center text-xs font-medium text-[#87928D]">Solte uma oportunidade aqui</div>}</div></section>;
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

function ActivitiesWorkspace({ deals, onToggleActivity, onOpenDeal, onNewDeal }: { deals: Deal[]; onToggleActivity: (deal: Deal, activity: DealActivity) => void; onOpenDeal: (deal: Deal) => void; onNewDeal: () => void }) {
  const rows = deals.flatMap((deal) => {
    const activities = deal.activities?.length ? deal.activities : [{ id: `next-${deal.id}`, subject: "Próxima atividade", dueAt: deal.nextActivity, done: deal.nextActivity === "Sem pendências" }];
    return activities.map((activity) => ({ deal, activity }));
  });
  const pendingCount = rows.filter(({ activity }) => !activity.done).length;
  return <div className="min-h-screen bg-[#F6F5F1] px-5 pb-8 pt-[92px] md:px-8 md:pt-8"><div className="mx-auto max-w-[1420px]"><header className="flex flex-col gap-4 border-b border-[#E2E7E1] pb-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">Cadência comercial</p><div className="mt-1 flex items-center gap-2"><h1 className="page-title">Atividades</h1><span className="h-2 w-2 rounded-full bg-[#10A97A]" /></div><p className="mt-2 text-sm text-[#728079]">Acompanhe os próximos passos que mantêm suas oportunidades em movimento.</p></div><Button onClick={onNewDeal} className="h-10 gap-2 self-start rounded-xl bg-[#10A97A] px-4 font-bold hover:bg-[#087E5A] sm:self-auto"><Plus size={18} />Nova oportunidade</Button></header><section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_270px]"><div className="surface-panel overflow-hidden"><div className="flex items-center justify-between border-b border-[#E5EAE5] px-5 py-4 sm:px-6"><div><p className="text-sm font-extrabold text-[#27302D]">Agenda comercial</p><p className="mt-1 text-xs text-[#7B8882]">{pendingCount} {pendingCount === 1 ? "atividade pendente" : "atividades pendentes"}</p></div><span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F6F0] px-3 py-1.5 text-xs font-extrabold text-[#087E5A]"><Activity size={14} />Em andamento</span></div><div className="divide-y divide-[#E9EDE9]">{rows.map(({ deal, activity }) => <div key={activity.id} className="group flex gap-3 px-5 py-4 transition hover:bg-[#FAFBF9] sm:items-center sm:px-6"><button onClick={() => onToggleActivity(deal, activity)} className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border transition sm:mt-0 ${activity.done ? "border-[#10A97A] bg-[#10A97A] text-white" : "border-[#B8C7BE] bg-white text-transparent hover:border-[#10A97A] hover:text-[#10A97A]"}`} aria-label={activity.done ? "Reabrir atividade" : "Concluir atividade"}><CheckCircle2 size={14} /></button><button onClick={() => onOpenDeal(deal)} className="min-w-0 flex-1 text-left"><div className="flex flex-wrap items-center gap-2"><p className={`font-display text-sm font-extrabold tracking-[-0.025em] ${activity.done ? "text-[#8A9690] line-through" : "text-[#27302D]"}`}>{activity.subject}</p><span className="tag-chip bg-[#F1F4F1] text-[#64716B]">{deal.tag}</span></div><p className="mt-1 truncate text-xs font-medium text-[#74817A]">{deal.title} · {deal.company}</p></button><div className="ml-auto hidden min-w-[108px] items-center justify-end gap-1.5 text-xs font-bold text-[#607068] sm:flex"><Clock3 size={14} /><span>{activity.dueAt || "Sem data"}</span></div></div>)}{rows.length === 0 && <div className="grid min-h-64 place-items-center p-8 text-center"><div><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#E8F6F0] text-[#087E5A]"><Calendar size={21} /></div><p className="mt-4 font-display font-extrabold text-[#27302D]">Nenhuma atividade pendente</p><p className="mt-1 text-sm text-[#74817A]">Abra uma oportunidade para programar seu próximo passo.</p></div></div>}</div></div><aside className="surface-panel h-fit p-5"><p className="eyebrow">Leitura rápida</p><p className="mt-2 font-display text-4xl font-extrabold tracking-[-0.07em] text-[#17201E]">{pendingCount}</p><p className="mt-1 text-sm font-medium text-[#65746C]">ações que pedem continuidade</p><div className="mt-5 rounded-2xl bg-[#E8F6F0] p-4"><p className="text-xs font-extrabold text-[#087E5A]">Próximo passo</p><p className="mt-1 text-sm leading-5 text-[#315C4D]">Conclua uma atividade ou abra a oportunidade para registrar uma nova cadência.</p></div></aside></section></div></div>;
}

function DealCard({ deal, isDragging, onEdit, onDelete, onDragStart, onDragEnd }: { deal: Deal; isDragging: boolean; onEdit: () => void; onDelete: () => void; onDragStart: (event: DragEvent<HTMLElement>, dealId: string) => void; onDragEnd: () => void }) {
  const pendingActivities = (deal.activities ?? []).filter((activity) => !activity.done).length;
  const noteCount = (deal.notes ?? []).length;
  return <div draggable onDragStart={(event) => onDragStart(event, deal.id)} onDragEnd={onDragEnd} onClick={onEdit} className={`deal-card group ${isDragging ? "deal-card-dragging" : ""}`} role="button" tabIndex={0} onKeyDown={(event) => event.key === "Enter" && onEdit()}><div className="mb-3 flex items-center justify-between gap-2"><span className="tag-chip bg-[#F3F5F1] text-[#617069]">{deal.tag}</span><div className="flex items-center gap-1"><button type="button" draggable={false} onClick={(event) => { event.stopPropagation(); onDelete(); }} onKeyDown={(event) => event.stopPropagation()} className="grid h-7 w-7 place-items-center rounded-lg text-[#9AA59F] transition hover:bg-[#FCECEA] hover:text-[#B04A43]" aria-label={`Excluir ${deal.title}`} title="Excluir negócio"><Trash2 className="h-3.5 w-3.5" /></button><GripVertical className="h-4 w-4 text-[#ADB8B1]" /></div></div><h3 className="font-display text-[15px] font-bold leading-5 tracking-[-0.025em] text-[#29332F]">{deal.title}</h3><div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[#728079]"><Building2 size={13} /><span className="truncate">{deal.company}</span></div>{(pendingActivities > 0 || noteCount > 0 || deal.contactName) && <div className="mt-3 flex flex-wrap gap-1.5">{pendingActivities > 0 && <span className="inline-flex items-center gap-1 rounded-md bg-[#E8F6F0] px-1.5 py-1 text-[10px] font-extrabold text-[#087E5A]"><Calendar size={11} />{pendingActivities}</span>}{noteCount > 0 && <span className="inline-flex items-center gap-1 rounded-md bg-[#F1F3F0] px-1.5 py-1 text-[10px] font-extrabold text-[#63706B]"><ClipboardList size={11} />{noteCount}</span>}{deal.contactName && <span className="inline-flex max-w-[112px] items-center gap-1 truncate rounded-md bg-[#F1F3F0] px-1.5 py-1 text-[10px] font-extrabold text-[#63706B]"><Users size={11} /><span className="truncate">{deal.contactName}</span></span>}</div>}<div className="mt-4 flex items-end justify-between gap-2"><div><p className="text-base font-extrabold tracking-[-0.03em] text-[#1B2522]">{formatCurrency(deal.value)}</p><div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-[#718079]"><Clock3 size={12} /><span>{deal.nextActivity}</span></div></div><div className="grid h-7 w-7 place-items-center rounded-full bg-[#E7F2ED] text-[9px] font-extrabold text-[#087E5A]">{deal.owner}</div></div></div>;
}
