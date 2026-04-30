import { View, Image, Text } from '@tarojs/components';
import { tileFromIndex, tileIndex, type Tile } from '../engine/models/tile';
import { type Meld, meldTiles } from '../engine/models/meld';
import { tileIconPath } from '../engine/tileIcon';
import styles from './HandDisplay.module.css';

interface MeldEntry {
  meldType: 'chi' | 'peng' | 'mingKong' | 'anKong';
  index: number;
  meld: Meld;
  label: string;
}

interface Props {
  handCounts: readonly number[];
  meldEntries: MeldEntry[];
  hasAnyMeld: boolean;
  onRemoveTile: (t: Tile) => void;
  onRemoveMeld: (meldType: string, index: number) => void;
  onClear: () => void;
}

export function HandDisplay({ handCounts, meldEntries, hasAnyMeld, onRemoveTile, onRemoveMeld, onClear }: Props) {
  // Build sorted tile list from handCounts
  const handTiles: Tile[] = [];
  for (let i = 0; i < 34; i++) {
    for (let j = 0; j < handCounts[i]; j++) {
      handTiles.push(tileFromIndex(i));
    }
  }

  const isEmpty = handTiles.length === 0 && !hasAnyMeld;

  return (
    <View className={styles.bar}>
      <View className={styles.tiles}>
        {handTiles.map((t, i) => (
          <View key={`h-${i}`} className={styles.handTile} onClick={() => onRemoveTile(t)}>
            <Image className={styles.tileImg} src={tileIconPath(t)} mode='aspectFit' />
          </View>
        ))}
        {hasAnyMeld && <Text className={styles.sep}>│</Text>}
        {meldEntries.map((entry, i) => (
          <View key={`m-${i}`} className={styles.meld} onClick={() => onRemoveMeld(entry.meldType, entry.index)}>
            {meldTiles(entry.meld).map((t, j) => (
              <Image key={j} className={styles.tileImgSm} src={tileIconPath(t)} mode='aspectFit' />
            ))}
            <Text className={styles.meldTag}>{entry.label}</Text>
          </View>
        ))}
        {isEmpty && <Text className={styles.placeholder}>点击下方牌键盘添加</Text>}
      </View>
      <View className={styles.clearBtn} onClick={onClear}>
        <Text>✕</Text>
      </View>
    </View>
  );
}
