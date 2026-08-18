import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ENV } from "./_core/env";

let adminClient: SupabaseClient | null = null;

function getAdminClient() {
  if (adminClient) return adminClient;
  if (!ENV.supabaseUrl || !ENV.supabaseServiceRoleKey) {
    throw new Error("Supabase administrativo não está configurado no servidor.");
  }

  adminClient = createClient(ENV.supabaseUrl, ENV.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return adminClient;
}

export async function ensureWorkspaceForOwner(owner: {
  email?: string | null;
  name?: string | null;
}) {
  const email = owner.email?.trim().toLowerCase();
  if (!email) throw new Error("O usuário autenticado não possui e-mail para vincular ao Supabase.");

  const supabase = getAdminClient();
  const users = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (users.error) throw users.error;

  let authUser = users.data.users.find(user => user.email?.toLowerCase() === email);
  if (!authUser) {
    const created = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { name: owner.name ?? email, source: "ritmo-manus-auth" },
    });
    if (created.error) throw created.error;
    authUser = created.data.user;
  }
  if (!authUser) throw new Error("Não foi possível resolver o usuário Supabase.");

  const existing = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_id", authUser.id)
    .limit(1)
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data?.id) return { workspaceId: existing.data.id, ownerId: authUser.id };

  const createdWorkspace = await supabase
    .from("workspaces")
    .insert({ owner_id: authUser.id, name: "Ritmo CRM" })
    .select("id")
    .single();
  if (createdWorkspace.error) throw createdWorkspace.error;

  return { workspaceId: createdWorkspace.data.id, ownerId: authUser.id };
}


export async function getWorkspaceSnapshot(workspaceId: string) {
  const supabase = getAdminClient();
  const { data: prospectLists, error: prospectListsError } = await supabase
    .from("prospect_lists")
    .select("id, workspace_id, name, deleted_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });
  if (prospectListsError) throw prospectListsError;
  const prospectListIds = (prospectLists ?? []).map((list) => list.id);
  const [
    { data: goals, error: goalsError },
    { data: funnels, error: funnelsError },
    { data: conversionSettings, error: conversionError },
    { data: prospectRecords, error: prospectRecordsError },
    { data: cadenceBlocks, error: cadenceError },
    { data: financeEntries, error: financeError },
  ] = await Promise.all([
    supabase.from("goals").select("id, title, goal_type, target, actual, unit, period, color, recurring, monthly_overrides, position, linked_funnel_id, linked_stage_id").eq("workspace_id", workspaceId).order("position", { ascending: true }),
    supabase.from("funnels").select("id, name, currency, position").eq("workspace_id", workspaceId).order("position", { ascending: true }),
    supabase.from("conversion_settings").select("workspace_id, rates").eq("workspace_id", workspaceId).maybeSingle(),
    prospectListIds.length
      ? supabase.from("prospect_records").select("id, list_id, decision_maker_first_name, decision_maker_last_name, decision_maker_role, decision_maker_email, decision_maker_phone, decision_maker_secondary_phone, monthly_visits, company, company_website, analysis, position").in("list_id", prospectListIds).order("position", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    supabase.from("cadence_blocks").select("id, workspace_id, day, slot, title, channel, notes, position").eq("workspace_id", workspaceId).order("position", { ascending: true }),
    supabase.from("finance_entries").select("id, workspace_id, expense, amount, installment, due_date, notes, position").eq("workspace_id", workspaceId).order("position", { ascending: true }),
  ]);
  const error = goalsError ?? funnelsError ?? conversionError ?? prospectListsError ?? prospectRecordsError ?? cadenceError ?? financeError;
  if (error) throw error;
  const funnelIds = (funnels ?? []).map((funnel) => funnel.id);
  const [{ data: stages, error: stagesError }, { data: opportunities, error: opportunitiesError }] = funnelIds.length
    ? await Promise.all([
        supabase.from("stages").select("id, funnel_id, name, color, probability, position").in("funnel_id", funnelIds).order("position", { ascending: true }),
        supabase.from("opportunities").select("id, funnel_id, stage_id, title, company, value, owner_initials, tag, next_activity, position, contact_name, contact_role, contact_email, contact_phone, company_data, activities, notes").in("funnel_id", funnelIds).order("position", { ascending: true }),
      ])
    : [{ data: [], error: null }, { data: [], error: null }];
  if (stagesError || opportunitiesError) throw stagesError ?? opportunitiesError;
  return { goals: goals ?? [], funnels: funnels ?? [], stages: stages ?? [], opportunities: opportunities ?? [], conversionSettings: conversionSettings ?? null, prospectLists: prospectLists ?? [], prospectRecords: prospectRecords ?? [], cadenceBlocks: cadenceBlocks ?? [], financeEntries: financeEntries ?? [] };
}


export async function syncWorkspaceSnapshot(workspaceId: string, state: any) {
  const supabase = getAdminClient();
  const goals = Array.isArray(state.goals) ? state.goals : [];
  const funnels = Array.isArray(state.funnels) ? state.funnels : [];
  const deals = Array.isArray(state.deals) ? state.deals : [];
  const prospectLists = Array.isArray(state.prospectLists) ? state.prospectLists : [];
  const trashedProspectLists = Array.isArray(state.trashedProspectLists) ? state.trashedProspectLists : [];
  const cadenceBlocks = Array.isArray(state.cadenceBlocks) ? state.cadenceBlocks : [];
  const financeEntries = Array.isArray(state.financeEntries) ? state.financeEntries : [];
  const stageToFunnel = new Map(funnels.flatMap((funnel: any) => (funnel.stages ?? []).map((stage: any) => [stage.id, funnel.id])));
  const funnelIds = funnels.map((funnel: any) => funnel.id);
  const goalRows = goals.map((goal: any, position: number) => ({ id: goal.id, workspace_id: workspaceId, title: goal.title, goal_type: goal.type, target: goal.target, actual: goal.actual, unit: goal.unit, period: goal.period, color: goal.color, recurring: Boolean(goal.recurring), monthly_overrides: goal.monthlyOverrides ?? {}, linked_funnel_id: goal.linkedFunnelId || null, linked_stage_id: goal.linkedStageId || null, position }));
  if (goalRows.length) { const { error } = await supabase.from("goals").upsert(goalRows); if (error) throw error; }
  const { error: conversionError } = await supabase.from("conversion_settings").upsert({ workspace_id: workspaceId, rates: state.conversionRates ?? {}, updated_at: new Date().toISOString() });
  if (conversionError) throw conversionError;
  const { data: existingFunnels, error: existingFunnelsError } = await supabase.from("funnels").select("id").eq("workspace_id", workspaceId);
  if (existingFunnelsError) throw existingFunnelsError;
  const staleFunnelIds = (existingFunnels ?? []).map((row: any) => row.id).filter((id: string) => !funnelIds.includes(id));
  if (staleFunnelIds.length) {
    for (const table of ["opportunities", "stages", "funnels"] as const) { const { error } = await supabase.from(table).delete().in(table === "funnels" ? "id" : "funnel_id", staleFunnelIds); if (error) throw error; }
  }
  const funnelRows = funnels.map((funnel: any, position: number) => ({ id: funnel.id, workspace_id: workspaceId, name: funnel.name, currency: funnel.currency, position }));
  if (funnelRows.length) { const { error } = await supabase.from("funnels").upsert(funnelRows); if (error) throw error; }
  const stageRows = funnels.flatMap((funnel: any) => (funnel.stages ?? []).map((stage: any, position: number) => ({ id: stage.id, funnel_id: funnel.id, name: stage.name, color: stage.color, probability: stage.probability, position })));
  if (funnelIds.length) { const { data: existingStages, error } = await supabase.from("stages").select("id").in("funnel_id", funnelIds); if (error) throw error; const keep = stageRows.map((row: any) => row.id); const stale = (existingStages ?? []).map((row: any) => row.id).filter((id: string) => !keep.includes(id)); if (stale.length) { const result = await supabase.from("stages").delete().in("id", stale); if (result.error) throw result.error; } }
  if (stageRows.length) { const { error } = await supabase.from("stages").upsert(stageRows); if (error) throw error; }
  const opportunityRows = deals.flatMap((deal: any, position: number) => { const funnelId = stageToFunnel.get(deal.stageId); return funnelId ? [{ id: deal.id, funnel_id: funnelId, stage_id: deal.stageId, title: deal.title, company: deal.company, value: deal.value, owner_initials: deal.owner, tag: deal.tag, next_activity: deal.nextActivity, contact_name: deal.contactName ?? null, contact_role: deal.contactRole ?? null, contact_email: deal.contactEmail ?? null, contact_phone: deal.contactPhone ?? null, company_data: { ...(deal.companyData ?? {}), __ritmoStageHistory: deal.stageHistory ?? [deal.stageId], __ritmoStageEvents: deal.companyData?.__ritmoStageEvents ?? [] }, activities: deal.activities ?? [], notes: deal.notes ?? [], position }] : []; });
  if (funnelIds.length) { const { data: existingDeals, error } = await supabase.from("opportunities").select("id").in("funnel_id", funnelIds); if (error) throw error; const keep = opportunityRows.map((row: any) => row.id); const stale = (existingDeals ?? []).map((row: any) => row.id).filter((id: string) => !keep.includes(id)); if (stale.length) { const result = await supabase.from("opportunities").delete().in("id", stale); if (result.error) throw result.error; } }
  if (opportunityRows.length) { const { error } = await supabase.from("opportunities").upsert(opportunityRows); if (error) throw error; }
  const desiredLists = [...prospectLists, ...trashedProspectLists];
  const desiredListIds = desiredLists.map((list: any) => list.id);
  const { data: existingLists, error: existingListsError } = await supabase.from("prospect_lists").select("id").eq("workspace_id", workspaceId); if (existingListsError) throw existingListsError;
  const staleLists = (existingLists ?? []).map((row: any) => row.id).filter((id: string) => !desiredListIds.includes(id)); if (staleLists.length) { const result = await supabase.from("prospect_lists").delete().in("id", staleLists); if (result.error) throw result.error; }
  if (desiredLists.length) { const rows = desiredLists.map((list: any) => ({ id: list.id, workspace_id: workspaceId, name: list.name, deleted_at: list.deletedAt ?? null, updated_at: new Date().toISOString() })); const result = await supabase.from("prospect_lists").upsert(rows); if (result.error) throw result.error; }
  const recordRows = desiredLists.flatMap((list: any) => (list.records ?? []).map((record: any, position: number) => ({ id: record.id, list_id: list.id, decision_maker_first_name: record.decisionMakerFirstName, decision_maker_last_name: record.decisionMakerLastName, decision_maker_role: record.decisionMakerRole, decision_maker_email: record.decisionMakerEmail, decision_maker_phone: record.decisionMakerPhone, decision_maker_secondary_phone: record.decisionMakerSecondaryPhone, monthly_visits: record.monthlyVisits, company: record.company, company_website: record.companyWebsite, analysis: record.analysis, position, updated_at: new Date().toISOString() })));
  for (const list of desiredLists) { const { data: existingRecords, error } = await supabase.from("prospect_records").select("id").eq("list_id", list.id); if (error) throw error; const keep = (list.records ?? []).map((record: any) => record.id); const stale = (existingRecords ?? []).map((row: any) => row.id).filter((id: string) => !keep.includes(id)); if (stale.length) { const result = await supabase.from("prospect_records").delete().in("id", stale); if (result.error) throw result.error; } }
  if (recordRows.length) { const { error } = await supabase.from("prospect_records").upsert(recordRows); if (error) throw error; }
  const { data: existingCadence, error: cadenceReadError } = await supabase.from("cadence_blocks").select("id").eq("workspace_id", workspaceId); if (cadenceReadError) throw cadenceReadError; const cadenceIds = cadenceBlocks.map((block: any) => block.id); const staleCadence = (existingCadence ?? []).map((row: any) => row.id).filter((id: string) => !cadenceIds.includes(id)); if (staleCadence.length) { const result = await supabase.from("cadence_blocks").delete().in("id", staleCadence); if (result.error) throw result.error; } if (cadenceBlocks.length) { const result = await supabase.from("cadence_blocks").upsert(cadenceBlocks.map((block: any, position: number) => ({ id: block.id, workspace_id: workspaceId, day: block.day, slot: block.slot, title: block.title, channel: block.channel, notes: block.notes, position, updated_at: new Date().toISOString() }))); if (result.error) throw result.error; }
  const { data: existingFinance, error: financeReadError } = await supabase.from("finance_entries").select("id").eq("workspace_id", workspaceId); if (financeReadError) throw financeReadError; const financeIds = financeEntries.map((entry: any) => entry.id); const staleFinance = (existingFinance ?? []).map((row: any) => row.id).filter((id: string) => !financeIds.includes(id)); if (staleFinance.length) { const result = await supabase.from("finance_entries").delete().in("id", staleFinance); if (result.error) throw result.error; } if (financeEntries.length) { const result = await supabase.from("finance_entries").upsert(financeEntries.map((entry: any, position: number) => ({ id: entry.id, workspace_id: workspaceId, expense: entry.expense, amount: entry.amount, installment: entry.installment, due_date: entry.dueDate || null, notes: entry.notes, position, updated_at: new Date().toISOString() }))); if (result.error) throw result.error; }
  return { ok: true as const };
}
