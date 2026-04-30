import { useState, useMemo } from 'react';
import { View, Image, Text } from '@tarojs/components';
import { TileSet } from '../engine/models/tileSet';
import { tileFromIndex, tileEquals, tileToDisplay, type Tile } from '../engine/models/tile';
import type { Meld } from '../engine/models/meld';
import type { GameContext } from '../engine/models/types';
import { analyzeDiscards, type DiscardOption } from '../engine/discardAnalyzer';
import { tileIconPath } from '../engine/tileIcon';
import styles from './DiscardSuggestion.module.css';

interface Props {
  allCounts: TileSet;
  lockedMelds: readonly Meld[];
  game: GameContext;
}

export function DiscardSuggestion({ allCounts, lockedMelds, game }: Props) {
  const [open, setOpen] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [knownDiscards, setKnownDiscards] = useState<number[]>(() => new Array(34).fill(0));
  const [expandedDiscardIdx, setExpandedDiscardIdx] = useState<number | null>(null);

  const knownDiscardSet = useMemo(() => TileSet.fromCounts(knownDiscards), [knownDiscards]);

  const results = useMemo<DiscardOption[]>(() => {
    if (!open) return [];
    return analyzeDiscards(allCounts, lockedMelds, game, advancedMode ? knownDiscardSet : undefined);
  }, [open, allCounts, lockedMelds, game, advancedMode, knownDiscardSet]);

  const tenpaiResults = results.filter(r => r.uniqueWaitCount > 0);
  const noTenpaiResults = results.filter(r => r.uniqueWaitCount === 0);

  function toggleKnownDiscard(idx: number, delta: number) {
    setKnownDiscards(prev => {
      const next = [...prev];
      next[idx] = Math.max(0, Math.min(4, next[idx] + delta));
      return next;
    });
  }

  function clearKnownDiscards() {
    setKnownDiscards(new Array(34).fill(0));
  }

  if (!open) {
    return (
      <View className={styles.toggleBtn} onClick={() => setOpen(true)}>
        <Text>🎯 出牌建议</Text>
      </View>
    );
  }

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <Text className={styles.title}>🎯 出牌建议</Text>
        <View className={styles.closeBtn} onClick={() => setOpen(false)}>
          <Text>✕</Text>
        </View>
      </View>

      <View className={styles.modeRow}>
        <View
          className={`${styles.modeChip} ${!advancedMode ? styles.modeChipActive : ''}`}
          onClick={() => setAdvancedMode(false)}
        >
          <Text>简单模式</Text>
        </View>
        <View
          className={`${styles.modeChip} ${advancedMode ? styles.modeChipActive : ''}`}
          onClick={() => setAdvancedMode(true)}
        >
          <Text>高级（含已弃）</Text>
        </View>
      </View>

      {advancedMode && (
        <View className={styles.knownDiscardSection}>
          <View className={styles.knownDiscardHeader}>
            <Text className={styles.subtitle}>桌面已弃牌（点击 +/- 调整）</Text>
            <View className={styles.smallBtn} onClick={clearKnownDiscards}>
              <Text>清空</Text>
            </View>
          </View>
          <View className={styles.knownGrid}>
            {Array.from({ length: 34 }, (_, i) => {
              const tile = tileFromIndex(i);
              const count = knownDiscards[i];
              return (
                <View key={i} className={styles.knownItem}>
                  <Image className={styles.tileImg} src={tileIconPath(tile)} mode='aspectFit' />
                  <View className={styles.knownControls}>
                    <View className={styles.miniBtn} onClick={() => toggleKnownDiscard(i, -1)}>
                      <Text>−</Text>
                    </View>
                    <Text className={styles.knownCount}>{count}</Text>
                    <View className={styles.miniBtn} onClick={() => toggleKnownDiscard(i, 1)}>
                      <Text>+</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {!advancedMode && (
        <View className={styles.note}>
          <Text>提示：听张数=理论最多（4 - 你的牌）。点"高级模式"可加入桌面已弃牌的精确计算。</Text>
        </View>
      )}

      <View className={styles.list}>
        {tenpaiResults.length === 0 && noTenpaiResults.length === results.length && (
          <Text className={styles.empty}>无任何弃牌可达听牌（向听数 ≥ 1）</Text>
        )}
        {tenpaiResults.slice(0, 8).map((r, idx) => {
          const isExpanded = expandedDiscardIdx === idx;
          const isBest = idx === 0;
          return (
            <View key={idx} className={`${styles.row} ${isBest ? styles.rowBest : ''}`}>
              <View className={styles.rowHeader} onClick={() => setExpandedDiscardIdx(isExpanded ? null : idx)}>
                <Text className={styles.rank}>{isBest ? '⭐' : `#${idx + 1}`}</Text>
                <Text className={styles.discardLabel}>打</Text>
                <Image className={styles.tileImg} src={tileIconPath(r.discardTile)} mode='aspectFit' />
                <View className={styles.summary}>
                  <Text className={styles.summaryText}>
                    听 <Text className={styles.summaryNum}>{r.uniqueWaitCount}</Text> 种
                    {advancedMode ? (
                      <Text>（剩 <Text className={styles.summaryNum}>{r.totalRemaining}</Text> 张）</Text>
                    ) : (
                      <Text>（共 <Text className={styles.summaryNum}>{r.totalRemaining}</Text> 张）</Text>
                    )}
                  </Text>
                  <Text className={styles.summaryScore}>最高 {r.maxScore} 番</Text>
                </View>
                <Text className={styles.expandArrow}>{isExpanded ? '▾' : '▸'}</Text>
              </View>
              {isExpanded && (
                <View className={styles.detail}>
                  {r.winningTiles
                    .slice()
                    .sort((a, b) => b.score - a.score)
                    .map((w, wi) => (
                      <View key={wi} className={styles.winRow}>
                        <Image className={styles.tileImgSmall} src={tileIconPath(w.tile)} mode='aspectFit' />
                        <Text className={styles.winRemaining}>剩 {w.remaining}</Text>
                        <Text className={styles.winScore}>{w.score} 番</Text>
                      </View>
                    ))}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}
