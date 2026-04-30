import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './BottomNav.module.css';

type Tab = 'home' | 'fantable' | 'practice' | 'session';

interface Props {
  active: Tab;
}

const TAB_URLS: Record<Tab, string> = {
  home: '/pages/index/index',
  fantable: '/pages/fantable/index',
  practice: '/pages/practice/index',
  session: '/pages/session/index',
};

export function BottomNav({ active }: Props) {
  function go(target: Tab) {
    if (target === active) return;
    Taro.redirectTo({ url: TAB_URLS[target] });
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
      <View
        className={`${styles.tab} ${active === 'practice' ? styles.active : ''}`}
        onClick={() => go('practice')}
      >
        <Text className={styles.icon}>📝</Text>
        <Text className={styles.label}>练习</Text>
      </View>
      <View
        className={`${styles.tab} ${active === 'session' ? styles.active : ''}`}
        onClick={() => go('session')}
      >
        <Text className={styles.icon}>🎲</Text>
        <Text className={styles.label}>对局</Text>
      </View>
    </View>
  );
}
