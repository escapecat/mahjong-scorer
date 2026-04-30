import { View, Image, Text } from '@tarojs/components';
import type { WinSuggestion } from '../pages/index/useCalculator';
import { tileIconPath } from '../engine/tileIcon';
import { tileEquals, type Tile } from '../engine/models/tile';
import styles from './WaitSuggestions.module.css';

interface Props {
  suggestions: WinSuggestion[];
  expandedCode: string | null;
  onExpand: (code: string | null) => void;
  onAddTile: (t: Tile) => void;
}

export function WaitSuggestions({ suggestions, expandedCode, onExpand, onAddTile }: Props) {
  if (suggestions.length === 0) return null;

  const expanded = suggestions.find(s => s.tileCode === expandedCode);

  return (
    <View className={styles.section}>
      <View className={styles.bar}>
        <Text className={styles.label}>听</Text>
        {suggestions.map(s => (
          <View
            key={s.tileCode}
            className={`${styles.item} ${expandedCode === s.tileCode ? styles.expanded : ''}`}
            onClick={() => onExpand(s.tileCode)}
          >
            <Image className={styles.tileImg} src={tileIconPath(s.tile)} mode='aspectFit' />
            <Text className={styles.fan}>{s.result.totalFan}番</Text>
          </View>
        ))}
      </View>
      {expanded && (
        <View className={styles.detail}>
          <View className={styles.detailRow}>
            <Image className={styles.tileImg} src={tileIconPath(expanded.tile)} mode='aspectFit' />
            <Text className={styles.detailFan}>{expanded.result.totalFan} 番</Text>
          </View>
          {expanded.result.tileGroups && expanded.result.tileGroups.length > 0 && (() => {
            // Track across all groups so only ONE tile gets the 胡 badge
            let winMarked = false;
            return (
              <View className={styles.decomp}>
                {expanded.result.tileGroups.map((group, gIdx) => (
                  <View key={gIdx} className={styles.group}>
                    {group.map((t, tIdx) => {
                      const isWin = !winMarked && tileEquals(t, expanded.tile)
                        && (expanded.result.winningTileGroupIndex < 0 || gIdx === expanded.result.winningTileGroupIndex);
                      if (isWin) winMarked = true;
                      return isWin ? (
                        <View key={tIdx} className={styles.winMarker}>
                          <Image className={styles.tileXs} src={tileIconPath(t)} mode='aspectFit' />
                        </View>
                      ) : (
                        <Image key={tIdx} className={styles.tileXs} src={tileIconPath(t)} mode='aspectFit' />
                      );
                    })}
                  </View>
                ))}
              </View>
            );
          })()}
          <View className={styles.chips}>
            {expanded.result.fans.map((f, i) => (
              <Text key={i} className={styles.chip}>{f.name} {f.points}番</Text>
            ))}
          </View>
          <View className={styles.addBtn} onClick={() => onAddTile(expanded.tile)}>
            <Text>添加此牌</Text>
          </View>
        </View>
      )}
    </View>
  );
}
