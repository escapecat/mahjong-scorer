import { View, Text } from '@tarojs/components';
import { Tiles, type Tile, tileEquals } from '../engine/models/tile';
import styles from './SettingsPanel.module.css';

const WINDS: Tile[] = [Tiles.East, Tiles.South, Tiles.West, Tiles.North];
const WIND_LABELS = ['东', '南', '西', '北'];

interface Props {
  isSelfDraw: boolean;
  seatWind: Tile;
  roundWind: Tile;
  flowerCount: number;
  isLastTile: boolean;
  isKongDraw: boolean;
  isRobbingKong: boolean;
  isWinningTileLast: boolean;
  onSetSelfDraw: (v: boolean) => void;
  onSetSeatWind: (w: Tile) => void;
  onSetRoundWind: (w: Tile) => void;
  onSetFlower: (n: number) => void;
  onToggleLastTile: () => void;
  onToggleKongDraw: () => void;
  onToggleRobbingKong: () => void;
  onToggleWinningTileLast: () => void;
}

function Chip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <View className={`${styles.chip} ${active ? styles.active : ''}`} onClick={onClick}>
      <Text>{label}</Text>
    </View>
  );
}

export function SettingsPanel(props: Props) {
  return (
    <View className={styles.panel}>
      <View className={styles.row}>
        <Text className={styles.label}>胜负</Text>
        <Chip active={props.isSelfDraw} label='自摸' onClick={() => props.onSetSelfDraw(true)} />
        <Chip active={!props.isSelfDraw} label='点炮' onClick={() => props.onSetSelfDraw(false)} />
        <View className={styles.sep} />
        <Text className={styles.label}>花牌</Text>
        <Chip active={false} label='−' onClick={() => props.onSetFlower(props.flowerCount - 1)} />
        <Text className={styles.flowerVal}>{props.flowerCount}</Text>
        <Chip active={false} label='＋' onClick={() => props.onSetFlower(props.flowerCount + 1)} />
      </View>
      <View className={`${styles.row} ${styles.windRow}`}>
        <Text className={styles.label}>门风</Text>
        {WINDS.map((w, i) => (
          <Chip key={`seat-${i}`} active={tileEquals(props.seatWind, w)} label={WIND_LABELS[i]} onClick={() => props.onSetSeatWind(w)} />
        ))}
        <View className={styles.sep} />
        <Text className={styles.label}>圈风</Text>
        {WINDS.map((w, i) => (
          <Chip key={`round-${i}`} active={tileEquals(props.roundWind, w)} label={WIND_LABELS[i]} onClick={() => props.onSetRoundWind(w)} />
        ))}
      </View>
      <View className={styles.row}>
        <Text className={styles.label}>特殊</Text>
        <Chip active={props.isWinningTileLast} label='绝张' onClick={props.onToggleWinningTileLast} />
        <Chip active={props.isLastTile} label='海底' onClick={props.onToggleLastTile} />
        <Chip active={props.isKongDraw} label='杠花' onClick={props.onToggleKongDraw} />
        <Chip active={props.isRobbingKong} label='抢杠' onClick={props.onToggleRobbingKong} />
      </View>
    </View>
  );
}
