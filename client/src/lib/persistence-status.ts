export type PersistenceStatus = "local" | "cloud";

export function persistenceStatus(workspaceId: string | null | undefined): PersistenceStatus {
  return workspaceId ? "cloud" : "local";
}

export function persistenceLabel(workspaceId: string | null | undefined): string {
  return persistenceStatus(workspaceId) === "cloud"
    ? "Sincronizado automaticamente"
    : "Sincronização pendente";
}

export function persistenceActionLabel(workspaceId: string | null | undefined): string {
  return "Sincronização automática";
}
