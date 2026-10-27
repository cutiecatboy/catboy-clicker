import assert from "node:assert/strict";
import test from "node:test";
import {
  accruePassiveIncome,
  calculateGameStats,
  clickCatboy,
  createInitialGameState,
  getUpgradeCost,
  purchaseUpgrade,
} from "./game.ts";
import {
  clearSavedGame,
  loadSavedGame,
  parseSavedGame,
  saveGame,
} from "./save.ts";

test("the first click earns one snack and increments the lifetime total", () => {
  const game = clickCatboy(createInitialGameState());

  assert.equal(game.snacks, 1);
  assert.equal(game.totalSnacksEarned, 1);
});

test("upgrade purchases deduct the current price and improve derived stats", () => {
  const result = purchaseUpgrade(
    { ...createInitialGameState(), snacks: 15 },
    "paw-training",
  );

  assert.equal(result.ok, true);

  if (!result.ok) {
    assert.fail("Paw Training should be affordable with 15 snacks.");
  }

  assert.equal(result.cost, 15);
  assert.equal(result.state.snacks, 0);
  assert.equal(result.state.upgradesOwned["paw-training"], 1);
  assert.deepEqual(calculateGameStats(result.state), {
    clickPower: 2,
    snacksPerSecond: 0,
  });
  assert.equal(getUpgradeCost("paw-training", 1), 17);
});

test("passive income applies every owned income upgrade to the lifetime total", () => {
  const state = {
    ...createInitialGameState(),
    snacks: 2,
    totalSnacksEarned: 2,
    upgradesOwned: {
      ...createInitialGameState().upgradesOwned,
      "automatic-feeder": 1,
      "neko-assistant": 1,
    },
  };

  assert.deepEqual(calculateGameStats(state), {
    clickPower: 1,
    snacksPerSecond: 6,
  });

  const game = accruePassiveIncome(state, 3);

  assert.equal(game.snacks, 20);
  assert.equal(game.totalSnacksEarned, 20);
});

test("unaffordable upgrades do not change the game state", () => {
  const state = createInitialGameState();
  const result = purchaseUpgrade(state, "automatic-feeder");

  assert.deepEqual(result, {
    ok: false,
    reason: "insufficient-snacks",
    cost: 50,
  });
  assert.equal(state.snacks, 0);
  assert.equal(state.upgradesOwned["automatic-feeder"], 0);
});

test("saved games are restored only when their data matches the expected shape", () => {
  const state = {
    ...createInitialGameState(),
    snacks: 12,
    totalSnacksEarned: 12,
    lastSavedAt: 100,
  };
  const valid = parseSavedGame(JSON.stringify({ version: 1, state }));
  const invalidJson = parseSavedGame("{");
  const invalidState = parseSavedGame(
    JSON.stringify({
      version: 1,
      state: { ...state, snacks: -1 },
    }),
  );
  const inconsistentTotals = parseSavedGame(
    JSON.stringify({
      version: 1,
      state: { ...state, snacks: 13, totalSnacksEarned: 12 },
    }),
  );

  assert.deepEqual(valid, { state, issue: null });
  assert.equal(invalidJson.issue, "invalid");
  assert.equal(invalidJson.state.snacks, 0);
  assert.equal(invalidState.issue, "invalid");
  assert.equal(inconsistentTotals.issue, "invalid");
});

test("passive income rejects negative or non-finite elapsed time", () => {
  const game = createInitialGameState();

  assert.throws(() => accruePassiveIncome(game, -1), RangeError);
  assert.throws(() => accruePassiveIncome(game, Number.NaN), RangeError);
});

test("browser saves restore progress and reset only the game save", () => {
  const savedValues = new Map<string, string>();
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => savedValues.get(key) ?? null,
        setItem: (key: string, value: string) => savedValues.set(key, value),
        removeItem: (key: string) => savedValues.delete(key),
      },
    },
  });

  try {
    const game = {
      ...createInitialGameState(),
      snacks: 42,
      totalSnacksEarned: 42,
    };

    assert.deepEqual(saveGame(game), { ok: true });

    const loaded = loadSavedGame();

    assert.equal(loaded.issue, null);
    assert.equal(loaded.state.snacks, 42);
    assert.equal(loaded.state.totalSnacksEarned, 42);
    assert.ok(loaded.state.lastSavedAt > 0);

    assert.deepEqual(clearSavedGame(), { ok: true });
    assert.equal(loadSavedGame().state.snacks, 0);
  } finally {
    if (previousWindow) {
      Object.defineProperty(globalThis, "window", previousWindow);
    } else {
      Reflect.deleteProperty(globalThis, "window");
    }
  }
});
