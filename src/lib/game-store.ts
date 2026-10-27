import { createInitialGameState } from "./game";
import {
  clearSavedGame,
  loadSavedGame,
  saveGame,
  type SaveIssue,
} from "./save";
import type { GameState } from "../types/game";

export type GameStoreSnapshot = {
  game: GameState | null;
  loadIssue: SaveIssue | null;
  saveIssue: SaveIssue | null;
};

const SERVER_SNAPSHOT: GameStoreSnapshot = {
  game: null,
  loadIssue: null,
  saveIssue: null,
};

let browserSnapshot = SERVER_SNAPSHOT;
let isInitialized = false;
const listeners = new Set<() => void>();

export function getGameSnapshot(): GameStoreSnapshot {
  if (typeof window === "undefined") {
    return SERVER_SNAPSHOT;
  }

  if (!isInitialized) {
    const result = loadSavedGame();

    browserSnapshot = {
      game: result.state,
      loadIssue: result.issue,
      saveIssue: result.issue === "unavailable" ? "unavailable" : null,
    };
    isInitialized = true;
  }

  return browserSnapshot;
}

export function getServerGameSnapshot(): GameStoreSnapshot {
  return SERVER_SNAPSHOT;
}

export function subscribeToGame(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function updateGameState(
  update: (current: GameState) => GameState,
): void {
  const current = getGameSnapshot();

  if (!current.game) {
    return;
  }

  const next = update(current.game);

  if (next === current.game) {
    return;
  }

  const result = saveGame(next);

  browserSnapshot = {
    ...current,
    game: next,
    saveIssue: result.ok ? null : "unavailable",
  };
  notifySubscribers();
}

export function resetGameStore(): void {
  const current = getGameSnapshot();

  if (!current.game) {
    return;
  }

  clearSavedGame();
  const game = createInitialGameState();
  const result = saveGame(game);

  browserSnapshot = {
    game,
    loadIssue: null,
    saveIssue: result.ok ? null : "unavailable",
  };
  notifySubscribers();
}

function notifySubscribers(): void {
  listeners.forEach((listener) => listener());
}
