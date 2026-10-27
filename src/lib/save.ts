import { createInitialGameState } from "./game.ts";
import { UPGRADE_IDS, type GameState } from "../types/game.ts";

const SAVE_KEY = "catboy-clicker-save";
const SAVE_VERSION = 1;

export type SaveIssue = "invalid" | "unavailable";

export type LoadGameResult = {
  state: GameState;
  issue: SaveIssue | null;
};

export type StorageResult = { ok: true } | { ok: false };

export function parseSavedGame(serialized: string | null): LoadGameResult {
  if (serialized === null) {
    return { state: createInitialGameState(), issue: null };
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(serialized);
  } catch {
    return { state: createInitialGameState(), issue: "invalid" };
  }

  if (
    !isRecord(parsed) ||
    parsed.version !== SAVE_VERSION ||
    !isGameState(parsed.state)
  ) {
    return { state: createInitialGameState(), issue: "invalid" };
  }

  return { state: parsed.state, issue: null };
}

export function loadSavedGame(): LoadGameResult {
  if (typeof window === "undefined") {
    return { state: createInitialGameState(), issue: "unavailable" };
  }

  let serialized: string | null;

  try {
    serialized = window.localStorage.getItem(SAVE_KEY);
  } catch {
    return { state: createInitialGameState(), issue: "unavailable" };
  }

  return parseSavedGame(serialized);
}

export function saveGame(state: GameState): StorageResult {
  if (typeof window === "undefined") {
    return { ok: false };
  }

  const serialized = JSON.stringify({
    version: SAVE_VERSION,
    state: { ...state, lastSavedAt: Date.now() },
  });

  try {
    window.localStorage.setItem(SAVE_KEY, serialized);
  } catch {
    return { ok: false };
  }

  return { ok: true };
}

export function clearSavedGame(): StorageResult {
  if (typeof window === "undefined") {
    return { ok: false };
  }

  try {
    window.localStorage.removeItem(SAVE_KEY);
  } catch {
    return { ok: false };
  }

  return { ok: true };
}

function isGameState(value: unknown): value is GameState {
  if (!isRecord(value)) {
    return false;
  }

  const upgradesOwned = value.upgradesOwned;
  const snacks = value.snacks;
  const totalSnacksEarned = value.totalSnacksEarned;

  if (
    !isNonNegativeSafeInteger(snacks) ||
    !isNonNegativeSafeInteger(totalSnacksEarned) ||
    !isNonNegativeSafeInteger(value.lastSavedAt) ||
    typeof value.reducedMotion !== "boolean" ||
    !isRecord(upgradesOwned)
  ) {
    return false;
  }

  if (totalSnacksEarned < snacks) {
    return false;
  }

  return UPGRADE_IDS.every((id) =>
    isNonNegativeSafeInteger(upgradesOwned[id]),
  );
}

function isNonNegativeSafeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && typeof value === "number" && value >= 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
