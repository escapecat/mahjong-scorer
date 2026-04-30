import { useState, useRef } from 'react';
import { View, Text } from '@tarojs/components';
import html2canvas from 'html2canvas';
import { ShareCard } from './ShareCard';
import type { EvaluationResult, GameContext } from '../engine/models/types';
import type { Meld } from '../engine/models/meld';
import { TileSet } from '../engine/models/tileSet';
import styles from './ShareButton.module.css';

interface Props {
  result: EvaluationResult;
  handCounts: TileSet;
  lockedMelds: readonly Meld[];
  game: GameContext;
}

export function ShareButton({ result, handCounts, lockedMelds, game }: Props) {
  const [showPreview, setShowPreview] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  async function generate() {
    setShowPreview(true);
    setGenerating(true);
    setImageUrl(null);

    // Wait for the ShareCard to render
    await new Promise<void>(r => setTimeout(r, 100));

    const node = document.getElementById('share-card');
    if (!node) {
      setGenerating(false);
      return;
    }

    try {
      const canvas = await html2canvas(node, {
        backgroundColor: null,
        scale: 2, // 2x for sharper output
        logging: false,
        useCORS: true,
      });
      const dataUrl = canvas.toDataURL('image/png');
      setImageUrl(dataUrl);
    } catch (e) {
      console.error('html2canvas failed:', e);
    } finally {
      setGenerating(false);
    }
  }

  function downloadImage() {
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `mahjong-${result.totalFan}fan-${Date.now()}.png`;
    a.click();
  }

  function close() {
    setShowPreview(false);
    setImageUrl(null);
  }

  return (
    <>
      <View className={styles.shareBtn} onClick={generate}>
        <Text>📷 生成分享图</Text>
      </View>

      {showPreview && (
        <View className={styles.modal} onClick={close}>
          <View className={styles.modalInner} onClick={(e: any) => e.stopPropagation && e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>分享图片</Text>
              <View className={styles.modalClose} onClick={close}>
                <Text>✕</Text>
              </View>
            </View>

            {/* Hidden render area for html2canvas to capture */}
            <View className={styles.hiddenStage}>
              <ShareCard ref={cardRef} result={result} handCounts={handCounts} lockedMelds={lockedMelds} game={game} />
            </View>

            {/* Preview area */}
            {generating && (
              <View className={styles.loading}>
                <Text>生成中…</Text>
              </View>
            )}
            {imageUrl && (
              <>
                <img className={styles.previewImg} src={imageUrl} alt='share' />
                <View className={styles.actions}>
                  <View className={styles.downloadBtn} onClick={downloadImage}>
                    <Text>下载图片</Text>
                  </View>
                  <Text className={styles.hint}>长按图片可以保存或转发到微信</Text>
                </View>
              </>
            )}
          </View>
        </View>
      )}
    </>
  );
}
