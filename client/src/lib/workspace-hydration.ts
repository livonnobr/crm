export type WorkspaceSnapshotPayload = {
  goals?: unknown[];
  funnels?: unknown[];
  stages?: unknown[];
  opportunities?: unknown[];
  prospectLists?: unknown[];
  prospectRecords?: unknown[];
  cadenceBlocks?: unknown[];
  financeEntries?: unknown[];
  services?: unknown[];
  goalSimulationStages?: unknown[];
};

/**
 * Um workspace recém-criado retorna coleções vazias. Nesse caso, o cliente
 * mantém os dados locais atuais e deixa o sync inicial gravá-los no Supabase,
 * em vez de substituir o estado por arrays vazios.
 */
export function snapshotHasPersistedData(snapshot: WorkspaceSnapshotPayload | null | undefined) {
  if (!snapshot) return false;

  return [
    snapshot.goals,
    snapshot.funnels,
    snapshot.stages,
    snapshot.opportunities,
    snapshot.prospectLists,
    snapshot.prospectRecords,
    snapshot.cadenceBlocks,
    snapshot.financeEntries,
    snapshot.services,
    snapshot.goalSimulationStages,
  ].some((collection) => Array.isArray(collection) && collection.length > 0);
}
