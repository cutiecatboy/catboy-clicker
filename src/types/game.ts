export const UPGRADE_IDS = [
  "paw-training",
  "automatic-feeder",
  "neko-assistant",
  "golden-bell",
] as const;

export type UpgradeId = (typeof UPGRADE_IDS)[number];

export type UpgradeDefinition = {
  id: UpgradeId;
  name: string;
  description: string;
  effect: string;
  icon: string;
  baseCost: number;
  clickPowerBonus: number;
  snacksPerSecondBonus: number;
};

export type GameState = {
  snacks: number;
  totalSnacksEarned: number;
  upgradesOwned: Record<UpgradeId, number>;
  lastSavedAt: number;
  reducedMotion: boolean;
};

export type GameStats = {
  clickPower: number;
  snacksPerSecond: number;
};
