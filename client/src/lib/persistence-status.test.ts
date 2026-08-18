import { describe, expect, it } from "vitest";
import { persistenceActionLabel, persistenceLabel, persistenceStatus } from "./persistence-status";

describe("persistence status", () => {
  it("treats a workspace id as cloud-synced", () => {
    expect(persistenceStatus("workspace-123")).toBe("cloud");
    expect(persistenceLabel("workspace-123")).toBe("Sincronizado automaticamente");
    expect(persistenceActionLabel("workspace-123")).toBe("Sincronização automática");
  });

  it("treats a missing workspace as local-only", () => {
    expect(persistenceStatus(null)).toBe("local");
    expect(persistenceLabel(null)).toBe("Sincronização pendente");
    expect(persistenceActionLabel(null)).toBe("Sincronização automática");
  });
});
