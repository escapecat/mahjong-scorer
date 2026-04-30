import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { View, Image, Text } from '@tarojs/components';
import type { EvaluationResult, GameContext } from '../engine/models/types';
import type { Tile } from '../engine/models/tile';
import { tileEquals } from '../engine/models/tile';
import type { Meld } from '../engine/models/meld';
import { meldTiles } from '../engine/models/meld';
import { tileIconPath } from '../engine/tileIcon';
import { tileFromIndex } from '../engine/models/tile';
import { TileSet } from '../engine/models/tileSet';
import styles from './ShareCard.module.css';

interface Props {
  result: EvaluationResult;
  handCounts: TileSet;       // concealed hand tiles only
  lockedMelds: readonly Meld[];
  game: GameContext;
}

const MELD_TAG: Record<string, string> = { sequence: '吃', triplet: '碰', kong: '杠' };
const WIND_LABEL = ['东', '南', '西', '北'];

/**
 * A "share card" — pixel-perfect rendering of the win result, designed to be
 * captured as a PNG via html2canvas.
 */
export const ShareCard = forwardRef<HTMLDivElement, Props>((props, ref) => {
  const { result, handCounts, lockedMelds, game } = props;

  const handTiles: Tile[] = [];
  for (let i = 0; i < 34; i++) {
    for (let j = 0; j < handCounts.getByIndex(i); j++) {
      handTiles.push(tileFromIndex(i));
    }
  }

  let winMarked = false;

  return (
    <View id='share-card' className={styles.card} ref={ref as any}>
      <View className={styles.brand}>
        <Text className={styles.brandTitle}>🀄 国标麻将</Text>
        <Text className={styles.brandSub}>Mahjong Scorer</Text>
      </View>

      {/* Big total fan */}
      <View className={styles.totalSection}>
        <Text className={styles.totalNum}>{result.totalFan}</Text>
        <Text className={styles.totalLabel}>番</Text>
      </View>

      {/* Game info chips */}
      <View className={styles.infoRow}>
        <Text className={styles.infoChip}>{game.isSelfDraw ? '自摸' : '点炮'}</Text>
        <Text className={styles.infoChip}>门风 {WIND_LABEL[game.seatWind.rank]}</Text>
        <Text className={styles.infoChip}>圈风 {WIND_LABEL[game.roundWind.rank]}</Text>
        {game.flowerCount > 0 && <Text className={styles.infoChip}>花 {game.flowerCount}</Text>}
        {game.isLastTile && <Text className={styles.infoChip}>海底</Text>}
        {game.isWinningTileLast && <Text className={styles.infoChip}>绝张</Text>}
      </View>

      {/* Hand */}
      <View className={styles.handRow}>
        {handTiles.map((t, i) => {
          const isWin = !winMarked && game.winningTile && tileEquals(t, game.winningTile);
          if (isWin) winMarked = true;
          return isWin ? (
            <View key={i} className={styles.winTileWrapper}>
              <Image className={styles.tileImg} src={tileIconPath(t)} mode='aspectFit' />
            </View>
          ) : (
            <Image key={i} className={styles.tileImg} src={tileIconPath(t)} mode='aspectFit' />
          );
        })}
        {lockedMelds.length > 0 && <Text className={styles.handSep}>│</Text>}
        {lockedMelds.map((meld, mi) => (
          <View key={`m-${mi}`} className={styles.meldGroup}>
            {meldTiles(meld).map((t, ti) => (
              <Image key={ti} className={styles.tileImg} src={tileIconPath(t)} mode='aspectFit' />
            ))}
            <Text className={styles.meldTag}>{MELD_TAG[meld.type]}</Text>
          </View>
        ))}
      </View>

      {/* Decomposition */}
      {result.tileGroups && result.tileGroups.length > 0 && (
        <View className={styles.decomp}>
          {result.tileGroups.map((group, gi) => (
            <View key={gi} className={styles.decompGroup}>
              {group.map((tile, ti) => (
                <Image key={ti} className={styles.tileImgSmall} src={tileIconPath(tile)} mode='aspectFit' />
              ))}
            </View>
          ))}
        </View>
      )}

      {/* Fan list */}
      <View className={styles.fanList}>
        {result.fans.map((f, i) => (
          <View key={i} className={styles.fanItem}>
            <Text className={styles.fanName}>{f.name}</Text>
            <Text className={styles.fanPts}>{f.points} 番</Text>
          </View>
        ))}
      </View>

      <View className={styles.footer}>
        <Text className={styles.footerText}>国标麻将算番器 · escapecat.github.io/mahjong-scorer</Text>
      </View>
    </View>
  );
});
