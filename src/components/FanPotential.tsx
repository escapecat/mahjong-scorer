import { useState, useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import { TileSet } from '../engine/models/tileSet';
import { calculateFanPotential, type FanPotential as FanPotentialItem } from '../engine/fanPotential';
import styles from './FanPotential.module.css';

interface Props {
  allCounts: TileSet;
}

const MAX_DISTANCE_TO_SHOW = 6;
const MAX_ITEMS = 8;

function rankMedal(idx: number): string {
  if (idx === 0) return '🏆';
  if (idx === 1) return '🥈';
  if (idx === 2) return '🥉';
  return '🔹';
}

export function FanPotential({ allCounts }: Props) {
  const [open, setOpen] = useState(false);

  const items = useMemo<FanPotentialItem[]>(() => {
    if (!open) return [];
    return calculateFanPotential(allCounts)
      .filter(p => p.distance > 0 && p.distance <= MAX_DISTANCE_TO_SHOW)
      .slice(0, MAX_ITEMS);
  }, [open, allCounts]);

  return (
    <View className={open ? styles.container : styles.containerCollapsed}>
      <View className={styles.header} onClick={() => setOpen(!open)}>
        <Text className={styles.title}>🏆 番数潜力</Text>
        <Text className={styles.toggleArrow}>{open ? '收起 ▾' : '展开 ▸'}</Text>
      </View>

      {open && (
        <>
          <View className={styles.note}>
            <Text>各大番种距离当前手牌差几张（仅显示距离 ≤ {MAX_DISTANCE_TO_SHOW}）</Text>
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
