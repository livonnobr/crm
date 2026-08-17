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
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  CircleDollarSign,
  CirclePlus,
  ClipboardList,
  Clock3,
  Filter,
  GitBranch,
  GripVertical,
  Layers,
  Menu,
  MoreHorizontal,
  Pencil,
  Pin,
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
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { getSupabaseClient, isSupabaseConfigured, supabase } from "@/lib/supabase";

type Page = "goals" | "pipeline" | "activities";
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

type DealActivity = {
  id: string;
  subject: string;
  dueAt: string;
  done: boolean;
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
  contactName?: string;
  contactRole?: string;
  contactEmail?: string;
  contactPhone?: string;
  companyData?: CompanyData;
  activities?: DealActivity[];
  notes?: DealNote[];
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
};

type FunnelRecord = { id: string; name: string; currency: string; position: number };
type StageRecord = { id: string; funnel_id: string; name: string; color: string; probability: number; position: number };
type OpportunityRecord = { id: string; funnel_id: string; stage_id: string; title: string; company: string; value: number | string; owner_initials: string; tag: string; next_activity: string; position: number; contact_name?: string | null; contact_role?: string | null; contact_email?: string | null; contact_phone?: string | null; company_data?: CompanyData | null; activities?: DealActivity[] | null; notes?: DealNote[] | null };

const logoUrl = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663898378323/XzvVLbbQIKNxqUWR.png";
const heroUrl = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663898378323/jujGClJPiwgthxhk.jpg";
const goalsArtUrl = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663898378323/RDXmzGzuzzJtGuhx.jpg";
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
  contactName: "",
  contactRole: "",
  contactEmail: "",
  contactPhone: "",
  companyData: {},
  activities: [],
  notes: [],
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
  const [page, setPage] = useState<Page>(() => {
    const tab = new URLSearchParams(window.location.search).get("aba");
    return tab === "funil" ? "pipeline" : tab === "atividades" ? "activities" : "goals";
  });
  const [isSidebarPinned, setIsSidebarPinned] = useState(false);
  const [isSidebarHovering, setIsSidebarHovering] = useState(false);
  const [goals, setGoals] = useState<GoalItem[]>(() => storedValue("ritmo-goals", initialGoals));
  const [funnels, setFunnels] = useState<SalesFunnel[]>(() => storedValue("ritmo-funnels", initialFunnels));
  const [deals, setDeals] = useState<Deal[]>(() => storedValue("ritmo-deals", initialDeals));
  const [activeFunnelId, setActiveFunnelId] = useState(() => storedValue("ritmo-active-funnel", "primary-funnel"));
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [isCloudLoading, setIsCloudLoading] = useState(isSupabaseConfigured);
  const [isCloudHydrating, setIsCloudHydrating] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [isAuthSending, setIsAuthSending] = useState(false);
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
  const [detailDealId, setDetailDealId] = useState<string | null>(null);

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

    const [{ data: goalRows, error: goalsError }, { data: funnelRows, error: funnelsError }] = await Promise.all([
      client.from("goals").select("id, title, goal_type, target, actual, unit, period, color").eq("workspace_id", currentWorkspaceId).order("created_at", { ascending: false }),
      client.from("funnels").select("id, name, currency, position").eq("workspace_id", currentWorkspaceId).order("position"),
    ]);

    if (goalsError || funnelsError) {
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

    const normalizedGoals = ((goalRows ?? []) as GoalRecord[]).map((goal) => ({
      id: goal.id,
      title: goal.title,
      type: goal.goal_type,
      target: Number(goal.target),
      actual: Number(goal.actual),
      unit: goal.unit,
      period: goal.period,
      color: goal.color,
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
      companyData: deal.company_data ?? {},
      activities: Array.isArray(deal.activities) ? deal.activities : [],
      notes: Array.isArray(deal.notes) ? deal.notes : [],
    }));

    setGoals(normalizedGoals);
    setFunnels(normalizedFunnels);
    setDeals(normalizedDeals);
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
    if (!workspaceId) window.localStorage.setItem("ritmo-deals", JSON.stringify(deals));
  }, [deals, workspaceId]);

  useEffect(() => {
    if (!workspaceId) window.localStorage.setItem("ritmo-active-funnel", activeFunnelId);
  }, [activeFunnelId, workspaceId]);

  useEffect(() => {
    if (!workspaceId || !supabase || isCloudHydrating) return;
    const client = getSupabaseClient();
    const stageToFunnel = new Map(funnels.flatMap((funnel) => funnel.stages.map((stage) => [stage.id, funnel.id] as const)));
    const syncCloudState = async () => {
      if (goals.length) await client.from("goals").upsert(goals.map((goal) => ({ id: goal.id, workspace_id: workspaceId, title: goal.title, goal_type: goal.type, target: goal.target, actual: goal.actual, unit: goal.unit, period: goal.period, color: goal.color })));
      if (funnels.length) await client.from("funnels").upsert(funnels.map((funnel, position) => ({ id: funnel.id, workspace_id: workspaceId, name: funnel.name, currency: funnel.currency, position })));
      const stageRows = funnels.flatMap((funnel) => funnel.stages.map((stage, position) => ({ id: stage.id, funnel_id: funnel.id, name: stage.name, color: stage.color, probability: stage.probability, position })));
      if (stageRows.length) await client.from("stages").upsert(stageRows);
      const opportunityRows = deals.flatMap((deal, position) => {
        const funnelId = stageToFunnel.get(deal.stageId);
        return funnelId ? [{ id: deal.id, funnel_id: funnelId, stage_id: deal.stageId, title: deal.title, company: deal.company, value: deal.value, owner_initials: deal.owner, tag: deal.tag, next_activity: deal.nextActivity, contact_name: deal.contactName ?? null, contact_role: deal.contactRole ?? null, contact_email: deal.contactEmail ?? null, contact_phone: deal.contactPhone ?? null, company_data: deal.companyData ?? {}, activities: deal.activities ?? [], notes: deal.notes ?? [], position }] : [];
      });
      if (opportunityRows.length) await client.from("opportunities").upsert(opportunityRows);
    };
    void syncCloudState();
  }, [goals, funnels, deals, workspaceId, isCloudHydrating]);

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
  const achievedRevenue = goals
    .filter((goal) => goal.unit === "R$")
    .reduce((sum, goal) => sum + goal.actual, 0);
  const averageGoalProgress = goals.length ? Math.round(goals.reduce((sum, goal) => sum + progressOf(goal), 0) / goals.length) : 0;
  const detailDeal = deals.find((deal) => deal.id === detailDealId);

  function selectPage(nextPage: Page) {
    setPage(nextPage);
    const url = new URL(window.location.href);
    if (nextPage === "goals") url.searchParams.delete("aba");
    else url.searchParams.set("aba", nextPage === "pipeline" ? "funil" : "atividades");
    window.history.replaceState({}, "", url);
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
      setDeals((current) => [{ ...dealDraft, id: uniqueId("deal") }, ...current]);
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
    const dealId = draggedDealId ?? event?.dataTransfer.getData("text/plain");
    if (!dealId || dealId === stageId) return;
    setDeals((current) => current.map((deal) => (deal.id === dealId ? { ...deal, stageId } : deal)));
    clearDragState();
    const targetStage = activeFunnel?.stages.find((stage) => stage.id === stageId);
    toast.success(isWonStage(targetStage ?? { id: "", name: "", color: "", probability: 0 }) ? "Oportunidade marcada como ganha." : isLostStage(targetStage ?? { id: "", name: "", color: "", probability: 0 }) ? "Oportunidade marcada como perdida." : `Oportunidade movida para ${targetStage?.name ?? "a etapa"}.`);
  }

  function loseDeal(event?: DragEvent<HTMLElement>) {
    const dealId = draggedDealId ?? event?.dataTransfer.getData("text/plain");
    if (!dealId || !activeFunnel) return;
    const targetStage = lostStage ?? { id: `${activeFunnel.id}-lost`, name: "Perdido", color: "#C55A52", probability: 0 };
    if (!lostStage) {
      setFunnels((current) => current.map((funnel) => funnel.id === activeFunnel.id ? { ...funnel, stages: [...funnel.stages, targetStage] } : funnel));
    }
    setDeals((current) => current.map((deal) => deal.id === dealId ? { ...deal, stageId: targetStage.id } : deal));
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
            <SidebarItem icon={<Users size={19} />} label="Pessoas" onClick={() => toast.info("Pessoas entra na próxima etapa do CRM.")} />
            <SidebarItem icon={<Calendar size={19} />} label="Atividades" active={page === "activities"} onClick={() => selectPage("activities")} />
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-7 p-0">
          <SidebarGroupLabel className="px-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#9AA59F] group-data-[collapsible=icon]:hidden">Visões</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarItem icon={<Activity size={18} />} label="Ritmo do mês" onClick={() => toast.info("Relatórios será conectado quando a base Supabase estiver ativa.")} />
              <SidebarItem icon={<Settings size={18} />} label="Configurações" onClick={() => toast.info("Configurações estará disponível em breve.")} />
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
        <button onClick={page === "goals" ? openNewGoal : openNewDeal} className="grid h-10 w-10 place-items-center rounded-xl bg-[#10A97A] text-white" aria-label="Criar">
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <main className="min-h-screen min-w-0 flex-1">
        {page === "goals" ? (
          <GoalsWorkspace
            goals={goals}
            achievedRevenue={achievedRevenue}
            averageGoalProgress={averageGoalProgress}
            onNewGoal={openNewGoal}
            onEditGoal={openEditGoal}
            onDeleteGoal={deleteGoal}
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
            onNewStage={openNewStage}
            onEditStage={openEditStage}
            onDragStart={startDrag}
            onDrop={moveDeal}
            onLoseDrop={loseDeal}
            onDragOver={allowDrop}
            onDragEnd={clearDragState}
          />
        ) : (
          <ActivitiesWorkspace deals={openDeals} onToggleActivity={toggleWorkspaceActivity} onOpenDeal={openDealDetail} onNewDeal={openNewDeal} />
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

function PipelineWorkspace({ funnels, activeFunnel, activeFunnelId, deals, wonDeals, lostDeals, wonStage, lostStage, totalPipeline, weightedPipeline, draggedDealId, overStageId, onSelectFunnel, onNewFunnel, onEditFunnel, onNewDeal, onEditDeal, onNewStage, onEditStage, onDragStart, onDrop, onLoseDrop, onDragOver, onDragEnd }: { funnels: SalesFunnel[]; activeFunnel?: SalesFunnel; activeFunnelId: string; deals: Deal[]; wonDeals: Deal[]; lostDeals: Deal[]; wonStage?: Stage; lostStage?: Stage; totalPipeline: number; weightedPipeline: number; draggedDealId: string | null; overStageId: string | null; onSelectFunnel: (id: string) => void; onNewFunnel: () => void; onEditFunnel: () => void; onNewDeal: () => void; onEditDeal: (deal: Deal) => void; onNewStage: () => void; onEditStage: (stage: Stage) => void; onDragStart: (event: DragEvent<HTMLElement>, dealId: string) => void; onDrop: (stageId: string, event?: DragEvent<HTMLElement>) => void; onLoseDrop: (event?: DragEvent<HTMLElement>) => void; onDragOver: (event: DragEvent<HTMLElement>, stageId: string) => void; onDragEnd: () => void }) {
  if (!activeFunnel) return <div className="pipeline-shell grid min-h-screen place-items-center px-5 pt-[68px] md:pt-0"><div className="max-w-md text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#E8F6F0] text-[#087E5A]"><GitBranch size={26} /></div><p className="eyebrow mt-6">Operação comercial</p><h1 className="page-title">Seu primeiro funil começa aqui</h1><p className="mt-3 text-sm leading-6 text-[#718079]">Crie etapas próprias para conduzir oportunidades, acompanhar valores e mover a receita com clareza.</p><Button onClick={onNewFunnel} className="mt-6 h-11 gap-2 rounded-xl bg-[#10A97A] px-5 font-bold hover:bg-[#087E5A]"><CirclePlus size={18} />Criar funil</Button></div></div>;
  return <div className="pipeline-shell pt-[68px] md:pt-0"><header><div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between"><div className="flex min-w-0 flex-wrap items-center gap-2.5"><div className="flex items-center gap-2"><h1 className="page-title">Funil de vendas</h1><span className="hidden h-2 w-2 rounded-full bg-[#10A97A] sm:block" /></div><span className="hidden h-5 w-px bg-[#DDE4DE] sm:block" /><div className="relative"><select aria-label="Selecionar funil" className="funnel-selector appearance-none" value={activeFunnelId} onChange={(event) => onSelectFunnel(event.target.value)}>{funnels.map((funnel) => <option key={funnel.id} value={funnel.id}>{funnel.name}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#77847E]" /></div><button onClick={onEditFunnel} className="icon-button" aria-label="Editar funil"><Pencil size={16} /></button><button onClick={onNewFunnel} className="hidden items-center gap-1.5 text-sm font-bold text-[#087E5A] sm:flex"><CirclePlus size={17} />Novo funil</button></div><div className="flex flex-wrap items-center gap-2"><div className="flex gap-2"><MiniMetric label="Em aberto" value={formatCurrency(totalPipeline)} /><MiniMetric label="Ponderado" value={formatCurrency(weightedPipeline)} accent /></div><button className="icon-button hidden sm:grid" onClick={() => toast.info("Filtros avançados entram na próxima versão.")} aria-label="Filtrar oportunidades"><Filter size={17} /></button><button className="tool-button hidden sm:flex" onClick={() => toast.info("Visualizações serão salvas com sua conta.")}><SlidersHorizontal size={17} /><span>Visualização</span></button><Button onClick={onNewDeal} className="h-10 gap-2 rounded-xl bg-[#10A97A] px-4 font-bold hover:bg-[#087E5A]"><Plus size={18} />Oportunidade</Button></div></div></header>
    <div className="relative overflow-hidden px-5 pb-5 pt-4 md:px-8"><div className="pointer-events-none absolute right-8 top-2 hidden h-44 w-80 overflow-hidden rounded-full opacity-[0.13] xl:block"><img src={funnelArtUrl} alt="" className="h-full w-full object-cover" /></div><div className="relative z-10 overflow-x-auto pb-3"><div className="flex min-w-max items-stretch gap-4">{activeFunnel?.stages.filter((stage) => !isWonStage(stage) && !isLostStage(stage)).map((stage) => <PipelineColumn key={stage.id} stage={stage} deals={deals.filter((deal) => deal.stageId === stage.id)} isOver={overStageId === stage.id} draggedDealId={draggedDealId} onEditStage={() => onEditStage(stage)} onEditDeal={onEditDeal} onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} onDragEnd={onDragEnd} />)}<button onClick={onNewStage} className="stage-add-button"><CirclePlus size={20} /><span>Nova etapa</span></button></div></div>
      <div className={`outcome-dropzones ${draggedDealId ? "outcome-dropzones-dragging" : ""}`} aria-live="polite"><OutcomeDropzone type="won" stage={wonStage} deals={wonDeals} isOver={wonStage ? overStageId === wonStage.id : false} onDragOver={onDragOver} onDrop={(event) => wonStage && onDrop(wonStage.id, event)} /><OutcomeDropzone type="lost" stage={lostStage} deals={lostDeals} isOver={overStageId === "lost" || (lostStage ? overStageId === lostStage.id : false)} onDragOver={(event) => onDragOver(event, lostStage?.id ?? "lost")} onDrop={onLoseDrop} /></div>
      <div className="mt-3 flex items-center gap-2 text-xs text-[#728079]"><GripVertical size={15} /><span>{draggedDealId ? "Solte a oportunidade em Ganho ou Perdido para concluir a decisão." : "Arraste oportunidades entre as etapas; Ganho e Perdido ficam no rodapé."}</span></div></div></div>;
}

function MiniMetric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <div className={`metric-instrument rounded-xl border px-3 py-2 ${accent ? "border-[#BDE5D5] bg-[#E8F6F0]" : "border-[#E0E6E0] bg-white"}`}><p className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#7B8882]">{accent && <span className="h-1.5 w-1.5 rounded-full bg-[#10A97A]" />}{label}</p><p className={`font-display mt-0.5 text-[15px] font-extrabold tracking-[-0.045em] ${accent ? "text-[#087E5A]" : "text-[#27302D]"}`}>{value}</p></div>;
}

function OutcomeDropzone({ type, stage, deals, isOver, onDragOver, onDrop }: { type: "won" | "lost"; stage?: Stage; deals: Deal[]; isOver: boolean; onDragOver: (event: DragEvent<HTMLElement>, stageId: string) => void; onDrop: (event: DragEvent<HTMLElement>) => void }) {
  const isWon = type === "won";
  const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);
  const stageId = stage?.id ?? type;
  return <section onDragOver={(event) => onDragOver(event, stageId)} onDrop={(event) => { event.preventDefault(); onDrop(event); }} className={`outcome-dropzone outcome-dropzone-${type} ${isOver ? `outcome-dropzone-${type}-over` : ""}`} aria-label={isWon ? "Zona de ganho" : "Zona de oportunidade perdida"}><div className="flex min-w-0 items-center gap-3"><div className="outcome-dropzone-icon">{isWon ? <CircleDollarSign size={19} /> : <X size={20} />}</div><div className="min-w-0"><p className="text-[9px] font-extrabold uppercase tracking-[0.15em] opacity-75">Decisão comercial</p><h2 className="font-display text-base font-extrabold tracking-[-0.035em]">{isWon ? "Ganhar oportunidade" : "Marcar como perdido"}</h2></div></div><div className="ml-auto hidden items-center gap-4 text-right sm:flex"><div><p className="text-[9px] font-bold uppercase tracking-[0.13em] opacity-75">{isWon ? "Ganhas" : "Perdidas"}</p><p className="font-display mt-0.5 text-sm font-extrabold tracking-[-0.04em]">{deals.length}</p></div><div><p className="text-[9px] font-bold uppercase tracking-[0.13em] opacity-75">Valor</p><p className="font-display mt-0.5 text-sm font-extrabold tracking-[-0.04em]">{formatCurrency(totalValue)}</p></div></div></section>;
}

function PipelineColumn({ stage, deals, isOver, draggedDealId, onEditStage, onEditDeal, onDragStart, onDragOver, onDrop, onDragEnd }: { stage: Stage; deals: Deal[]; isOver: boolean; draggedDealId: string | null; onEditStage: () => void; onEditDeal: (deal: Deal) => void; onDragStart: (event: DragEvent<HTMLElement>, dealId: string) => void; onDragOver: (event: DragEvent<HTMLElement>, stageId: string) => void; onDrop: (stageId: string, event?: DragEvent<HTMLElement>) => void; onDragEnd: () => void }) {
  const columnValue = deals.reduce((sum, deal) => sum + deal.value, 0);
  return <section onDragOver={(event) => onDragOver(event, stage.id)} onDrop={(event) => { event.preventDefault(); onDrop(stage.id, event); }} className={`pipeline-column ${isOver ? "pipeline-column-over" : ""}`}><header className="mb-4 flex items-center gap-2 px-1"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color }} /><div className="min-w-0 flex-1"><h2 className="truncate text-sm font-extrabold text-[#2C3632]">{stage.name}</h2><p className="mt-0.5 text-xs text-[#7B8882]">{deals.length} {deals.length === 1 ? "negócio" : "negócios"} · {stage.probability}%</p></div><button onClick={onEditStage} className="icon-button h-7 w-7 opacity-70 hover:opacity-100" aria-label={`Editar etapa ${stage.name}`}><MoreHorizontal size={16} /></button></header><p className="mb-4 border-y border-[#E3E8E3] px-1 py-2 text-sm font-extrabold tracking-[-0.02em] text-[#44524C]">{formatCurrency(columnValue)}</p><div className="min-h-[420px] space-y-3">{deals.map((deal) => <DealCard key={deal.id} deal={deal} isDragging={draggedDealId === deal.id} onEdit={() => onEditDeal(deal)} onDragStart={onDragStart} onDragEnd={onDragEnd} />)}{deals.length === 0 && <div className="grid min-h-28 place-items-center rounded-xl border border-dashed border-[#D6DED8] bg-white/45 p-4 text-center text-xs font-medium text-[#87928D]">Solte uma oportunidade aqui</div>}</div></section>;
}

function ActivitiesWorkspace({ deals, onToggleActivity, onOpenDeal, onNewDeal }: { deals: Deal[]; onToggleActivity: (deal: Deal, activity: DealActivity) => void; onOpenDeal: (deal: Deal) => void; onNewDeal: () => void }) {
  const rows = deals.flatMap((deal) => {
    const activities = deal.activities?.length ? deal.activities : [{ id: `next-${deal.id}`, subject: "Próxima atividade", dueAt: deal.nextActivity, done: deal.nextActivity === "Sem pendências" }];
    return activities.map((activity) => ({ deal, activity }));
  });
  const pendingCount = rows.filter(({ activity }) => !activity.done).length;
  return <div className="min-h-screen bg-[#F6F5F1] px-5 pb-8 pt-[92px] md:px-8 md:pt-8"><div className="mx-auto max-w-[1420px]"><header className="flex flex-col gap-4 border-b border-[#E2E7E1] pb-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">Cadência comercial</p><div className="mt-1 flex items-center gap-2"><h1 className="page-title">Atividades</h1><span className="h-2 w-2 rounded-full bg-[#10A97A]" /></div><p className="mt-2 text-sm text-[#728079]">Acompanhe os próximos passos que mantêm suas oportunidades em movimento.</p></div><Button onClick={onNewDeal} className="h-10 gap-2 self-start rounded-xl bg-[#10A97A] px-4 font-bold hover:bg-[#087E5A] sm:self-auto"><Plus size={18} />Nova oportunidade</Button></header><section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_270px]"><div className="surface-panel overflow-hidden"><div className="flex items-center justify-between border-b border-[#E5EAE5] px-5 py-4 sm:px-6"><div><p className="text-sm font-extrabold text-[#27302D]">Agenda comercial</p><p className="mt-1 text-xs text-[#7B8882]">{pendingCount} {pendingCount === 1 ? "atividade pendente" : "atividades pendentes"}</p></div><span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F6F0] px-3 py-1.5 text-xs font-extrabold text-[#087E5A]"><Activity size={14} />Em andamento</span></div><div className="divide-y divide-[#E9EDE9]">{rows.map(({ deal, activity }) => <div key={activity.id} className="group flex gap-3 px-5 py-4 transition hover:bg-[#FAFBF9] sm:items-center sm:px-6"><button onClick={() => onToggleActivity(deal, activity)} className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border transition sm:mt-0 ${activity.done ? "border-[#10A97A] bg-[#10A97A] text-white" : "border-[#B8C7BE] bg-white text-transparent hover:border-[#10A97A] hover:text-[#10A97A]"}`} aria-label={activity.done ? "Reabrir atividade" : "Concluir atividade"}><CheckCircle2 size={14} /></button><button onClick={() => onOpenDeal(deal)} className="min-w-0 flex-1 text-left"><div className="flex flex-wrap items-center gap-2"><p className={`font-display text-sm font-extrabold tracking-[-0.025em] ${activity.done ? "text-[#8A9690] line-through" : "text-[#27302D]"}`}>{activity.subject}</p><span className="tag-chip bg-[#F1F4F1] text-[#64716B]">{deal.tag}</span></div><p className="mt-1 truncate text-xs font-medium text-[#74817A]">{deal.title} · {deal.company}</p></button><div className="ml-auto hidden min-w-[108px] items-center justify-end gap-1.5 text-xs font-bold text-[#607068] sm:flex"><Clock3 size={14} /><span>{activity.dueAt || "Sem data"}</span></div></div>)}{rows.length === 0 && <div className="grid min-h-64 place-items-center p-8 text-center"><div><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#E8F6F0] text-[#087E5A]"><Calendar size={21} /></div><p className="mt-4 font-display font-extrabold text-[#27302D]">Nenhuma atividade pendente</p><p className="mt-1 text-sm text-[#74817A]">Abra uma oportunidade para programar seu próximo passo.</p></div></div>}</div></div><aside className="surface-panel h-fit p-5"><p className="eyebrow">Leitura rápida</p><p className="mt-2 font-display text-4xl font-extrabold tracking-[-0.07em] text-[#17201E]">{pendingCount}</p><p className="mt-1 text-sm font-medium text-[#65746C]">ações que pedem continuidade</p><div className="mt-5 rounded-2xl bg-[#E8F6F0] p-4"><p className="text-xs font-extrabold text-[#087E5A]">Próximo passo</p><p className="mt-1 text-sm leading-5 text-[#315C4D]">Conclua uma atividade ou abra a oportunidade para registrar uma nova cadência.</p></div></aside></section></div></div>;
}

function DealCard({ deal, isDragging, onEdit, onDragStart, onDragEnd }: { deal: Deal; isDragging: boolean; onEdit: () => void; onDragStart: (event: DragEvent<HTMLElement>, dealId: string) => void; onDragEnd: () => void }) {
  const pendingActivities = (deal.activities ?? []).filter((activity) => !activity.done).length;
  const noteCount = (deal.notes ?? []).length;
  return <div draggable onDragStart={(event) => onDragStart(event, deal.id)} onDragEnd={onDragEnd} onClick={onEdit} className={`deal-card group ${isDragging ? "deal-card-dragging" : ""}`} role="button" tabIndex={0} onKeyDown={(event) => event.key === "Enter" && onEdit()}><div className="mb-3 flex items-center justify-between gap-2"><span className="tag-chip bg-[#F3F5F1] text-[#617069]">{deal.tag}</span><GripVertical className="h-4 w-4 text-[#ADB8B1]" /></div><h3 className="font-display text-[15px] font-bold leading-5 tracking-[-0.025em] text-[#29332F]">{deal.title}</h3><div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[#728079]"><Building2 size={13} /><span className="truncate">{deal.company}</span></div>{(pendingActivities > 0 || noteCount > 0 || deal.contactName) && <div className="mt-3 flex flex-wrap gap-1.5">{pendingActivities > 0 && <span className="inline-flex items-center gap-1 rounded-md bg-[#E8F6F0] px-1.5 py-1 text-[10px] font-extrabold text-[#087E5A]"><Calendar size={11} />{pendingActivities}</span>}{noteCount > 0 && <span className="inline-flex items-center gap-1 rounded-md bg-[#F1F3F0] px-1.5 py-1 text-[10px] font-extrabold text-[#63706B]"><ClipboardList size={11} />{noteCount}</span>}{deal.contactName && <span className="inline-flex max-w-[112px] items-center gap-1 truncate rounded-md bg-[#F1F3F0] px-1.5 py-1 text-[10px] font-extrabold text-[#63706B]"><Users size={11} /><span className="truncate">{deal.contactName}</span></span>}</div>}<div className="mt-4 flex items-end justify-between gap-2"><div><p className="text-base font-extrabold tracking-[-0.03em] text-[#1B2522]">{formatCurrency(deal.value)}</p><div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-[#718079]"><Clock3 size={12} /><span>{deal.nextActivity}</span></div></div><div className="grid h-7 w-7 place-items-center rounded-full bg-[#E7F2ED] text-[9px] font-extrabold text-[#087E5A]">{deal.owner}</div></div></div>;
}
