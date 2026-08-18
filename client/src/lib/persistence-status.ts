export type PersistenceStatus = "local" | "cloud";

export function persistenceStatus(isConfirmed: boolean): PersistenceStatus {
  return isConfirmed ? "cloud" : "local";
}

export function persistenceLabel(isConfirmed: boolean): string {
  return persistenceStatus(isConfirmed) === "cloud"
    ? "Sincronizado automaticamente"
    : "Edição local";
}

export function persistenceActionLabel(_isConfirmed: boolean): string {
  return "Sincronização automática";
}
