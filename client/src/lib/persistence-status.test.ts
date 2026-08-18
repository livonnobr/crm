import { describe, expect, it } from "vitest";
import { persistenceActionLabel, persistenceLabel, persistenceStatus } from "./persistence-status";

describe("persistence status", () => {
  it("treats an explicit successful confirmation as cloud-synced", () => {
    expect(persistenceStatus(true)).toBe("cloud");
    expect(persistenceLabel(true)).toBe("Sincronizado automaticamente");
    expect(persistenceActionLabel(true)).toBe("Sincronização automática");
  });

  it("keeps the status pending until a successful write is confirmed", () => {
    expect(persistenceStatus(false)).toBe("local");
    expect(persistenceLabel(false)).toBe("Sincronização pendente");
    expect(persistenceActionLabel(false)).toBe("Sincronização automática");
  });
});
