import { useState } from 'react';
import { View, Text } from '@tarojs/components';
import { BottomNav } from '../../components/BottomNav';
import { FanPickMode } from './modes/FanPickMode';
import { FanCountMode } from './modes/FanCountMode';
import { WaitTileMode } from './modes/WaitTileMode';
import styles from './index.module.css';

type Mode = 'fanPick' | 'fanCount' | 'waitTile';

const MODE_LABELS: Record<Mode, string> = {
  fanCount: '🔢 猜番数',
  waitTile: '👀 猜听牌',
  fanPick: '✅ 选番种',
};

export default function Practice() {
  const [mode, setMode] = useState<Mode>('fanCount');

  return (
    <View className={styles.container}>
      <View className={styles.content}>
        <View className={styles.header}>
          <View className={styles.title}>
            <Text className={styles.titleIcon}>📝</Text>
            <Text className={styles.titleText}>练习模式</Text>
          </View>
        </View>

        <View className={styles.modeSwitch}>
          {(Object.keys(MODE_LABELS) as Mode[]).map(m => (
            <View
              key={m}
              className={`${styles.modeChip} ${mode === m ? styles.modeChipActive : ''}`}
              onClick={() => setMode(m)}
            >
              <Text>{MODE_LABELS[m]}</Text>
            </View>
          ))}
        </View>

        {mode === 'fanCount' && <FanCountMode />}
        {mode === 'waitTile' && <WaitTileMode />}
        {mode === 'fanPick' && <FanPickMode />}
      </View>
      <BottomNav active='practice' />
    </View>
  );
}
