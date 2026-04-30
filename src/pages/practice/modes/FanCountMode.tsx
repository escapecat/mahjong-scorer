import { useState, useEffect, useCallback } from 'react';
import { View, Image, Text } from '@tarojs/components';
import { generateFanCountQuestion, type FanCountQuestion } from '../handGenerator';
import { tileIconPath } from '../../../engine/tileIcon';
import { tileFromIndex, tileEquals } from '../../../engine/models/tile';
import { useStreak } from '../useStreak';
import styles from '../index.module.css';

const WIND_LABEL: Record<string, string> = { '0': '东', '1': '南', '2': '西', '3': '北' };

export function FanCountMode() {
  const [question, setQuestion] = useState<FanCountQuestion | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const { streak, best, recordCorrect, recordWrong } = useStreak('fanCount');

  useEffect(() => {
    setQuestion(generateFanCountQuestion());
  }, []);

  const submit = useCallback(() => {
    if (submitted || selectedIdx === null || !question) return;
    setSubmitted(true);
    selectedIdx === question.correctIndex ? recordCorrect() : recordWrong();
  }, [submitted, selectedIdx, question, recordCorrect, recordWrong]);

  const next = () => {
    setSelectedIdx(null);
    setSubmitted(false);
    setQuestion(generateFanCountQuestion());
  };

  if (!question) return <Text className={styles.loading}>加载中…</Text>;

  const isCorrect = submitted && selectedIdx === question.correctIndex;

  const handTiles: { tile: ReturnType<typeof tileFromIndex>; isWin: boolean }[] = [];
  let winMarked = false;
  for (let i = 0; i < 34; i++) {
    for (let j = 0; j < question.counts.getByIndex(i); j++) {
      const t = tileFromIndex(i);
      const isWin = !winMarked && question.game.winningTile && tileEquals(t, question.game.winningTile);
      if (isWin) winMarked = true;
      handTiles.push({ tile: t, isWin: !!isWin });
    }
  }

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
      </View>

      <View className={styles.prompt}><Text>这手牌一共多少番？</Text></View>

      <View className={styles.fanCountChoices}>
        {question.choices.map((v, i) => {
          let cls = styles.fanCountChoice;
          if (submitted) {
            if (i === question.correctIndex) cls += ' ' + styles.correctSelected;
            else if (i === selectedIdx) cls += ' ' + styles.wrongSelected;
            else cls += ' ' + styles.notSelected;
          } else if (i === selectedIdx) {
            cls += ' ' + styles.selected;
          }
          return (
            <View key={i} className={cls} onClick={() => !submitted && setSelectedIdx(i)}>
              <Text className={styles.choiceLetter}>{String.fromCharCode(65 + i)}</Text>
              <Text className={styles.choiceValue}>{v} 番</Text>
            </View>
          );
        })}
      </View>

      {submitted && (
        <View className={styles.result}>
          <Text className={isCorrect ? styles.correctMsg : styles.wrongMsg}>
            {isCorrect ? '✓ 答对了！' : '✗ 答错了'}
          </Text>
          <Text className={styles.totalText}>正确答案：{question.choices[question.correctIndex]} 番</Text>
          <View className={styles.actualFans}>
            {question.result.fans.map((f, i) => (
              <Text key={i} className={styles.actualChip}>{f.name} {f.points}番</Text>
            ))}
          </View>
        </View>
      )}

      <View className={styles.actions}>
        {!submitted ? (
          <View
            className={`${styles.submitBtn} ${selectedIdx === null ? styles.disabledBtn : ''}`}
            onClick={submit}
          >
            <Text>提交</Text>
          </View>
        ) : (
          <View className={styles.nextBtn} onClick={next}><Text>下一题</Text></View>
        )}
      </View>
    </>
  );
}
