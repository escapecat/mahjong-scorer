import { View, Text } from '@tarojs/components';
import type { EvaluationResult } from '../engine/models/types';
import styles from './ScoreBar.module.css';

interface Props {
  result: EvaluationResult | null;
  tileCount: number;
  expectedCount: number;
  settingsOpen: boolean;
  onToggleSettings: () => void;
}

export function ScoreBar({ result, tileCount, expectedCount, settingsOpen, onToggleSettings }: Props) {
  const totalFan = result?.totalFan ?? 0;

  return (
    <View className={styles.bar}>
      <View className={styles.left}>
        <Text className={styles.value}>{totalFan}</Text>
        <Text className={styles.label}>番</Text>
      </View>
      <View className={styles.right}>
        {result === null ? (
          <Text className={styles.status}>未成和</Text>
        ) : totalFan >= 8 ? (
          <Text className={`${styles.status} ${styles.valid}`}>起和</Text>
        ) : (
          <Text className={styles.status}>差 {8 - totalFan} 番</Text>
        )}
        <Text className={styles.count}>{tileCount} / {expectedCount} 张</Text>
      </View>
      <View className={`${styles.settingsBtn} ${settingsOpen ? styles.open : ''}`} onClick={onToggleSettings}>
        <Text>⚙</Text>
      </View>
    </View>
  );
}
