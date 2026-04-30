import { View, Image, Text } from '@tarojs/components';
import type { EvaluationResult } from '../engine/models/types';
import type { Tile } from '../engine/models/tile';
import { tileEquals } from '../engine/models/tile';
import { tileIconPath } from '../engine/tileIcon';
import styles from './ResultDisplay.module.css';

interface Props {
  result: EvaluationResult;
  winningTile: Tile | null;
  expandedFanName: string | null;
  onExpandFan: (name: string | null) => void;
}

export function ResultDisplay({ result, winningTile, expandedFanName, onExpandFan }: Props) {
  // Render decomposition tile groups
  const renderGroups = () => {
    if (!result.tileGroups || result.tileGroups.length === 0) return null;
    let winHighlighted = false;

    return (
      <View className={styles.decomp}>
        {result.tileGroups.map((group, gIdx) => (
          <View key={gIdx} className={styles.group}>
            {group.map((t, tIdx) => {
              const isWin = !winHighlighted && winningTile && tileEquals(t, winningTile)
                && (result.winningTileGroupIndex < 0 || gIdx === result.winningTileGroupIndex);
              if (isWin) winHighlighted = true;
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
  };

  const expandedFan = result.fans.find(f => f.name === expandedFanName);

  return (
    <View className={styles.container}>
      {renderGroups()}
      <View className={styles.fanBar}>
        {result.fans.map((fan, i) => (
          <View
            key={i}
            className={`${styles.fanChip} ${expandedFanName === fan.name ? styles.expanded : ''}`}
            onClick={() => onExpandFan(fan.name)}
          >
            <Text>{fan.name} {fan.points}番</Text>
          </View>
        ))}
      </View>
      {expandedFan && (
        <View className={styles.reason}>
          <Text>{expandedFan.description}</Text>
        </View>
      )}
    </View>
  );
}
