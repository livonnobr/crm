export type FunnelStageLike = {
  id: string;
  name: string;
  probability: number;
};

export type FunnelProjection<T extends FunnelStageLike = FunnelStageLike> = {
  stage: T;
  rate: number;
  projected: number;
};

export function reorderFunnelStages<T extends FunnelStageLike>(stages: T[], sourceId: string, targetId: string) {
  if (sourceId === targetId) return stages;
  const next = [...stages];
  const sourceIndex = next.findIndex((stage) => stage.id === sourceId);
  const targetIndex = next.findIndex((stage) => stage.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0) return stages;
  const [moved] = next.splice(sourceIndex, 1);
  next.splice(targetIndex, 0, moved);
  return next;
}

export function projectFunnelStages<T extends FunnelStageLike>(stages: T[], leads: number, rates: Record<string, number | undefined>, isWon: (stage: T) => boolean, isLost: (stage: T) => boolean): FunnelProjection<T>[] {
  const simulatorStages = stages
    .filter((stage, index) => index > 0 && !isLost(stage))
    .sort((left, right) => Number(isWon(left)) - Number(isWon(right)));
  let enteringStage = Math.max(0, Number(leads) || 0);
  return simulatorStages.map((stage) => {
    const rate = Math.min(100, Math.max(0, Number(rates[stage.id] ?? stage.probability) || 0));
    const projected = enteringStage * (rate / 100);
    enteringStage = projected;
    return { stage, rate, projected };
  });
}
