import { useState, useEffect } from 'react';
import { View, Image, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import type { EvaluationResult, GameContext } from '../engine/models/types';
import type { Tile } from '../engine/models/tile';
import { tileEquals } from '../engine/models/tile';
import type { Meld } from '../engine/models/meld';
import { TileSet } from '../engine/models/tileSet';
import { tileIconPath } from '../engine/tileIcon';
import { ShareButton } from './ShareButton';
import styles from './ResultDisplay.module.css';

interface Props {
  result: EvaluationResult;
  winningTile: Tile | null;
  expandedFanName: string | null;
  onExpandFan: (name: string | null) => void;
  // For share image generation
  handCounts: TileSet;
  lockedMelds: readonly Meld[];
  game: GameContext;
}

export function ResultDisplay({ result, winningTile, expandedFanName, onExpandFan, handCounts, lockedMelds, game }: Props) {
  const candidates = result.allCandidates && result.allCandidates.length > 0
    ? result.allCandidates
    : [result];
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Reset selection whenever the underlying result changes (new hand, new winning tile, etc.)
  useEffect(() => {
    setSelectedIdx(0);
  }, [result]);

  const display = candidates[Math.min(selectedIdx, candidates.length - 1)] ?? result;
  const showSwitcher = candidates.length > 1;
  const bestFan = candidates[0]?.totalFan ?? display.totalFan;
  const fanDelta = display.totalFan - bestFan;

  const goPrev = () => setSelectedIdx((i) => (i - 1 + candidates.length) % candidates.length);
  const goNext = () => setSelectedIdx((i) => (i + 1) % candidates.length);

  // Render decomposition tile groups
  const renderGroups = () => {
    if (!display.tileGroups || display.tileGroups.length === 0) return null;
    let winHighlighted = false;

    return (
      <View className={styles.decomp}>
        {display.tileGroups.map((group, gIdx) => (
          <View key={gIdx} className={styles.group}>
            {group.map((t, tIdx) => {
              const isWin = !winHighlighted && winningTile && tileEquals(t, winningTile)
                && (display.winningTileGroupIndex < 0 || gIdx === display.winningTileGroupIndex);
              if (isWin) winHighlighted = true;
              return isWin ? (
                <View key={tIdx} className={styles.winMarker}>
                  <Image className={styles.tileXs} src={tileIconPath(t)} mode='aspectFit' />
                </View>
              ) : (
                <Image key={tIdx} className={styles.tileXs} src={tileIconPath(t)} mode='aspectFit' />
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  const expandedFan = display.fans.find(f => f.name === expandedFanName);

  return (
    <View className={styles.container}>
      {showSwitcher && (
        <View className={styles.switcher}>
          <Text className={styles.switcherLabel}>解 {selectedIdx + 1}/{candidates.length}</Text>
          <Text className={styles.switcherFan}>
            {display.totalFan}番
            {fanDelta < 0 && <Text className={styles.switcherDelta}> (差 {-fanDelta})</Text>}
          </Text>
          <View className={styles.switcherArrows}>
            <View className={styles.switcherBtn} onClick={goPrev}><Text>◀</Text></View>
            <View className={styles.switcherBtn} onClick={goNext}><Text>▶</Text></View>
          </View>
        </View>
      )}
      {renderGroups()}
      <View className={styles.fanBar}>
        {display.fans.map((fan, i) => (
          <View
            key={i}
            className={`${styles.fanChip} ${expandedFanName === fan.name ? styles.expanded : ''}`}
            onClick={() => onExpandFan(fan.name)}
          >
            <Text>{fan.name} {fan.points}番</Text>
          </View>
        ))}
      </View>
      {expandedFan && (
        <View className={styles.reason}>
          <Text>{expandedFan.description}</Text>
          <View
            className={styles.fanLink}
            onClick={() => Taro.navigateTo({
              url: `/pages/fantable/index?fan=${encodeURIComponent(expandedFan.name)}`,
            })}
          >
            <Text>📋 番表查看「{expandedFan.name}」 →</Text>
          </View>
        </View>
      )}
      {process.env.TARO_ENV === 'h5' && (
        <View className={styles.shareWrap}>
          <ShareButton result={display} handCounts={handCounts} lockedMelds={lockedMelds} game={game} />
        </View>
      )}
    </View>
  );
}
