import { useState, useEffect, useCallback } from 'react';
import { View, Image, Text } from '@tarojs/components';
import { generateWaitTileQuestion, type WaitTileQuestion } from '../handGenerator';
import { tileIconPath } from '../../../engine/tileIcon';
import { tileFromIndex, tileIndex } from '../../../engine/models/tile';
import { useStreak } from '../useStreak';
import styles from '../index.module.css';

export function WaitTileMode() {
  const [question, setQuestion] = useState<WaitTileQuestion | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const { streak, best, recordCorrect, recordWrong } = useStreak('waitTile');

  useEffect(() => {
    setQuestion(generateWaitTileQuestion());
  }, []);

  const toggle = useCallback((idx: number) => {
    if (submitted) return;
    setSelected(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  }, [submitted]);

  const submit = useCallback(() => {
    if (submitted || !question) return;
    setSubmitted(true);
    const correct = selected.size === question.correctTileIndices.size
      && [...selected].every(i => question.correctTileIndices.has(i));
    correct ? recordCorrect() : recordWrong();
  }, [submitted, question, selected, recordCorrect, recordWrong]);

  const next = () => {
    setSelected(new Set());
    setSubmitted(false);
    setQuestion(generateWaitTileQuestion());
  };

  if (!question) return <Text className={styles.loading}>加载中…</Text>;

  const isCorrect = submitted
    && selected.size === question.correctTileIndices.size
    && [...selected].every(i => question.correctTileIndices.has(i));

  // 13 tile hand
  const handTiles: ReturnType<typeof tileFromIndex>[] = [];
  for (let i = 0; i < 34; i++) {
    for (let j = 0; j < question.counts.getByIndex(i); j++) {
      handTiles.push(tileFromIndex(i));
    }
  }

  return (
    <>
      <View className={styles.streakBar}>
        <Text className={styles.statBlock}>连对 <Text className={styles.statNum}>{streak}</Text></Text>
        <Text className={styles.statBlock}>最佳 <Text className={styles.statNum}>{best}</Text></Text>
      </View>

      <View className={styles.handBar}>
        {handTiles.map((tile, i) => (
          <Image key={i} className={styles.tileImg} src={tileIconPath(tile)} mode='aspectFit' />
        ))}
      </View>

      <View className={styles.prompt}><Text>选出所有能和的牌（可以是多张）：</Text></View>

      <View className={styles.candidateTiles}>
        {question.candidateTiles.map((tile, i) => {
          const idx = tileIndex(tile);
          const isSel = selected.has(idx);
          const isCorrectTile = question.correctTileIndices.has(idx);
          let cls = styles.candidateTile;
          if (submitted) {
            if (isCorrectTile && isSel) cls += ' ' + styles.correctSelected;
            else if (isCorrectTile && !isSel) cls += ' ' + styles.correctMissed;
            else if (!isCorrectTile && isSel) cls += ' ' + styles.wrongSelected;
            else cls += ' ' + styles.notSelected;
          } else if (isSel) {
            cls += ' ' + styles.selected;
          }
          return (
            <View key={i} className={cls} onClick={() => toggle(idx)}>
              <Image className={styles.tileImg} src={tileIconPath(tile)} mode='aspectFit' />
            </View>
          );
        })}
      </View>

      {submitted && (
        <View className={styles.result}>
          <Text className={isCorrect ? styles.correctMsg : styles.wrongMsg}>
            {isCorrect ? '✓ 答对了！' : '✗ 答错了'}
          </Text>
          <Text className={styles.totalText}>
            正确听牌：{[...question.correctTileIndices].map(i => {
              const t = tileFromIndex(i);
              return t.suit === 'wind'
                ? ['东', '南', '西', '北'][t.rank]
                : t.suit === 'dragon'
                ? ['中', '发', '白'][t.rank]
                : `${t.rank + 1}${t.suit === 'man' ? '万' : t.suit === 'pin' ? '筒' : '条'}`;
            }).join('、')}
          </Text>
        </View>
      )}

      <View className={styles.actions}>
        {!submitted ? (
          <View className={styles.submitBtn} onClick={submit}><Text>提交</Text></View>
        ) : (
          <View className={styles.nextBtn} onClick={next}><Text>下一题</Text></View>
        )}
      </View>
    </>
  );
}
