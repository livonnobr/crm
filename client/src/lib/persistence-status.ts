export type PersistenceStatus = "local" | "cloud";

export function persistenceStatus(isConfirmed: boolean): PersistenceStatus {
  return isConfirmed ? "cloud" : "local";
}

export function persistenceLabel(isConfirmed: boolean): string {
  return persistenceStatus(isConfirmed) === "cloud"
    ? "Sincronizado automaticamente"
    : "Sincronização pendente";
}

export function persistenceActionLabel(_isConfirmed: boolean): string {
  return "Sincronização automática";
}
