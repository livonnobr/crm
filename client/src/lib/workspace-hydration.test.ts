import { describe, expect, it } from "vitest";
import { snapshotHasPersistedData } from "./workspace-hydration";

describe("snapshotHasPersistedData", () => {
  it("mantém o estado local quando o workspace autenticado ainda não tem registros", () => {
    expect(snapshotHasPersistedData({
      goals: [],
      funnels: [],
      stages: [],
      opportunities: [],
      prospectLists: [],
      prospectRecords: [],
      cadenceBlocks: [],
      financeEntries: [],
    })).toBe(false);
  });

  it("hidrata o estado quando o Supabase já possui ao menos um registro", () => {
    expect(snapshotHasPersistedData({ funnels: [{ id: "funnel-1" }] })).toBe(true);
    expect(snapshotHasPersistedData({ goals: [{ id: "goal-1" }] })).toBe(true);
  });
});
