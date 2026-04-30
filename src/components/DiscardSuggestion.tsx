import { useState, useMemo } from 'react';
import { View, Image, Text } from '@tarojs/components';
import { TileSet } from '../engine/models/tileSet';
import { tileFromIndex, type Tile } from '../engine/models/tile';
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
  const [expandedDiscardIdx, setExpandedDiscardIdx] = useState<number | null>(null);

  const results = useMemo<DiscardOption[]>(() => {
    if (!open) return [];
    return analyzeDiscards(allCounts, lockedMelds, game);
  }, [open, allCounts, lockedMelds, game]);

  const tenpaiResults = results.filter(r => r.uniqueWaitCount > 0);

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

      <View className={styles.note}>
        <Text>听张数=理论最多（4 - 你手中已有）。实战中需自行扣除桌面已弃。</Text>
      </View>

      <View className={styles.list}>
        {tenpaiResults.length === 0 && (
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
                    （共 <Text className={styles.summaryNum}>{r.totalRemaining}</Text> 张）
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
