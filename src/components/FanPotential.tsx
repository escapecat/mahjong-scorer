import { useState, useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import { TileSet } from '../engine/models/tileSet';
import { tileFromIndex, type Tile } from '../engine/models/tile';
import type { Meld } from '../engine/models/meld';
import type { GameContext } from '../engine/models/types';
import { calculateFanPotential, type FanPotential as FanPotentialItem, type MissingTile } from '../engine/fanPotential';
import { isWinningHandWithMelds } from '../engine/decomposer';
import { evaluate } from '../engine/evaluator';
import { analyzeDiscards } from '../engine/discardAnalyzer';
import styles from './FanPotential.module.css';

interface Props {
  allCounts: TileSet;
  lockedMelds: readonly Meld[];
  game: GameContext;
  /** Total tile count (13 = tenpai, 14 = need to discard) */
  totalCount: number;
  /** Expected count (14 + kongs typically) */
  expectedCount: number;
}

interface CurrentBest {
  totalFan: number;
  description: string;     // e.g., "听 9p" or "打 8m 听 7m"
  winTile?: Tile;
  discardTile?: Tile;
  waitCount?: number;      // # of distinct winning tile *types* (e.g. 3 for 1m/4m/7m)
  totalRemaining?: number; // theoretical max # of total tiles (4 - own copies) summed
}

interface CurrentBests {
  /** Best fan among winning tiles of the *top-ranked discard* (most waits → safe play). */
  stable: CurrentBest | null;
  /** Best fan across ALL (discard, win) combos (could be a 1-tile wait → bold play). */
  ambitious: CurrentBest | null;
}

const MAX_DISTANCE_TO_SHOW = 6;
const MAX_ITEMS = 8;

function rankMedal(idx: number): string {
  if (idx === 0) return '🏆';
  if (idx === 1) return '🥈';
  if (idx === 2) return '🥉';
  return '🔹';
}

function tileNameShort(t: Tile): string {
  if (t.suit === 'wind') return ['东', '南', '西', '北'][t.rank];
  if (t.suit === 'dragon') return ['中', '发', '白'][t.rank];
  const suit = t.suit === 'man' ? '万' : t.suit === 'pin' ? '筒' : '条';
  return `${t.rank + 1}${suit}`;
}

function formatMissing(missing: MissingTile[]): string {
  if (missing.length === 0) return '';
  return missing
    .map(m => m.count > 1 ? `${tileNameShort(m.tile)}×${m.count}` : tileNameShort(m.tile))
    .join(' ');
}

function tileEqualsOpt(a: Tile | undefined, b: Tile | undefined): boolean {
  if (!a || !b) return a === b;
  return a.suit === b.suit && a.rank === b.rank;
}

export function FanPotential({ allCounts, lockedMelds, game, totalCount, expectedCount }: Props) {
  const [open, setOpen] = useState(false);

  const items = useMemo<FanPotentialItem[]>(() => {
    if (!open) return [];
    return calculateFanPotential(allCounts)
      .filter(p => p.distance > 0 && p.distance <= MAX_DISTANCE_TO_SHOW)
      .slice(0, MAX_ITEMS);
  }, [open, allCounts]);

  // Compute the two current-best paths for the user to compare:
  //   stable    — best fan from the most-promising discard (most waits)
  //   ambitious — best fan across ALL (discard, win) combos (max single fan)
  // For 13-tile tenpai, we just show one banner (no discard choice).
  const currentBests = useMemo<CurrentBests>(() => {
    if (!open) return { stable: null, ambitious: null };
    const safeMelds = lockedMelds ?? [];
    const isAt14 = totalCount === expectedCount;
    const isAt13 = totalCount === expectedCount - 1;

    try {
      if (isAt14) {
        const discards = analyzeDiscards(allCounts, safeMelds, game);
        if (discards.length === 0) return { stable: null, ambitious: null };

        // Stable: scan winning tiles of the top-ranked discard (analyzeDiscards
        // already sorts by remaining/uniqueWaitCount/maxScore desc).
        const top = discards[0];
        let stable: CurrentBest | null = null;
        for (const w of top.winningTiles) {
          if (!stable || w.score > stable.totalFan) {
            stable = {
              totalFan: w.score,
              description: `打 ${tileNameShort(top.discardTile)} 听 ${tileNameShort(w.tile)}`,
              winTile: w.tile,
              discardTile: top.discardTile,
              waitCount: top.uniqueWaitCount,
              totalRemaining: top.totalRemaining,
            };
          }
        }

        // Ambitious: scan EVERY (discard, win) combo for the absolute max fan.
        let ambitious: CurrentBest | null = null;
        for (const d of discards) {
          for (const w of d.winningTiles) {
            if (!ambitious || w.score > ambitious.totalFan) {
              ambitious = {
                totalFan: w.score,
                description: `打 ${tileNameShort(d.discardTile)} 听 ${tileNameShort(w.tile)}`,
                winTile: w.tile,
                discardTile: d.discardTile,
                waitCount: d.uniqueWaitCount,
                totalRemaining: d.totalRemaining,
              };
            }
          }
        }

        return { stable, ambitious };
      }
      if (isAt13) {
        let best: CurrentBest | null = null;
        let waitCount = 0;
        let totalRemaining = 0;
        const raw = [...allCounts.rawCounts()];
        for (let i = 0; i < 34; i++) {
          if (raw[i] >= 4) continue;
          raw[i]++;
          const test = TileSet.fromCounts(raw);
          if (isWinningHandWithMelds(test, safeMelds)) {
            waitCount++;
            // remaining in wall/opponents = 4 - own pre-draw copies. raw[i] was
            // just incremented to simulate the draw, so pre-draw count = raw[i]-1.
            totalRemaining += Math.max(0, 4 - (raw[i] - 1));
            const winTile = tileFromIndex(i);
            try {
              const result = evaluate(test, safeMelds, { ...game, winningTile: winTile });
              if (!best || result.totalFan > best.totalFan) {
                best = {
                  totalFan: result.totalFan,
                  description: `听 ${tileNameShort(winTile)}`,
                  winTile,
                  waitCount: 0,        // filled below
                  totalRemaining: 0,   // filled below
                };
              }
            } catch (e) {
              // skip this winning tile if evaluation fails
            }
          }
          raw[i]--;
        }
        if (best) {
          best.waitCount = waitCount;
          best.totalRemaining = totalRemaining;
        }
        return { stable: best, ambitious: best }; // same in 13-tile mode
      }
    } catch (e) {
      console.error('FanPotential currentBests failed:', e);
    }
    return { stable: null, ambitious: null };
  }, [open, allCounts, lockedMelds, game, totalCount, expectedCount]);

  /** Same (discard, win) → only one banner needed. */
  const bestsCoincide =
    currentBests.stable && currentBests.ambitious &&
    currentBests.stable.discardTile && currentBests.ambitious.discardTile &&
    tileEqualsOpt(currentBests.stable.discardTile, currentBests.ambitious.discardTile) &&
    tileEqualsOpt(currentBests.stable.winTile, currentBests.ambitious.winTile);

  return (
    <View className={open ? styles.container : styles.containerCollapsed}>
      <View className={styles.header} onClick={() => setOpen(!open)}>
        <Text className={styles.title}>🏆 番数潜力</Text>
        <Text className={styles.toggleArrow}>{open ? '收起 ▾' : '展开 ▸'}</Text>
      </View>

      {open && (
        <>
          {bestsCoincide && currentBests.stable && (
            <View className={styles.currentBest}>
              <Text className={styles.currentBestLabel}>📌 当前最优</Text>
              <Text className={styles.currentBestText}>
                {currentBests.stable.description}
                {currentBests.stable.waitCount && currentBests.stable.waitCount > 0
                  ? ` / 听 ${currentBests.stable.waitCount} 种(共 ${currentBests.stable.totalRemaining ?? 0} 张)`
                  : ''}
              </Text>
              <Text className={styles.currentBestFan}>{currentBests.stable.totalFan}番</Text>
            </View>
          )}
          {!bestsCoincide && currentBests.stable && (
            <View className={`${styles.currentBest} ${styles.currentBestStable}`}>
              <Text className={styles.currentBestLabel}>🛡️ 稳</Text>
              <Text className={styles.currentBestText}>
                {currentBests.stable.description} / 听 {currentBests.stable.waitCount} 种(共 {currentBests.stable.totalRemaining} 张)
              </Text>
              <Text className={styles.currentBestFan}>{currentBests.stable.totalFan}番</Text>
            </View>
          )}
          {!bestsCoincide && currentBests.ambitious && (
            <View className={`${styles.currentBest} ${styles.currentBestAmbitious}`}>
              <Text className={styles.currentBestLabel}>🚀 冲</Text>
              <Text className={styles.currentBestText}>
                {currentBests.ambitious.description} / 听 {currentBests.ambitious.waitCount} 种(共 {currentBests.ambitious.totalRemaining} 张)
              </Text>
              <Text className={styles.currentBestFan}>{currentBests.ambitious.totalFan}番</Text>
            </View>
          )}
          <View className={styles.note}>
            <Text>{!bestsCoincide ? '稳=听数最多;冲=单胡最高番。' : ''}下面列出可凑齐的高番种距离</Text>
          </View>

          <View className={styles.list}>
            {items.length === 0 && (
              <Text className={styles.empty}>暂无近距离的高番种（距离都 &gt; {MAX_DISTANCE_TO_SHOW}）</Text>
            )}
            {items.map((p, idx) => (
              <View key={p.fanName} className={`${styles.row} ${idx === 0 ? styles.rowBest : ''}`}>
                <Text className={styles.medal}>{rankMedal(idx)}</Text>
                <View className={styles.info}>
                  <Text className={styles.fanName}>{p.fanName} <Text className={styles.fanPts}>{p.points}番</Text></Text>
                  <Text className={styles.fanDesc}>{p.description}</Text>
                  {p.missingTiles && p.missingTiles.length > 0 && (
                    <Text className={styles.missing}>缺: {formatMissing(p.missingTiles)}</Text>
                  )}
                </View>
                <View className={styles.distance}>
                  <Text className={styles.distanceNum}>差 {p.distance}</Text>
                  <Text className={styles.distanceLabel}>张</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}
