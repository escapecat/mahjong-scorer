import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { View, Text } from '@tarojs/components';
import html2canvas from 'html2canvas';
import { SessionShareCard } from './SessionShareCard';
import type { Session } from '../pages/session/sessionStorage';
import styles from './ShareButton.module.css';

interface Props {
  session: Session;
}

/** Reuses ShareButton.module.css for the modal/preview chrome — same UX. */
export function SessionShareButton({ session }: Props) {
  const [showPreview, setShowPreview] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [generating, setGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

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

    await new Promise<void>((r) => setTimeout(r, 150));

    const node = document.getElementById('session-share-card');
    if (!node) {
      setGenerating(false);
      return;
    }

    try {
      const canvas = await html2canvas(node, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        useCORS: true,
      });
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
    const file = new File([imageBlob], `mahjong-session-${Date.now()}.png`, { type: 'image/png' });
    if (canWebShare && (navigator as any).canShare({ files: [file] })) {
      try {
        await (navigator as any).share({ files: [file], title: '麻将战报' });
        return;
      } catch (e) { /* user cancelled */ }
    }
    downloadImage();
  }

  function downloadImage() {
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `mahjong-session-${Date.now()}.png`;
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
          <Text className={styles.modalTitle}>战报</Text>
          <View className={styles.modalClose} onClick={close}>
            <Text>✕</Text>
          </View>
        </View>

        <View className={styles.hiddenStage}>
          <SessionShareCard ref={cardRef} session={session} />
        </View>

        {generating && <View className={styles.loading}><Text>生成中…</Text></View>}
        {imageUrl && (
          <>
            <img className={styles.previewImg} src={imageUrl} alt='session' />
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
                {canWebShare ? '点上方按钮调出系统分享面板' : '长按图片可保存到相册'}
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
        <Text>📤 战报图</Text>
      </View>
      {modal && typeof document !== 'undefined' && createPortal(modal, document.body)}
    </>
  );
}
