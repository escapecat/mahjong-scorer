import { View, Image, Text } from '@tarojs/components';
import { usePractice } from './usePractice';
import { BottomNav } from '../../components/BottomNav';
import { tileIconPath } from '../../engine/tileIcon';
import { tileFromIndex, tileEquals, tileToDisplay } from '../../engine/models/tile';
import styles from './index.module.css';

const WIND_LABEL: Record<string, string> = { '0': '东', '1': '南', '2': '西', '3': '北' };

export default function Practice() {
  const { question, selected, submitted, isCorrect, streak, best, toggleSelected, submit, next } = usePractice();

  if (!question) {
    return (
      <View className={styles.container}>
        <View className={styles.content}>
          <Text className={styles.loading}>加载中…</Text>
        </View>
        <BottomNav active='practice' />
      </View>
    );
  }

  // Build sorted tile list from counts
  const handTiles: { tile: ReturnType<typeof tileFromIndex>; isWinning: boolean }[] = [];
  let winMarked = false;
  for (let i = 0; i < 34; i++) {
    const count = question.counts.getByIndex(i);
    for (let j = 0; j < count; j++) {
      const t = tileFromIndex(i);
      const isWin = !winMarked && question.game.winningTile && tileEquals(t, question.game.winningTile);
      if (isWin) winMarked = true;
      handTiles.push({ tile: t, isWinning: !!isWin });
    }
  }

  return (
    <View className={styles.container}>
      <View className={styles.content}>
        <View className={styles.header}>
          <View className={styles.title}>
            <Text className={styles.titleIcon}>📝</Text>
            <Text className={styles.titleText}>练习模式</Text>
          </View>
          <View className={styles.stats}>
            <Text className={styles.statBlock}>连对 <Text className={styles.statNum}>{streak}</Text></Text>
            <Text className={styles.statBlock}>最佳 <Text className={styles.statNum}>{best}</Text></Text>
          </View>
        </View>

        {/* Game info */}
        <View className={styles.gameInfo}>
          <Text className={styles.infoChip}>{question.game.isSelfDraw ? '自摸' : '点炮'}</Text>
          <Text className={styles.infoChip}>门风 {WIND_LABEL[String(question.game.seatWind.rank)]}</Text>
          <Text className={styles.infoChip}>圈风 {WIND_LABEL[String(question.game.roundWind.rank)]}</Text>
          {question.game.flowerCount > 0 && (
            <Text className={styles.infoChip}>花 {question.game.flowerCount}</Text>
          )}
          {question.game.isLastTile && <Text className={styles.infoChip}>海底</Text>}
          {question.game.isWinningTileLast && <Text className={styles.infoChip}>绝张</Text>}
        </View>

        {/* Hand */}
        <View className={styles.handBar}>
          {handTiles.map(({ tile, isWinning }, i) => (
            isWinning ? (
              <View key={i} className={styles.winMarker}>
                <Image className={styles.tileImg} src={tileIconPath(tile)} mode='aspectFit' />
              </View>
            ) : (
              <Image key={i} className={styles.tileImg} src={tileIconPath(tile)} mode='aspectFit' />
            )
          ))}
        </View>

        {/* Question prompt */}
        <View className={styles.prompt}>
          <Text>选出所有适用的番种：</Text>
        </View>

        {/* Multiple choice options */}
        <View className={styles.options}>
          {question.options.map(opt => {
            const isSelected = selected.has(opt.name);
            let cls = styles.option;
            if (submitted) {
              if (opt.isCorrect && isSelected) cls = `${styles.option} ${styles.correctSelected}`;
              else if (opt.isCorrect && !isSelected) cls = `${styles.option} ${styles.correctMissed}`;
              else if (!opt.isCorrect && isSelected) cls = `${styles.option} ${styles.wrongSelected}`;
              else cls = `${styles.option} ${styles.notSelected}`;
            } else if (isSelected) {
              cls = `${styles.option} ${styles.selected}`;
            }

            return (
              <View key={opt.name} className={cls} onClick={() => toggleSelected(opt.name)}>
                <Text className={styles.optName}>{opt.name}</Text>
                <Text className={styles.optPts}>{opt.points} 番</Text>
              </View>
            );
          })}
        </View>

        {/* Result panel */}
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

        {/* Action button */}
        <View className={styles.actions}>
          {!submitted ? (
            <View className={styles.submitBtn} onClick={submit}>
              <Text>提交</Text>
            </View>
          ) : (
            <View className={styles.nextBtn} onClick={next}>
              <Text>下一题</Text>
            </View>
          )}
        </View>
      </View>
      <BottomNav active='practice' />
    </View>
  );
}
