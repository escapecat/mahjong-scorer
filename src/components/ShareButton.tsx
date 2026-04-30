import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [generating, setGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Revoke blob URL when it changes / component unmounts to free memory
  useEffect(() => {
    return () => {
      if (imageUrl && imageUrl.startsWith('blob:')) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  async function generate() {
    setShowPreview(true);
    setGenerating(true);
    setImageUrl(null);
    setImageBlob(null);

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
      // Use a Blob URL instead of a base64 data URL: the long-press
      // "Save Image" menu on mobile Safari/Chrome is much more reliable
      // with blob: URLs than with multi-hundred-KB data: URLs.
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png')
      );
      if (!blob) throw new Error('canvas.toBlob returned null');
      setImageBlob(blob);
      setImageUrl(URL.createObjectURL(blob));
    } catch (e) {
      console.error('html2canvas failed:', e);
    } finally {
      setGenerating(false);
    }
  }

  const canWebShare =
    typeof navigator !== 'undefined' &&
    typeof (navigator as any).canShare === 'function' &&
    typeof (navigator as any).share === 'function';

  async function shareImage() {
    if (!imageBlob) return;
    const file = new File(
      [imageBlob],
      `mahjong-${result.totalFan}fan-${Date.now()}.png`,
      { type: 'image/png' }
    );
    if (canWebShare && (navigator as any).canShare({ files: [file] })) {
      try {
        await (navigator as any).share({
          files: [file],
          title: `${result.totalFan}番`,
        });
        return;
      } catch (e) {
        // User cancelled, or share failed — fall through to download.
      }
    }
    downloadImage();
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
    setImageBlob(null);
  }

  const modal = showPreview ? (
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
              {canWebShare ? (
                <View className={styles.downloadBtn} onClick={shareImage}>
                  <Text>📤 保存 / 分享</Text>
                </View>
              ) : (
                <View className={styles.downloadBtn} onClick={downloadImage}>
                  <Text>⬇ 下载图片</Text>
                </View>
              )}
              <Text className={styles.hint}>
                {canWebShare
                  ? '点上方按钮调出系统分享面板（"保存到相册"/微信 等）'
                  : '长按图片即可"存到相册"或转发到微信'}
              </Text>
            </View>
          </>
        )}
      </View>
    </View>
  ) : null;

  return (
    <>
      <View className={styles.shareBtn} onClick={generate}>
        <Text>📷 生成分享图</Text>
      </View>
      {/* Portal to body so the modal escapes any Taro page wrapper / scroll container
       *  and reliably covers the TileKeyboard + BottomNav at the viewport bottom. */}
      {modal && typeof document !== 'undefined' && createPortal(modal, document.body)}
    </>
  );
}
