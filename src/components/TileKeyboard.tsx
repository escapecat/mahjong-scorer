import { View, Image, Text } from '@tarojs/components';
import { tile, type Tile, type Suit } from '../engine/models/tile';
import { tileIconPath } from '../engine/tileIcon';
import styles from './TileKeyboard.module.css';

type AddTarget = 'hand' | 'chi' | 'peng' | 'mingKong' | 'anKong';

const TARGET_LABELS: Record<AddTarget, string> = {
  hand: '手牌', chi: '吃', peng: '碰', mingKong: '明杠', anKong: '暗杠',
};

const TILE_ROWS: { label: string; tiles: Tile[] }[] = [
  { label: '万', tiles: Array.from({ length: 9 }, (_, i) => tile('man', i)) },
  { label: '饼', tiles: Array.from({ length: 9 }, (_, i) => tile('pin', i)) },
  { label: '条', tiles: Array.from({ length: 9 }, (_, i) => tile('sou', i)) },
  { label: '字', tiles: [
    tile('wind', 0), tile('wind', 1), tile('wind', 2), tile('wind', 3),
    tile('dragon', 0), tile('dragon', 1), tile('dragon', 2),
  ]},
];

interface Props {
  addTarget: AddTarget;
  isTileDisabled: (t: Tile) => boolean;
  onAddTile: (t: Tile) => void;
  onSetTarget: (target: AddTarget) => void;
}

export function TileKeyboard({ addTarget, isTileDisabled, onAddTile, onSetTarget }: Props) {
  return (
    <View className={styles.keyboard}>
      <View className={styles.targets}>
        {(Object.keys(TARGET_LABELS) as AddTarget[]).map(t => (
          <View
            key={t}
            className={`${styles.targetBtn} ${addTarget === t ? styles.active : ''}`}
            onClick={() => onSetTarget(t)}
          >
            <Text>{TARGET_LABELS[t]}</Text>
          </View>
        ))}
      </View>
      <View className={styles.rows}>
        {TILE_ROWS.map(row => (
          <View key={row.label} className={styles.row}>
            {row.tiles.map((t, i) => {
              const disabled = isTileDisabled(t);
              return (
                <View
                  key={i}
                  className={`${styles.tileBtn} ${disabled ? styles.disabled : ''}`}
                  onClick={() => !disabled && onAddTile(t)}
                >
                  <Image className={styles.tileImg} src={tileIconPath(t)} mode='aspectFit' />
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
