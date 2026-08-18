import { describe, expect, it } from "vitest";
import { projectFunnelStages, reorderFunnelStages, type FunnelStageLike } from "./funnel-utils";

const stages: FunnelStageLike[] = [
  { id: "entrada", name: "Entrada", probability: 100 },
  { id: "reuniao", name: "Reunião", probability: 50 },
  { id: "ganho", name: "Ganho", probability: 20 },
];

describe("funnel utils", () => {
  it("reorders a stage into the target position", () => {
    expect(reorderFunnelStages(stages, "ganho", "reuniao").map((stage) => stage.id)).toEqual(["entrada", "ganho", "reuniao"]);
  });

  it("keeps the original list when ids are invalid", () => {
    expect(reorderFunnelStages(stages, "missing", "reuniao")).toBe(stages);
  });

  it("starts projection from the second stage", () => {
    const projections = projectFunnelStages(stages, 120, { reuniao: 50, ganho: 20 }, (stage) => stage.id === "ganho", () => false);
    expect(projections.map(({ stage }) => stage.id)).toEqual(["reuniao", "ganho"]);
    expect(projections.map(({ projected }) => projected)).toEqual([60, 12]);
  });
});
