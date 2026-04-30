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
  description: string;  // e.g., "听 9p (88番)" or "打 8m 听 7m (17番)"
  winTile?: Tile;
  discardTile?: Tile;
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

export function FanPotential({ allCounts, lockedMelds, game, totalCount, expectedCount }: Props) {
  const [open, setOpen] = useState(false);

  const items = useMemo<FanPotentialItem[]>(() => {
    if (!open) return [];
    return calculateFanPotential(allCounts)
      .filter(p => p.distance > 0 && p.distance <= MAX_DISTANCE_TO_SHOW)
      .slice(0, MAX_ITEMS);
  }, [open, allCounts]);

  // Compute "current best achievable" — what's the max 番 you can get right now?
  const currentBest = useMemo<CurrentBest | null>(() => {
    if (!open) return null;
    const safeMelds = lockedMelds ?? [];
    const isAt14 = totalCount === expectedCount;
    const isAt13 = totalCount === expectedCount - 1;

    try {
      if (isAt14) {
        const discards = analyzeDiscards(allCounts, safeMelds, game);
        let best: CurrentBest | null = null;
        for (const d of discards) {
          for (const w of d.winningTiles) {
            if (!best || w.score > best.totalFan) {
              best = {
                totalFan: w.score,
                description: `打 ${tileNameShort(d.discardTile)} 听 ${tileNameShort(w.tile)}`,
                winTile: w.tile,
                discardTile: d.discardTile,
              };
            }
          }
        }
        return best;
      }
      if (isAt13) {
        let best: CurrentBest | null = null;
        const raw = [...allCounts.rawCounts()];
        for (let i = 0; i < 34; i++) {
          if (raw[i] >= 4) continue;
          raw[i]++;
          const test = TileSet.fromCounts(raw);
          if (isWinningHandWithMelds(test, safeMelds)) {
            const winTile = tileFromIndex(i);
            try {
              const result = evaluate(test, safeMelds, { ...game, winningTile: winTile });
              if (!best || result.totalFan > best.totalFan) {
                best = {
                  totalFan: result.totalFan,
                  description: `听 ${tileNameShort(winTile)}`,
                  winTile,
                };
              }
            } catch (e) {
              // skip this winning tile if evaluation fails
            }
          }
          raw[i]--;
        }
        return best;
      }
    } catch (e) {
      console.error('FanPotential currentBest failed:', e);
    }
    return null;
  }, [open, allCounts, lockedMelds, game, totalCount, expectedCount]);

  return (
    <View className={open ? styles.container : styles.containerCollapsed}>
      <View className={styles.header} onClick={() => setOpen(!open)}>
        <Text className={styles.title}>🏆 番数潜力</Text>
        <Text className={styles.toggleArrow}>{open ? '收起 ▾' : '展开 ▸'}</Text>
      </View>

      {open && (
        <>
          {currentBest && (
            <View className={styles.currentBest}>
              <Text className={styles.currentBestLabel}>📌 当前最优</Text>
              <Text className={styles.currentBestText}>{currentBest.description}</Text>
              <Text className={styles.currentBestFan}>{currentBest.totalFan}番</Text>
            </View>
          )}
          <View className={styles.note}>
            <Text>下面列出可凑齐的高番种距离，对比上方"当前最优"决定追不追</Text>
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
