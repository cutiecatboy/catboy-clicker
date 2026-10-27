"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type MouseEvent,
} from "react";
import {
  UPGRADE_DEFINITIONS,
  accruePassiveIncome,
  calculateGameStats,
  canPurchaseUpgrade,
  clickCatboy,
  getUpgradeCost,
  purchaseUpgrade,
} from "@/lib/game";
import {
  getGameSnapshot,
  getServerGameSnapshot,
  resetGameStore,
  subscribeToGame,
  updateGameState,
} from "@/lib/game-store";
import type { UpgradeId } from "@/types/game";

type ClickFeedback = {
  id: number;
  amount: number;
  x: number;
  y: number;
};

const EMPTY_STATS = { clickPower: 1, snacksPerSecond: 0 };

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export default function ClickerGame() {
  const snapshot = useSyncExternalStore(
    subscribeToGame,
    getGameSnapshot,
    getServerGameSnapshot,
  );
  const game = snapshot.game;
  const storageIssue =
    snapshot.saveIssue === "unavailable"
      ? "Browser storage is unavailable. Progress may not survive a reload."
      : null;
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const [clickFeedback, setClickFeedback] = useState<ClickFeedback[]>([]);
  const stageRef = useRef<HTMLDivElement>(null);
  const nextFeedbackId = useRef(0);
  const stats = game ? calculateGameStats(game) : EMPTY_STATS;
  const saveNoticeText =
    saveNotice ??
    (!noticeDismissed && snapshot.loadIssue === "invalid"
      ? "Your old save could not be read, so a fresh game has started."
      : null);

  useEffect(() => {
    if (!game || stats.snacksPerSecond === 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      updateGameState((current) => accruePassiveIncome(current));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [game, stats.snacksPerSecond]);

  function handleCatClick(event: MouseEvent<HTMLButtonElement>) {
    if (!game) {
      return;
    }

    const stage = stageRef.current;

    if (stage) {
      const bounds = stage.getBoundingClientRect();
      const pointerX =
        event.clientX === 0 ? bounds.width / 2 : event.clientX - bounds.left;
      const pointerY =
        event.clientY === 0 ? bounds.height * 0.36 : event.clientY - bounds.top;

      setClickFeedback((current) => [
        ...current,
        {
          id: nextFeedbackId.current++,
          amount: stats.clickPower,
          x: Math.max(12, Math.min(pointerX, bounds.width - 12)),
          y: Math.max(12, Math.min(pointerY, bounds.height - 12)),
        },
      ].slice(-8));
    }

    updateGameState((current) => clickCatboy(current));
  }

  function handlePurchase(id: UpgradeId) {
    updateGameState((current) => {
      const result = purchaseUpgrade(current, id);

      return result.ok ? result.state : current;
    });
  }

  function handleReset() {
    if (!window.confirm("Start over? Your current snack jar and upgrades will be reset.")) {
      return;
    }

    resetGameStore();
    setSaveNotice("A fresh game is ready. Give Kaito a little pat to begin.");
    setNoticeDismissed(false);
  }

  function handleMotionToggle() {
    updateGameState((current) => ({
      ...current,
      reducedMotion: !current.reducedMotion,
    }));
  }

  return (
    <div className={`game-page${game?.reducedMotion ? " motion-reduced" : ""}`}>
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />

      <div className="page-container">
        <header className="topbar">
          <Link className="brand" href="/" aria-label="Catboy Clicker home">
            <span className="brand-mark" aria-hidden="true">
              <span>✦</span>
            </span>
            <span className="brand-name">
              catboy<span>clicker</span>
            </span>
          </Link>

          <div className="topbar-actions">
            <div className={`save-status${storageIssue ? " has-issue" : ""}`}>
              <span className="save-status-dot" aria-hidden="true" />
              <span>
                {storageIssue ??
                  (game
                    ? snapshot.loadIssue === "invalid"
                      ? "Fresh game started"
                      : "Progress saved locally"
                    : "Loading your save")}
              </span>
            </div>
            <button
              className="motion-toggle"
              type="button"
              aria-pressed={game?.reducedMotion ?? false}
              disabled={!game}
              onClick={handleMotionToggle}
            >
              <span aria-hidden="true">◌</span>
              Motion {game?.reducedMotion ? "off" : "on"}
            </button>
            <button
              className="reset-button"
              type="button"
              disabled={!game}
              onClick={handleReset}
            >
              Reset game
            </button>
          </div>
        </header>

        {saveNoticeText && (
          <div className="save-notice" role="status">
            <span>{saveNoticeText}</span>
            <button
              type="button"
              aria-label="Dismiss message"
              onClick={() => {
                setSaveNotice(null);
                setNoticeDismissed(true);
              }}
            >
              ×
            </button>
          </div>
        )}

        <section className="intro-banner" aria-labelledby="page-title">
          <div className="intro-copy">
            <p className="eyebrow">
              <span className="eyebrow-sparkle" aria-hidden="true">✦</span>
              COZY CLICKER <span className="eyebrow-divider">/</span> NO. 01
            </p>
            <h1 id="page-title">
              Small pats.
              <br />
              <span>Big snack energy.</span>
            </h1>
            <p className="intro-description">
              Keep your favorite catboy company, fill the snack jar, and make
              every little click count.
            </p>
          </div>
          <div className="session-card">
            <span className="session-icon" aria-hidden="true">♡</span>
            <div>
              <p>YOUR LITTLE CORNER</p>
              <strong>Take it at your own pace.</strong>
            </div>
          </div>
        </section>

        {storageIssue && (
          <div className="storage-warning" role="alert">
            <span className="warning-icon" aria-hidden="true">!</span>
            <span>{storageIssue}</span>
          </div>
        )}

        <main className="game-grid">
          <section className="companion-panel" aria-labelledby="companion-heading">
            <div className="panel-heading">
              <div>
                <p className="panel-eyebrow">YOUR COMPANION</p>
                <h2 id="companion-heading">A little quality time</h2>
              </div>
              <span className="companion-tag">
                <span className="online-dot" aria-hidden="true" />
                Bestie #01
              </span>
            </div>

            <div className="wallet-card">
              <div className="wallet-copy">
                <span className="wallet-label">YOUR SNACK JAR</span>
                <strong className="wallet-count">
                  {game ? formatNumber(game.snacks) : "—"}
                </strong>
                <span className="wallet-caption">fish snacks ready to spend</span>
              </div>
              <span className="wallet-art" aria-hidden="true">
                <span className="wallet-fish">🐟</span>
                <span className="wallet-sparkle">✦</span>
              </span>
            </div>

            <div className="character-stage" ref={stageRef}>
              <div className="stage-halo" aria-hidden="true" />
              <span className="stage-note stage-note-left" aria-hidden="true">♡</span>
              <span className="stage-note stage-note-right" aria-hidden="true">✦</span>
              <button
                className="catboy-button"
                type="button"
                aria-label={`Pet Kaito to earn ${stats.clickPower} ${stats.clickPower === 1 ? "fish snack" : "fish snacks"}`}
                disabled={!game}
                onClick={handleCatClick}
              >
                <svg
                  className="catboy-art"
                  viewBox="0 0 360 420"
                  role="img"
                  aria-label="Kaito, a smiling catboy with lavender hair and cat ears"
                >
                  <defs>
                    <linearGradient id="hoodie-fill" x1="0" x2="1" y1="0" y2="1">
                      <stop offset="0" stopColor="#9b74dc" />
                      <stop offset="1" stopColor="#57407f" />
                    </linearGradient>
                    <linearGradient id="hair-fill" x1="0" x2="1" y1="0" y2="1">
                      <stop offset="0" stopColor="#8573b9" />
                      <stop offset="1" stopColor="#433557" />
                    </linearGradient>
                    <linearGradient id="eye-fill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0" stopColor="#c496fb" />
                      <stop offset="1" stopColor="#754eb2" />
                    </linearGradient>
                  </defs>
                  <ellipse cx="180" cy="390" rx="115" ry="17" fill="#100c1c" opacity=".42" />
                  <path
                    d="M56 389c7-62 36-92 82-105l42-12 42 12c46 13 75 43 82 105H56Z"
                    fill="url(#hoodie-fill)"
                  />
                  <path d="m137 287 43 35 43-35-20-32h-46l-20 32Z" fill="#f3c9d5" />
                  <path d="m136 287 44 35-24 43-49-69 29-9Zm88 0-44 35 24 43 49-69-29-9Z" fill="#c6a9ec" />
                  <path d="M104 388c7-41 22-69 51-84l25 30 25-30c29 15 44 43 51 84H104Z" fill="#342740" opacity=".68" />
                  <path d="M90 140 71 48c-2-10 8-16 16-9l71 64-68 37Zm180 0 19-92c2-10-8-16-16-9l-71 64 68 37Z" fill="#49395f" />
                  <path d="m99 116-12-47 41 37-29 10Zm162 0 12-47-41 37 29 10Z" fill="#e8a9c5" />
                  <path
                    d="M93 159c-5-58 27-93 87-93s92 35 87 93l-7 54c-5 39-35 68-80 68s-75-29-80-68l-7-54Z"
                    fill="url(#hair-fill)"
                  />
                  <path d="M119 144c0-34 25-58 61-58s61 24 61 58v58c0 38-25 66-61 66s-61-28-61-66v-58Z" fill="#f1cbd2" />
                  <path d="M110 158c-8-50 13-84 47-99 31-14 73-3 91 23 14 21 15 46 8 73-9-6-16-16-20-29-17 16-34 22-51 20-15-1-26-8-36-17-10 18-22 28-39 29Z" fill="#30263f" />
                  <path d="M113 164c-5 29-5 55 5 78-22-12-33-36-31-68 1-19 8-39 21-55l5 45Zm134-8c11 21 13 49 3 81 20-14 29-40 23-68-4-19-12-35-27-48l1 35Z" fill="#49395f" />
                  <path d="M135 178c8-7 18-8 27-2m37 0c9-6 19-5 27 2" fill="none" stroke="#48344e" strokeLinecap="round" strokeWidth="4" />
                  <ellipse cx="148" cy="193" rx="9" ry="13" fill="url(#eye-fill)" />
                  <ellipse cx="212" cy="193" rx="9" ry="13" fill="url(#eye-fill)" />
                  <ellipse cx="150" cy="194" rx="3" ry="7" fill="#282137" />
                  <ellipse cx="214" cy="194" rx="3" ry="7" fill="#282137" />
                  <circle cx="151" cy="189" r="2.5" fill="#fff" />
                  <circle cx="215" cy="189" r="2.5" fill="#fff" />
                  <ellipse cx="128" cy="217" rx="13" ry="6" fill="#ed9eae" opacity=".38" />
                  <ellipse cx="232" cy="217" rx="13" ry="6" fill="#ed9eae" opacity=".38" />
                  <path d="m176 218 4 3 4-3" fill="none" stroke="#a76b84" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                  <path d="M169 231c7 8 15 8 22 0" fill="none" stroke="#8e5876" strokeLinecap="round" strokeWidth="3" />
                  <path d="M105 145c15-5 27-14 35-28 15 14 33 21 54 19 14-1 26-7 39-17 5 12 13 21 24 27 2-38-9-65-32-82-28-21-76-18-101 8-17 18-23 42-19 73Z" fill="#423452" />
                  <path d="M150 82c12 20 30 28 53 24 12-2 22-7 32-16-12 25-31 38-56 39-19 1-36-6-50-21 4-11 11-20 21-26Z" fill="#716091" opacity=".72" />
                  <path d="M88 166c-6 27-3 50 8 67m177-66c7 27 4 50-7 67" fill="none" stroke="#947bb7" strokeLinecap="round" strokeWidth="4" opacity=".56" />
                  <path d="M142 325h76" fill="none" stroke="#d8c0f2" strokeLinecap="round" strokeWidth="4" opacity=".65" />
                  <circle cx="180" cy="349" r="9" fill="#f4c3dc" />
                  <path d="M180 344v10m-5-5h10" stroke="#85568e" strokeLinecap="round" strokeWidth="2" />
                </svg>
              </button>
              {clickFeedback.map((feedback) => (
                <span
                  className="floating-snack"
                  key={feedback.id}
                  style={{ left: feedback.x, top: feedback.y }}
                  aria-hidden="true"
                  onAnimationEnd={() =>
                    setClickFeedback((current) =>
                      current.filter((item) => item.id !== feedback.id),
                    )
                  }
                >
                  +{formatCompactNumber(feedback.amount)}
                </span>
              ))}
              <div className="stage-caption" aria-hidden="true">
                <span className="caption-dot" />
                VERY PETTABLE
              </div>
            </div>

            <div className="companion-caption">
              <div>
                <h3>Kaito</h3>
                <p>Your favorite snack-loving catboy</p>
              </div>
              <span className="mood-pill">
                <span aria-hidden="true">♡</span>
                in a good mood
              </span>
            </div>

            <button
              className="pat-prompt"
              type="button"
              disabled={!game}
              onClick={handleCatClick}
            >
              <span className="pat-prompt-icon" aria-hidden="true">✧</span>
              <span>Give Kaito a pat</span>
              <span className="pat-prompt-value">
                +{formatNumber(stats.clickPower)} {stats.clickPower === 1 ? "snack" : "snacks"}
              </span>
              <span className="pat-prompt-arrow" aria-hidden="true">↗</span>
            </button>

            <div className="stats-row" aria-label="Game stats">
              <div className="stat-cell">
                <span className="stat-label">PER CLICK</span>
                <strong>{formatNumber(stats.clickPower)}</strong>
                <span className="stat-unit">snacks</span>
              </div>
              <div className="stat-cell">
                <span className="stat-label">PER SECOND</span>
                <strong>{formatNumber(stats.snacksPerSecond)}</strong>
                <span className="stat-unit">snacks</span>
              </div>
              <div className="stat-cell">
                <span className="stat-label">ALL-TIME</span>
                <strong>{game ? formatCompactNumber(game.totalSnacksEarned) : "—"}</strong>
                <span className="stat-unit">collected</span>
              </div>
            </div>
          </section>

          <section className="shop-panel" aria-labelledby="shop-heading">
            <div className="shop-heading">
              <div>
                <p className="panel-eyebrow">A LITTLE HELP GOES A LONG WAY</p>
                <h2 id="shop-heading">The snack shop</h2>
                <p className="shop-description">
                  Tiny upgrades, happier snack times.
                </p>
              </div>
              <span className="shop-count">04 <span>ITEMS</span></span>
            </div>

            <div className="upgrade-list">
              {UPGRADE_DEFINITIONS.map((upgrade, index) => {
                const owned = game?.upgradesOwned[upgrade.id] ?? 0;
                const cost = getUpgradeCost(upgrade.id, owned);
                const canBuy = game !== null && canPurchaseUpgrade(game, upgrade.id);

                return (
                  <article className="upgrade-card" key={upgrade.id}>
                    <div className={`upgrade-icon upgrade-icon-${index + 1}`} aria-hidden="true">
                      {upgrade.icon}
                    </div>
                    <div className="upgrade-copy">
                      <div className="upgrade-title-row">
                        <h3>{upgrade.name}</h3>
                        <span className="owned-count">{owned}</span>
                      </div>
                      <p>{upgrade.description}</p>
                      <span className="upgrade-effect">{upgrade.effect}</span>
                    </div>
                    <button
                      className="upgrade-buy"
                      type="button"
                      disabled={!canBuy}
                      onClick={() => handlePurchase(upgrade.id)}
                      aria-label={`Buy ${upgrade.name} for ${formatNumber(cost)} ${cost === 1 ? "snack" : "snacks"}`}
                    >
                      <span>BUY</span>
                      <strong>{formatNumber(cost)}</strong>
                    </button>
                  </article>
                );
              })}
            </div>

            <div className="shop-tip">
              <span className="tip-star" aria-hidden="true">✦</span>
              <p>
                <strong>Little tip</strong>
                <span>Automatic helpers keep collecting while you hang out.</span>
              </p>
            </div>
            <p className="save-footnote">
              <span className="save-footnote-icon" aria-hidden="true">⌁</span>
              Your game saves automatically in this browser.
            </p>
          </section>
        </main>

        <footer className="page-footer">
          <span>Made for slow days &amp; soft hearts.</span>
          <span>CATBOY CLICKER <span className="footer-separator">·</span> 01</span>
        </footer>
      </div>
    </div>
  );
}
