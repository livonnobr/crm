import { describe, expect, it } from "vitest";
import { persistenceActionLabel, persistenceLabel, persistenceStatus } from "./persistence-status";

describe("persistence status", () => {
  it("treats a workspace id as cloud-synced", () => {
    expect(persistenceStatus("workspace-123")).toBe("cloud");
    expect(persistenceLabel("workspace-123")).toBe("Sincronizado com o Supabase");
    expect(persistenceActionLabel("workspace-123")).toBe("Salvar");
  });

  it("treats a missing workspace as local-only", () => {
    expect(persistenceStatus(null)).toBe("local");
    expect(persistenceLabel(null)).toContain("Rascunho local");
    expect(persistenceActionLabel(null)).toBe("Salvar no Supabase");
  });
});
