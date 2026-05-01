import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { View, Text, Canvas, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { drawAggregateCard, measureAggregateCardHeight } from './drawAggregateCard';
import { SHARE_CARD_WIDTH } from './canvasUtils';
import type { PlayerAggregate, TimeRange } from '../pages/session/aggregation';
import styles from './ShareButton.module.css';

interface Props {
  players: readonly PlayerAggregate[];
  range: TimeRange;
}

const CANVAS_ID = 'aggregate-share-canvas';

export function AggregateShareButton({ players, range }: Props) {
  const [showPreview, setShowPreview] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    return () => {
      if (imageUrl && imageUrl.startsWith('blob:')) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  async function generate() {
    if (players.length === 0) {
      Taro.showToast({ title: '没有累计数据', icon: 'none', duration: 1500 });
      return;
    }
    setShowPreview(true);
    setGenerating(true);
    setImageUrl(null);
    setImageBlob(null);

    try {
      if (process.env.TARO_ENV === 'h5') {
        await generateH5();
      } else {
        await generateWeapp();
      }
    } catch (e) {
      console.error('AggregateShareButton failed:', e);
      Taro.showToast({ title: '生成失败', icon: 'none', duration: 1500 });
    } finally {
      setGenerating(false);
    }
  }

  async function generateH5() {
    const SCALE = 2;
    const w = SHARE_CARD_WIDTH;
    const h = measureAggregateCardHeight(players);
    const canvas = document.createElement('canvas');
    canvas.width = w * SCALE;
    canvas.height = h * SCALE;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no 2d context');
    ctx.scale(SCALE, SCALE);
    drawAggregateCard(ctx, players, range);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/png')
    );
    if (!blob) throw new Error('canvas.toBlob returned null');
    setImageBlob(blob);
    setImageUrl(URL.createObjectURL(blob));
  }

  async function generateWeapp() {
    const SCALE = 2;
    const w = SHARE_CARD_WIDTH;
    const h = measureAggregateCardHeight(players);

    await new Promise<void>((r) => setTimeout(r, 50));

    const node = await new Promise<any>((resolve, reject) => {
      const query = Taro.createSelectorQuery();
      query.select(`#${CANVAS_ID}`)
        .fields({ node: true, size: true } as any)
        .exec((res: any[]) => {
          if (!res || !res[0] || !res[0].node) {
            reject(new Error('canvas node not found'));
          } else {
            resolve(res[0]);
          }
        });
    });

    const canvas = node.node;
    canvas.width = w * SCALE;
    canvas.height = h * SCALE;
    const ctx = canvas.getContext('2d');
    ctx.scale(SCALE, SCALE);
    drawAggregateCard(ctx, players, range);

    const tmp = await Taro.canvasToTempFilePath({
      canvas,
      x: 0,
      y: 0,
      width: w * SCALE,
      height: h * SCALE,
      destWidth: w * SCALE,
      destHeight: h * SCALE,
      fileType: 'png',
    } as any);

    setImageUrl((tmp as any).tempFilePath);
  }

  const canWebShare =
    process.env.TARO_ENV === 'h5' &&
    typeof navigator !== 'undefined' &&
    typeof (navigator as any).canShare === 'function' &&
    typeof (navigator as any).share === 'function';

  async function shareImage() {
    if (process.env.TARO_ENV !== 'h5') {
      if (!imageUrl) return;
      try {
        await Taro.saveImageToPhotosAlbum({ filePath: imageUrl });
        Taro.showToast({ title: '已保存到相册', icon: 'success', duration: 1500 });
      } catch (e: any) {
        Taro.showToast({ title: e?.errMsg || '保存失败', icon: 'none', duration: 1800 });
      }
      return;
    }
    if (!imageBlob) return;
    const file = new File([imageBlob], `mahjong-aggregate-${Date.now()}.png`, { type: 'image/png' });
    if (canWebShare && (navigator as any).canShare({ files: [file] })) {
      try {
        await (navigator as any).share({ files: [file], title: '玩家累计' });
        return;
      } catch (e) { /* user cancelled */ }
    }
    downloadImage();
  }

  function downloadImage() {
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `mahjong-aggregate-${Date.now()}.png`;
    a.click();
  }

  function close() {
    setShowPreview(false);
    setImageUrl(null);
    setImageBlob(null);
  }

  const offscreenCanvas =
    process.env.TARO_ENV !== 'h5' ? (
      <Canvas
        type='2d'
        id={CANVAS_ID}
        canvasId={CANVAS_ID}
        style={{
          position: 'fixed',
          top: '-9999px',
          left: '-9999px',
          width: `${SHARE_CARD_WIDTH}px`,
          height: `${measureAggregateCardHeight(players)}px`,
        }}
      />
    ) : null;

  const useDomPortal =
    process.env.TARO_ENV === 'h5' &&
    typeof document !== 'undefined' &&
    !!document.body;

  const modal = showPreview ? (
    <View className={styles.modal} onClick={close}>
      <View className={styles.modalInner} onClick={(e: any) => e.stopPropagation && e.stopPropagation()}>
        <View className={styles.modalHeader}>
          <Text className={styles.modalTitle}>玩家累计</Text>
          <View className={styles.modalClose} onClick={close}>
            <Text>✕</Text>
          </View>
        </View>

        {generating && <View className={styles.loading}><Text>生成中…</Text></View>}
        {imageUrl && (
          <>
            {process.env.TARO_ENV === 'h5' ? (
              <img className={styles.previewImg} src={imageUrl} alt='累计' />
            ) : (
              <Image className={styles.previewImg} src={imageUrl} mode='widthFix' showMenuByLongpress />
            )}
            <View className={styles.actions}>
              <View className={styles.downloadBtn} onClick={shareImage}>
                <Text>{process.env.TARO_ENV === 'h5' ? (canWebShare ? '📤 保存 / 分享' : '⬇ 下载图片') : '📥 保存到相册'}</Text>
              </View>
              <Text className={styles.hint}>
                {process.env.TARO_ENV === 'h5'
                  ? (canWebShare ? '调出系统分享面板' : '长按图片可保存')
                  : '保存后可在相册分享到微信'}
              </Text>
            </View>
          </>
        )}
      </View>
    </View>
  ) : null;

  return (
    <>
      <View
        className={styles.shareBtn}
        style={{
          alignSelf: 'auto',
          padding: '4px 10px',
          fontSize: '11px',
          boxShadow: 'none',
          borderRadius: '999px',
        }}
        onClick={generate}
      >
        <Text>📤 分享</Text>
      </View>
      {offscreenCanvas}
      {modal && (useDomPortal ? createPortal(modal, document.body) : modal)}
    </>
  );
}
