import { useState, useMemo } from 'react';
import { View, Image, Text, Input } from '@tarojs/components';
import { ALL_FANS, FAN_CATEGORIES, parseExampleTiles } from '../../engine/fanData';
import { tileIconPathByCode } from '../../engine/tileIcon';
import { BottomNav } from '../../components/BottomNav';
import styles from './index.module.css';

export default function FanTable() {
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>(88);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    let list = selectedCategory === 'all'
      ? ALL_FANS
      : ALL_FANS.filter(f => f.points === selectedCategory);
    const q = search.trim();
    if (q) list = list.filter(f => f.name.includes(q) || f.description.includes(q));
    return list;
  }, [selectedCategory, search]);

  function toggle(name: string) {
    const next = new Set(expanded);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setExpanded(next);
  }

  return (
    <View className={styles.container}>
      <View className={styles.content}>
        <View className={styles.filterBar}>
          <Input
            className={styles.search}
            type='text'
            placeholder='搜索番种名称或描述…'
            value={search}
            onInput={(e) => setSearch(e.detail.value)}
          />
          <View className={styles.chipRow}>
            <View
              className={`${styles.chip} ${selectedCategory === 'all' ? styles.active : ''}`}
              onClick={() => { setSelectedCategory('all'); setExpanded(new Set()); }}
            >
              <Text>全部</Text>
            </View>
            {FAN_CATEGORIES.map(c => (
              <View
                key={c}
                className={`${styles.chip} ${selectedCategory === c ? styles.active : ''}`}
                onClick={() => { setSelectedCategory(c); setExpanded(new Set()); }}
              >
                <Text>{c}番</Text>
              </View>
            ))}
          </View>
        </View>
        {filtered.length === 0 && (
          <Text className={styles.empty}>没有匹配的番种</Text>
        )}

        <View className={styles.list}>
          {filtered.map(fan => {
            const isExpanded = expanded.has(fan.name);
            return (
              <View
                key={fan.name}
                className={`${styles.item} ${isExpanded ? styles.expanded : ''}`}
                onClick={() => toggle(fan.name)}
              >
                <View className={styles.header}>
                  <Text className={styles.name}>{fan.name}</Text>
                  <Text className={styles.pts}>{fan.points} 番</Text>
                </View>
                {isExpanded && (
                  <View className={styles.detail}>
                    <Text className={styles.desc}>{fan.description}</Text>
                    {fan.exampleTiles && (
                      <View className={styles.example}>
                        {parseExampleTiles(fan.exampleTiles).map((code, i) => (
                          <Image key={i} className={styles.tileImg} src={tileIconPathByCode(code)} mode='aspectFit' />
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
      <BottomNav active='fantable' />
    </View>
  );
}
