import type { GameState, GameStats, UpgradeDefinition, UpgradeId } from "../types/game";

export const UPGRADE_DEFINITIONS: readonly UpgradeDefinition[] = [
  {
    id: "paw-training",
    name: "Paw Training",
    description: "A little practice makes every pat count.",
    effect: "+1 snack per click",
    icon: "✦",
    baseCost: 15,
    clickPowerBonus: 1,
    snacksPerSecondBonus: 0,
  },
  {
    id: "automatic-feeder",
    name: "Automatic Feeder",
    description: "A reliable bowl that never misses snack time.",
    effect: "+1 snack per second",
    icon: "◌",
    baseCost: 50,
    clickPowerBonus: 0,
    snacksPerSecondBonus: 1,
  },
  {
    id: "neko-assistant",
    name: "Neko Assistant",
    description: "A helpful friend keeps the treats coming.",
    effect: "+5 snacks per second",
    icon: "♡",
    baseCost: 250,
    clickPowerBonus: 0,
    snacksPerSecondBonus: 5,
  },
  {
    id: "golden-bell",
    name: "Golden Bell",
    description: "One happy ring brings a generous handful.",
    effect: "+5 snacks per click",
    icon: "♢",
    baseCost: 500,
    clickPowerBonus: 5,
    snacksPerSecondBonus: 0,
  },
];

const MAX_RESOURCE = Number.MAX_SAFE_INTEGER;
const PRICE_MULTIPLIER = 1.18;

export function createInitialGameState(): GameState {
  return {
    snacks: 0,
    totalSnacksEarned: 0,
    upgradesOwned: {
      "paw-training": 0,
      "automatic-feeder": 0,
      "neko-assistant": 0,
      "golden-bell": 0,
    },
    lastSavedAt: 0,
    reducedMotion: false,
  };
}

export function getUpgradeCost(id: UpgradeId, owned: number): number {
  if (!Number.isSafeInteger(owned) || owned < 0) {
    throw new RangeError("Upgrade ownership must be a non-negative safe integer.");
  }

  const definition = UPGRADE_DEFINITIONS.find((upgrade) => upgrade.id === id);

  if (!definition) {
    throw new RangeError(`Unknown upgrade: ${id}`);
  }

  const cost = Math.floor(definition.baseCost * PRICE_MULTIPLIER ** owned);

  return Number.isSafeInteger(cost) ? cost : MAX_RESOURCE;
}

export function calculateGameStats(state: GameState): GameStats {
  return UPGRADE_DEFINITIONS.reduce(
    (stats, upgrade) => {
      const owned = state.upgradesOwned[upgrade.id];

      return {
        clickPower: capResource(
          stats.clickPower + owned * upgrade.clickPowerBonus,
        ),
        snacksPerSecond: capResource(
          stats.snacksPerSecond + owned * upgrade.snacksPerSecondBonus,
        ),
      };
    },
    { clickPower: 1, snacksPerSecond: 0 },
  );
}

export function clickCatboy(state: GameState): GameState {
  return earnSnacks(state, calculateGameStats(state).clickPower);
}

export function accruePassiveIncome(
  state: GameState,
  elapsedSeconds = 1,
): GameState {
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds < 0) {
    throw new RangeError("Elapsed time must be a finite, non-negative number.");
  }

  const amount = Math.floor(
    calculateGameStats(state).snacksPerSecond * elapsedSeconds,
  );

  return amount > 0 ? earnSnacks(state, capResource(amount)) : state;
}

export function canPurchaseUpgrade(state: GameState, id: UpgradeId): boolean {
  const owned = state.upgradesOwned[id];

  return (
    owned < MAX_RESOURCE &&
    state.snacks >= getUpgradeCost(id, owned)
  );
}

export type PurchaseUpgradeResult =
  | { ok: true; state: GameState; cost: number }
  | {
      ok: false;
      reason: "insufficient-snacks" | "maximum-level";
      cost: number;
    };

export function purchaseUpgrade(
  state: GameState,
  id: UpgradeId,
): PurchaseUpgradeResult {
  const owned = state.upgradesOwned[id];
  const cost = getUpgradeCost(id, owned);

  if (owned >= MAX_RESOURCE) {
    return { ok: false, reason: "maximum-level", cost };
  }

  if (state.snacks < cost) {
    return { ok: false, reason: "insufficient-snacks", cost };
  }

  return {
    ok: true,
    cost,
    state: {
      ...state,
      snacks: state.snacks - cost,
      upgradesOwned: {
        ...state.upgradesOwned,
        [id]: owned + 1,
      },
    },
  };
}

function earnSnacks(state: GameState, amount: number): GameState {
  return {
    ...state,
    snacks: capResource(state.snacks + amount),
    totalSnacksEarned: capResource(state.totalSnacksEarned + amount),
  };
}

function capResource(value: number): number {
  return Number.isFinite(value) ? Math.min(MAX_RESOURCE, Math.floor(value)) : MAX_RESOURCE;
}
