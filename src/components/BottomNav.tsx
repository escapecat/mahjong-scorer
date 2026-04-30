import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './BottomNav.module.css';

interface Props {
  active: 'home' | 'fantable';
}

export function BottomNav({ active }: Props) {
  function go(target: 'home' | 'fantable') {
    if (target === active) return;
    const url = target === 'home' ? '/pages/index/index' : '/pages/fantable/index';
    Taro.redirectTo({ url });
  }

  return (
    <View className={styles.nav}>
      <View
        className={`${styles.tab} ${active === 'home' ? styles.active : ''}`}
        onClick={() => go('home')}
      >
        <Text className={styles.icon}>🧮</Text>
        <Text className={styles.label}>算番</Text>
      </View>
      <View
        className={`${styles.tab} ${active === 'fantable' ? styles.active : ''}`}
        onClick={() => go('fantable')}
      >
        <Text className={styles.icon}>📋</Text>
        <Text className={styles.label}>番表</Text>
      </View>
    </View>
  );
}
