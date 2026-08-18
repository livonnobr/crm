// server/vercel-trpc-handler.ts
import { createHTTPHandler } from "@trpc/server/adapters/standalone";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  ownerEmail: process.env.OWNER_EMAIL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
};

// server/_core/notification.ts
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/supabase.ts
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
var adminClient = null;
function stableUuid(value, namespace) {
  const source = `${namespace}:${String(value ?? "")}`;
  const hex = createHash("sha1").update(source).digest("hex").slice(0, 32).split("");
  hex[12] = "4";
  hex[16] = (parseInt(hex[16], 16) & 3 | 8).toString(16);
  return `${hex.slice(0, 8).join("")}-${hex.slice(8, 12).join("")}-${hex.slice(12, 16).join("")}-${hex.slice(16, 20).join("")}-${hex.slice(20, 32).join("")}`;
}
function entityUuid(value, namespace) {
  const candidate = String(value ?? "");
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidate) ? candidate : stableUuid(candidate, namespace);
}
function mapStageReference(value) {
  return entityUuid(value, "stage");
}
function mapFunnelReference(value) {
  return entityUuid(value, "funnel");
}
function mapGoalReference(value, namespace) {
  if (value == null || value === "") return null;
  return entityUuid(value, namespace);
}
function getAdminClient() {
  if (adminClient) return adminClient;
  if (!ENV.supabaseUrl || !ENV.supabaseServiceRoleKey) {
    throw new Error("Supabase administrativo n\xE3o est\xE1 configurado no servidor.");
  }
  adminClient = createClient(ENV.supabaseUrl, ENV.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  return adminClient;
}
function extractSupabaseBearerToken(authorization) {
  return authorization?.match(/^Bearer\s+(.+)$/i)?.[1] ?? null;
}
async function ensureWorkspaceForSupabaseToken(authorization) {
  const token = extractSupabaseBearerToken(authorization);
  if (!token) throw new Error("Sess\xE3o Supabase ausente.");
  const supabase = getAdminClient();
  const authenticated = await supabase.auth.getUser(token);
  if (authenticated.error) throw authenticated.error;
  const authUser = authenticated.data.user;
  if (!authUser) throw new Error("Usu\xE1rio Supabase inv\xE1lido.");
  const existing = await supabase.from("workspaces").select("id").eq("owner_id", authUser.id).limit(1).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data?.id) return { workspaceId: existing.data.id, ownerId: authUser.id, email: authUser.email ?? null };
  const createdWorkspace = await supabase.from("workspaces").insert({ owner_id: authUser.id, name: "Ritmo CRM" }).select("id").single();
  if (createdWorkspace.error) throw createdWorkspace.error;
  return { workspaceId: createdWorkspace.data.id, ownerId: authUser.id, email: authUser.email ?? null };
}
async function getWorkspaceSnapshot(workspaceId) {
  const supabase = getAdminClient();
  const { data: prospectLists, error: prospectListsError } = await supabase.from("prospect_lists").select("id, workspace_id, name, deleted_at").eq("workspace_id", workspaceId).order("created_at", { ascending: true });
  if (prospectListsError) throw prospectListsError;
  const prospectListIds = (prospectLists ?? []).map((list) => list.id);
  const [
    { data: goals, error: goalsError },
    { data: funnels, error: funnelsError },
    { data: conversionSettings, error: conversionError },
    { data: prospectRecords, error: prospectRecordsError },
    { data: cadenceBlocks, error: cadenceError },
    { data: financeEntries, error: financeError },
    { data: services, error: servicesError },
    { data: goalSimulationStages, error: goalSimulationStagesError }
  ] = await Promise.all([
    supabase.from("goals").select("id, title, goal_type, target, actual, unit, period, color, recurring, monthly_overrides, position, linked_funnel_id, linked_stage_id").eq("workspace_id", workspaceId).order("position", { ascending: true }),
    supabase.from("funnels").select("id, name, currency, position").eq("workspace_id", workspaceId).order("position", { ascending: true }),
    supabase.from("conversion_settings").select("workspace_id, rates").eq("workspace_id", workspaceId).maybeSingle(),
    prospectListIds.length ? supabase.from("prospect_records").select("id, list_id, decision_maker_first_name, decision_maker_last_name, decision_maker_role, decision_maker_email, decision_maker_phone, decision_maker_secondary_phone, monthly_visits, company, company_website, analysis, position").in("list_id", prospectListIds).order("position", { ascending: true }) : Promise.resolve({ data: [], error: null }),
    supabase.from("cadence_blocks").select("id, workspace_id, day, slot, title, channel, notes, position").eq("workspace_id", workspaceId).order("position", { ascending: true }),
    supabase.from("finance_entries").select("id, workspace_id, expense, amount, installment, due_date, notes, position").eq("workspace_id", workspaceId).order("position", { ascending: true }),
    supabase.from("services").select("id, workspace_id, name, deliverables, deadline, deadline_unit, price, pricing_type, position").eq("workspace_id", workspaceId).order("position", { ascending: true }),
    supabase.from("goal_simulation_stages").select("id, workspace_id, name, color, probability, position").eq("workspace_id", workspaceId).order("position", { ascending: true })
  ]);
  const error = goalsError ?? funnelsError ?? conversionError ?? prospectListsError ?? prospectRecordsError ?? cadenceError ?? financeError ?? servicesError ?? goalSimulationStagesError;
  if (error) throw error;
  const funnelIds = (funnels ?? []).map((funnel) => funnel.id);
  const [{ data: stages, error: stagesError }, { data: opportunities, error: opportunitiesError }] = funnelIds.length ? await Promise.all([
    supabase.from("stages").select("id, funnel_id, name, color, probability, position").in("funnel_id", funnelIds).order("position", { ascending: true }),
    supabase.from("opportunities").select("id, funnel_id, stage_id, title, company, value, owner_initials, tag, next_activity, position, contact_name, contact_role, contact_email, contact_phone, company_data, activities, notes").in("funnel_id", funnelIds).order("position", { ascending: true })
  ]) : [{ data: [], error: null }, { data: [], error: null }];
  if (stagesError || opportunitiesError) throw stagesError ?? opportunitiesError;
  return { goals: goals ?? [], funnels: funnels ?? [], stages: stages ?? [], opportunities: opportunities ?? [], conversionSettings: conversionSettings ?? null, prospectLists: prospectLists ?? [], prospectRecords: prospectRecords ?? [], cadenceBlocks: cadenceBlocks ?? [], financeEntries: financeEntries ?? [], services: services ?? [], goalSimulationStages: goalSimulationStages ?? [] };
}
async function syncService(workspaceId, service) {
  const supabase = getAdminClient();
  const deadlineUnit = ["dias", "semanas", "meses"].includes(service?.deadlineUnit) ? service.deadlineUnit : "dias";
  const pricingType = ["Fixo", "Mensal", "A partir de"].includes(service?.pricingType) ? service.pricingType : "Fixo";
  const deadline = Math.min(3650, Math.max(1, Number(service?.deadline) || 1));
  const price = Math.max(0, Number(service?.price) || 0);
  const row = {
    id: entityUuid(service?.id, "service"),
    workspace_id: workspaceId,
    name: String(service?.name ?? "Novo servi\xE7o").trim() || "Novo servi\xE7o",
    deliverables: String(service?.deliverables ?? ""),
    deadline,
    deadline_unit: deadlineUnit,
    price,
    pricing_type: pricingType,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  const { error } = await supabase.from("services").upsert(row);
  if (error) throw error;
  return { ok: true, id: row.id };
}
async function syncGoalsWorkspace(workspaceId, goals, goalSimulationStages) {
  const supabase = getAdminClient();
  const goalRows = goals.map((goal, position) => ({
    id: entityUuid(goal.id, "goal"),
    workspace_id: workspaceId,
    title: String(goal.title ?? "").trim() || "Nova meta",
    goal_type: goal.type,
    target: Math.max(0, Number(goal.target) || 0),
    actual: Math.max(0, Number(goal.actual) || 0),
    unit: goal.unit,
    period: goal.period,
    color: goal.color,
    recurring: Boolean(goal.recurring),
    monthly_overrides: goal.monthlyOverrides ?? {},
    linked_funnel_id: mapGoalReference(goal.linkedFunnelId, "funnel"),
    linked_stage_id: mapGoalReference(goal.linkedStageId, "stage"),
    position
  }));
  const { data: existingGoals, error: existingGoalsError } = await supabase.from("goals").select("id").eq("workspace_id", workspaceId);
  if (existingGoalsError) throw existingGoalsError;
  const goalIds = goalRows.map((row) => row.id);
  const staleGoalIds = (existingGoals ?? []).map((row) => row.id).filter((id) => !goalIds.includes(id));
  if (staleGoalIds.length) {
    const result = await supabase.from("goals").delete().in("id", staleGoalIds);
    if (result.error) throw result.error;
  }
  if (goalRows.length) {
    const result = await supabase.from("goals").upsert(goalRows);
    if (result.error) throw result.error;
  }
  const { data: existingGoalSimulationStages, error: goalSimulationStagesReadError } = await supabase.from("goal_simulation_stages").select("id").eq("workspace_id", workspaceId);
  if (goalSimulationStagesReadError) throw goalSimulationStagesReadError;
  const goalSimulationStageRows = goalSimulationStages.map((stage, position) => ({
    id: entityUuid(stage.id, "goal-simulation-stage"),
    workspace_id: workspaceId,
    name: String(stage.name ?? "Nova etapa").trim() || "Nova etapa",
    color: stage.color,
    probability: Math.min(100, Math.max(0, Number(stage.probability) || 0)),
    position,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }));
  const goalSimulationStageIds = goalSimulationStageRows.map((row) => row.id);
  const staleGoalSimulationStages = (existingGoalSimulationStages ?? []).map((row) => row.id).filter((id) => !goalSimulationStageIds.includes(id));
  if (staleGoalSimulationStages.length) {
    const result = await supabase.from("goal_simulation_stages").delete().in("id", staleGoalSimulationStages);
    if (result.error) throw result.error;
  }
  if (goalSimulationStageRows.length) {
    const result = await supabase.from("goal_simulation_stages").upsert(goalSimulationStageRows);
    if (result.error) throw result.error;
  }
  return { ok: true };
}
async function syncWorkspaceSnapshot(workspaceId, state) {
  const supabase = getAdminClient();
  const goals = Array.isArray(state.goals) ? state.goals : [];
  const funnels = Array.isArray(state.funnels) ? state.funnels : [];
  const deals = Array.isArray(state.deals) ? state.deals : [];
  const prospectLists = Array.isArray(state.prospectLists) ? state.prospectLists : [];
  const trashedProspectLists = Array.isArray(state.trashedProspectLists) ? state.trashedProspectLists : [];
  const cadenceBlocks = Array.isArray(state.cadenceBlocks) ? state.cadenceBlocks : [];
  const financeEntries = Array.isArray(state.financeEntries) ? state.financeEntries : [];
  const services = Array.isArray(state.services) ? state.services : [];
  const goalSimulationStages = Array.isArray(state.goalSimulationStages) ? state.goalSimulationStages : [];
  const stageToFunnel = new Map(funnels.flatMap((funnel) => (funnel.stages ?? []).map((stage) => [mapStageReference(stage.id), mapFunnelReference(funnel.id)])));
  const funnelIds = funnels.map((funnel) => mapFunnelReference(funnel.id));
  const goalRows = goals.map((goal, position) => ({ id: entityUuid(goal.id, "goal"), workspace_id: workspaceId, title: goal.title, goal_type: goal.type, target: goal.target, actual: goal.actual, unit: goal.unit, period: goal.period, color: goal.color, recurring: Boolean(goal.recurring), monthly_overrides: goal.monthlyOverrides ?? {}, linked_funnel_id: mapGoalReference(goal.linkedFunnelId, "funnel"), linked_stage_id: mapGoalReference(goal.linkedStageId, "stage"), position }));
  if (goalRows.length) {
    const { error } = await supabase.from("goals").upsert(goalRows);
    if (error) throw error;
  }
  const { error: conversionError } = await supabase.from("conversion_settings").upsert({ workspace_id: workspaceId, rates: state.conversionRates ?? {}, updated_at: (/* @__PURE__ */ new Date()).toISOString() });
  if (conversionError) throw conversionError;
  const { data: existingGoalSimulationStages, error: goalSimulationStagesReadError } = await supabase.from("goal_simulation_stages").select("id").eq("workspace_id", workspaceId);
  if (goalSimulationStagesReadError) throw goalSimulationStagesReadError;
  const goalSimulationStageRows = goalSimulationStages.map((stage, position) => ({ id: entityUuid(stage.id, "goal-simulation-stage"), workspace_id: workspaceId, name: stage.name, color: stage.color, probability: Math.min(100, Math.max(0, Number(stage.probability) || 0)), position, updated_at: (/* @__PURE__ */ new Date()).toISOString() }));
  const goalSimulationStageIds = goalSimulationStageRows.map((row) => row.id);
  const staleGoalSimulationStages = (existingGoalSimulationStages ?? []).map((row) => row.id).filter((id) => !goalSimulationStageIds.includes(id));
  if (staleGoalSimulationStages.length) {
    const result = await supabase.from("goal_simulation_stages").delete().in("id", staleGoalSimulationStages);
    if (result.error) throw result.error;
  }
  if (goalSimulationStageRows.length) {
    const result = await supabase.from("goal_simulation_stages").upsert(goalSimulationStageRows);
    if (result.error) throw result.error;
  }
  const { data: existingFunnels, error: existingFunnelsError } = await supabase.from("funnels").select("id").eq("workspace_id", workspaceId);
  if (existingFunnelsError) throw existingFunnelsError;
  const staleFunnelIds = (existingFunnels ?? []).map((row) => row.id).filter((id) => !funnelIds.includes(id));
  if (staleFunnelIds.length) {
    for (const table of ["opportunities", "stages", "funnels"]) {
      const { error } = await supabase.from(table).delete().in(table === "funnels" ? "id" : "funnel_id", staleFunnelIds);
      if (error) throw error;
    }
  }
  const funnelRows = funnels.map((funnel, position) => ({ id: mapFunnelReference(funnel.id), workspace_id: workspaceId, name: funnel.name, currency: funnel.currency, position }));
  if (funnelRows.length) {
    const { error } = await supabase.from("funnels").upsert(funnelRows);
    if (error) throw error;
  }
  const stageRows = funnels.flatMap((funnel) => (funnel.stages ?? []).map((stage, position) => ({ id: mapStageReference(stage.id), funnel_id: mapFunnelReference(funnel.id), name: stage.name, color: stage.color, probability: stage.probability, position })));
  if (funnelIds.length) {
    const { data: existingStages, error } = await supabase.from("stages").select("id").in("funnel_id", funnelIds);
    if (error) throw error;
    const keep = stageRows.map((row) => row.id);
    const stale = (existingStages ?? []).map((row) => row.id).filter((id) => !keep.includes(id));
    if (stale.length) {
      const result = await supabase.from("stages").delete().in("id", stale);
      if (result.error) throw result.error;
    }
  }
  if (stageRows.length) {
    const { error } = await supabase.from("stages").upsert(stageRows);
    if (error) throw error;
  }
  const opportunityRows = deals.flatMap((deal, position) => {
    const stageId = mapStageReference(deal.stageId);
    const funnelId = stageToFunnel.get(stageId);
    return funnelId ? [{ id: entityUuid(deal.id, "opportunity"), funnel_id: funnelId, stage_id: stageId, title: deal.title, company: deal.company, value: deal.value, owner_initials: deal.owner, tag: deal.tag, next_activity: deal.nextActivity, contact_name: deal.contactName ?? "", contact_role: deal.contactRole ?? "", contact_email: deal.contactEmail ?? "", contact_phone: deal.contactPhone ?? "", company_data: { ...deal.companyData ?? {}, __ritmoStageHistory: (deal.stageHistory ?? [deal.stageId]).map((value) => mapStageReference(value)), __ritmoStageEvents: (deal.companyData?.__ritmoStageEvents ?? deal.stageEvents ?? []).map((event) => ({ ...event, stageId: mapStageReference(event.stageId) })) }, activities: deal.activities ?? [], notes: deal.notes ?? [], position }] : [];
  });
  if (funnelIds.length) {
    const { data: existingDeals, error } = await supabase.from("opportunities").select("id").in("funnel_id", funnelIds);
    if (error) throw error;
    const keep = opportunityRows.map((row) => row.id);
    const stale = (existingDeals ?? []).map((row) => row.id).filter((id) => !keep.includes(id));
    if (stale.length) {
      const result = await supabase.from("opportunities").delete().in("id", stale);
      if (result.error) throw result.error;
    }
  }
  if (opportunityRows.length) {
    const { error } = await supabase.from("opportunities").upsert(opportunityRows);
    if (error) throw error;
  }
  const desiredLists = [...prospectLists, ...trashedProspectLists];
  const desiredListIds = desiredLists.map((list) => list.id);
  const { data: existingLists, error: existingListsError } = await supabase.from("prospect_lists").select("id").eq("workspace_id", workspaceId);
  if (existingListsError) throw existingListsError;
  const staleLists = (existingLists ?? []).map((row) => row.id).filter((id) => !desiredListIds.includes(id));
  if (staleLists.length) {
    const result = await supabase.from("prospect_lists").delete().in("id", staleLists);
    if (result.error) throw result.error;
  }
  if (desiredLists.length) {
    const rows = desiredLists.map((list) => ({ id: list.id, workspace_id: workspaceId, name: list.name, deleted_at: list.deletedAt ?? null, updated_at: (/* @__PURE__ */ new Date()).toISOString() }));
    const result = await supabase.from("prospect_lists").upsert(rows);
    if (result.error) throw result.error;
  }
  const recordRows = desiredLists.flatMap((list) => (list.records ?? []).map((record, position) => ({ id: record.id, list_id: list.id, decision_maker_first_name: record.decisionMakerFirstName, decision_maker_last_name: record.decisionMakerLastName, decision_maker_role: record.decisionMakerRole, decision_maker_email: record.decisionMakerEmail, decision_maker_phone: record.decisionMakerPhone, decision_maker_secondary_phone: record.decisionMakerSecondaryPhone ?? "", monthly_visits: record.monthlyVisits ?? "", company: record.company, company_website: record.companyWebsite, analysis: record.analysis, position, updated_at: (/* @__PURE__ */ new Date()).toISOString() })));
  for (const list of desiredLists) {
    const { data: existingRecords, error } = await supabase.from("prospect_records").select("id").eq("list_id", list.id);
    if (error) throw error;
    const keep = (list.records ?? []).map((record) => record.id);
    const stale = (existingRecords ?? []).map((row) => row.id).filter((id) => !keep.includes(id));
    if (stale.length) {
      const result = await supabase.from("prospect_records").delete().in("id", stale);
      if (result.error) throw result.error;
    }
  }
  if (recordRows.length) {
    const { error } = await supabase.from("prospect_records").upsert(recordRows);
    if (error) throw error;
  }
  const { data: existingCadence, error: cadenceReadError } = await supabase.from("cadence_blocks").select("id").eq("workspace_id", workspaceId);
  if (cadenceReadError) throw cadenceReadError;
  const cadenceIds = cadenceBlocks.map((block) => block.id);
  const staleCadence = (existingCadence ?? []).map((row) => row.id).filter((id) => !cadenceIds.includes(id));
  if (staleCadence.length) {
    const result = await supabase.from("cadence_blocks").delete().in("id", staleCadence);
    if (result.error) throw result.error;
  }
  if (cadenceBlocks.length) {
    const result = await supabase.from("cadence_blocks").upsert(cadenceBlocks.map((block, position) => ({ id: block.id, workspace_id: workspaceId, day: block.day, slot: block.slot, title: block.title, channel: block.channel, notes: block.notes, position, updated_at: (/* @__PURE__ */ new Date()).toISOString() })));
    if (result.error) throw result.error;
  }
  const { data: existingFinance, error: financeReadError } = await supabase.from("finance_entries").select("id").eq("workspace_id", workspaceId);
  if (financeReadError) throw financeReadError;
  const financeIds = financeEntries.map((entry) => entry.id);
  const staleFinance = (existingFinance ?? []).map((row) => row.id).filter((id) => !financeIds.includes(id));
  if (staleFinance.length) {
    const result = await supabase.from("finance_entries").delete().in("id", staleFinance);
    if (result.error) throw result.error;
  }
  if (financeEntries.length) {
    const result = await supabase.from("finance_entries").upsert(financeEntries.map((entry, position) => ({ id: entry.id, workspace_id: workspaceId, expense: entry.expense, amount: entry.amount, installment: entry.installment, due_date: entry.dueDate || null, notes: entry.notes, position, updated_at: (/* @__PURE__ */ new Date()).toISOString() })));
    if (result.error) throw result.error;
  }
  const { data: existingServices, error: servicesReadError } = await supabase.from("services").select("id").eq("workspace_id", workspaceId);
  if (servicesReadError) throw servicesReadError;
  const serviceIds = services.map((service) => entityUuid(service.id, "service"));
  const staleServices = (existingServices ?? []).map((row) => row.id).filter((id) => !serviceIds.includes(id));
  if (staleServices.length) {
    const result = await supabase.from("services").delete().in("id", staleServices);
    if (result.error) throw result.error;
  }
  if (services.length) {
    const result = await supabase.from("services").upsert(services.map((service, position) => ({ id: entityUuid(service.id, "service"), workspace_id: workspaceId, name: service.name, deliverables: service.deliverables ?? "", deadline: service.deadline, deadline_unit: service.deadlineUnit, price: service.price, pricing_type: service.pricingType, position, updated_at: (/* @__PURE__ */ new Date()).toISOString() })));
    if (result.error) throw result.error;
  }
  return { ok: true };
}

// server/routers.ts
import { z as z2 } from "zod";
var appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  workspace: router({
    bootstrap: publicProcedure.query(({ ctx }) => ensureWorkspaceForSupabaseToken(ctx.req.headers.authorization)),
    snapshot: publicProcedure.query(async ({ ctx }) => {
      const workspace = await ensureWorkspaceForSupabaseToken(ctx.req.headers.authorization);
      return { ...workspace, snapshot: await getWorkspaceSnapshot(workspace.workspaceId) };
    }),
    sync: publicProcedure.input(z2.object({ state: z2.any() })).mutation(async ({ ctx, input }) => {
      const workspace = await ensureWorkspaceForSupabaseToken(ctx.req.headers.authorization);
      return syncWorkspaceSnapshot(workspace.workspaceId, input.state);
    }),
    syncService: publicProcedure.input(z2.object({ service: z2.any() })).mutation(async ({ ctx, input }) => {
      const workspace = await ensureWorkspaceForSupabaseToken(ctx.req.headers.authorization);
      return syncService(workspace.workspaceId, input.service);
    }),
    syncGoals: publicProcedure.input(z2.object({ goals: z2.array(z2.any()), goalSimulationStages: z2.array(z2.any()) })).mutation(async ({ ctx, input }) => {
      const workspace = await ensureWorkspaceForSupabaseToken(ctx.req.headers.authorization);
      return syncGoalsWorkspace(workspace.workspaceId, input.goals, input.goalSimulationStages);
    })
  }),
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    })
  })
  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

// server/vercel-trpc-handler.ts
function createContext({ req, res }) {
  return {
    req,
    res,
    user: null
  };
}
var handler = createHTTPHandler({
  router: appRouter,
  createContext,
  basePath: "/api/trpc/"
});
function trpcHandler(req, res) {
  return handler(req, res);
}
export {
  trpcHandler as default
};
