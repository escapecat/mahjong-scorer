import { useState, useEffect, useCallback } from 'react';
import { View, Image, Text } from '@tarojs/components';
import { generateFanPickQuestion, type FanPickQuestion } from '../handGenerator';
import { tileIconPath } from '../../../engine/tileIcon';
import { tileFromIndex, tileEquals } from '../../../engine/models/tile';
import { meldTiles } from '../../../engine/models/meld';
import { useStreak } from '../useStreak';
import styles from '../index.module.css';

const MELD_TAG: Record<string, string> = { sequence: '吃', triplet: '碰', kong: '杠' };

const WIND_LABEL: Record<string, string> = { '0': '东', '1': '南', '2': '西', '3': '北' };

export function FanPickMode() {
  const [question, setQuestion] = useState<FanPickQuestion | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const { streak, best, recordCorrect, recordWrong } = useStreak('fanPick');

  useEffect(() => {
    setQuestion(generateFanPickQuestion());
  }, []);

  const toggle = useCallback((name: string) => {
    if (submitted) return;
    setSelected(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }, [submitted]);

  const submit = useCallback(() => {
    if (submitted || !question) return;
    setSubmitted(true);
    const correct = selected.size === question.correctFanNames.size
      && [...selected].every(n => question.correctFanNames.has(n));
    correct ? recordCorrect() : recordWrong();
  }, [submitted, question, selected, recordCorrect, recordWrong]);

  const next = () => {
    setSelected(new Set());
    setSubmitted(false);
    setQuestion(generateFanPickQuestion());
  };

  if (!question) return <Text className={styles.loading}>加载中…</Text>;

  const isCorrect = submitted
    && selected.size === question.correctFanNames.size
    && [...selected].every(n => question.correctFanNames.has(n));

  // Build hand display: concealed tiles only
  const handTiles: { tile: ReturnType<typeof tileFromIndex>; isWin: boolean }[] = [];
  let winMarked = false;
  for (let i = 0; i < 34; i++) {
    for (let j = 0; j < question.handCounts.getByIndex(i); j++) {
      const t = tileFromIndex(i);
      const isWin = !winMarked && question.game.winningTile && tileEquals(t, question.game.winningTile);
      if (isWin) winMarked = true;
      handTiles.push({ tile: t, isWin: !!isWin });
    }
  }
  const hasMelds = question.lockedMelds.length > 0;

  return (
    <>
      <View className={styles.streakBar}>
        <Text className={styles.statBlock}>连对 <Text className={styles.statNum}>{streak}</Text></Text>
        <Text className={styles.statBlock}>最佳 <Text className={styles.statNum}>{best}</Text></Text>
      </View>

      <View className={styles.gameInfo}>
        <Text className={styles.infoChip}>{question.game.isSelfDraw ? '自摸' : '点炮'}</Text>
        <Text className={styles.infoChip}>门风 {WIND_LABEL[String(question.game.seatWind.rank)]}</Text>
        <Text className={styles.infoChip}>圈风 {WIND_LABEL[String(question.game.roundWind.rank)]}</Text>
        {question.game.flowerCount > 0 && <Text className={styles.infoChip}>花 {question.game.flowerCount}</Text>}
        {question.game.isLastTile && <Text className={styles.infoChip}>海底</Text>}
        {question.game.isWinningTileLast && <Text className={styles.infoChip}>绝张</Text>}
      </View>

      <View className={styles.handBar}>
        {handTiles.map(({ tile, isWin }, i) => (
          isWin ? (
            <View key={i} className={styles.winMarker}>
              <Image className={styles.tileImg} src={tileIconPath(tile)} mode='aspectFit' />
            </View>
          ) : (
            <Image key={i} className={styles.tileImg} src={tileIconPath(tile)} mode='aspectFit' />
          )
        ))}
        {hasMelds && <Text className={styles.handSep}>│</Text>}
        {question.lockedMelds.map((meld, mi) => (
          <View key={`m-${mi}`} className={styles.meldGroup}>
            {meldTiles(meld).map((t, ti) => (
              <Image key={ti} className={styles.tileImg} src={tileIconPath(t)} mode='aspectFit' />
            ))}
            <Text className={styles.meldTag}>{MELD_TAG[meld.type]}</Text>
          </View>
        ))}
      </View>

      <View className={styles.prompt}><Text>选出所有适用的番种：</Text></View>

      <View className={styles.options}>
        {question.options.map(opt => {
          const isSel = selected.has(opt.name);
          let cls = styles.option;
          if (submitted) {
            if (opt.isCorrect && isSel) cls = `${styles.option} ${styles.correctSelected}`;
            else if (opt.isCorrect && !isSel) cls = `${styles.option} ${styles.correctMissed}`;
            else if (!opt.isCorrect && isSel) cls = `${styles.option} ${styles.wrongSelected}`;
            else cls = `${styles.option} ${styles.notSelected}`;
          } else if (isSel) {
            cls = `${styles.option} ${styles.selected}`;
          }
          return (
            <View key={opt.name} className={cls} onClick={() => toggle(opt.name)}>
              <Text className={styles.optName}>{opt.name}</Text>
              <Text className={styles.optPts}>{opt.points} 番</Text>
            </View>
          );
        })}
      </View>

      {submitted && (
        <View className={styles.result}>
          <Text className={isCorrect ? styles.correctMsg : styles.wrongMsg}>
            {isCorrect ? '✓ 答对了！' : '✗ 答错了'}
          </Text>
          <Text className={styles.totalText}>实际总番：{question.result.totalFan} 番</Text>
          <View className={styles.actualFans}>
            {question.result.fans.map((f, i) => (
              <Text key={i} className={styles.actualChip}>{f.name} {f.points}番</Text>
            ))}
          </View>
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
