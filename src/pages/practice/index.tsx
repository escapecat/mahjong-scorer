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

  const containerStyle = process.env.TARO_ENV !== 'h5' ? { maxWidth: 'none' } : undefined;

  return (
    <View className={styles.container} style={containerStyle}>
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

        {/* All three modes stay mounted so switching tabs preserves the current question */}
        <View className={mode === 'fanCount' ? styles.modeWrapper : styles.modeHidden}>
          <FanCountMode />
        </View>
        <View className={mode === 'waitTile' ? styles.modeWrapper : styles.modeHidden}>
          <WaitTileMode />
        </View>
        <View className={mode === 'fanPick' ? styles.modeWrapper : styles.modeHidden}>
          <FanPickMode />
        </View>
      </View>
      <BottomNav active='practice' />
    </View>
  );
}
