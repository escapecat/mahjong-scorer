import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { View, Text, Input } from '@tarojs/components';
import { type Round, type WinType, computeRoundDeltas, SEAT_LABELS } from '../engine/scoring';
import styles from './RoundEntryModal.module.css';

interface Props {
  players: readonly [string, string, string, string];
  initial?: Round;     // present when editing
  onSave: (round: Round) => void;
  onCancel: () => void;
}

export function RoundEntryModal({ players, initial, onSave, onCancel }: Props) {
  const [type, setType] = useState<WinType>(initial?.type ?? 'selfDraw');
  const [winnerSeat, setWinnerSeat] = useState<number | null>(initial?.winnerSeat ?? null);
  const [discarderSeat, setDiscarderSeat] = useState<number | null>(initial?.discarderSeat ?? null);
  const [fanText, setFanText] = useState<string>(initial?.fan != null ? String(initial.fan) : '8');

  // When switching to selfDraw, drop the discarder; switching to draw, drop both
  useEffect(() => {
    if (type === 'selfDraw') setDiscarderSeat(null);
    if (type === 'draw') {
      setWinnerSeat(null);
      setDiscarderSeat(null);
    }
  }, [type]);

  const fan = parseInt(fanText, 10);
  const fanValid = !isNaN(fan) && fan >= 0;
  const canSave =
    type === 'draw'
      ? true
      : type === 'selfDraw'
        ? winnerSeat != null && fanValid && fan >= 8
        : winnerSeat != null && discarderSeat != null && winnerSeat !== discarderSeat && fanValid && fan >= 8;

  // Live preview of deltas
  const preview = canSave && type !== 'draw'
    ? computeRoundDeltas({
        id: '_preview',
        timestamp: 0,
        type,
        winnerSeat: winnerSeat!,
        discarderSeat: discarderSeat ?? undefined,
        fan,
      })
    : null;

  function save() {
    if (!canSave) return;
    onSave({
      id: initial?.id ?? `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: initial?.timestamp ?? Date.now(),
      type,
      winnerSeat: winnerSeat ?? undefined,
      discarderSeat: type === 'discard' ? discarderSeat ?? undefined : undefined,
      fan: type === 'draw' ? undefined : fan,
    });
  }

  const seatBtn = (seat: number, selected: boolean, onClick: () => void) => (
    <View
      key={seat}
      className={`${styles.seatBtn} ${selected ? styles.seatBtnActive : ''}`}
      onClick={onClick}
    >
      <Text className={styles.seatLabel}>{SEAT_LABELS[seat]}</Text>
      <Text className={styles.seatName}>{players[seat]}</Text>
    </View>
  );

  const modal = (
    <View className={styles.modal} onClick={onCancel}>
      <View className={styles.modalInner} onClick={(e: any) => e.stopPropagation && e.stopPropagation()}>
        <View className={styles.modalHeader}>
          <Text className={styles.modalTitle}>{initial ? '编辑这一把' : '录入这一把'}</Text>
          <View className={styles.modalClose} onClick={onCancel}>
            <Text>✕</Text>
          </View>
        </View>

        <View className={styles.formRow}>
          <Text className={styles.formLabel}>结果</Text>
          <View className={styles.toggleRow}>
            <View className={`${styles.toggle} ${type === 'selfDraw' ? styles.toggleActive : ''}`} onClick={() => setType('selfDraw')}>
              <Text>自摸</Text>
            </View>
            <View className={`${styles.toggle} ${type === 'discard' ? styles.toggleActive : ''}`} onClick={() => setType('discard')}>
              <Text>点炮</Text>
            </View>
            <View className={`${styles.toggle} ${type === 'draw' ? styles.toggleActive : ''}`} onClick={() => setType('draw')}>
              <Text>黄庄</Text>
            </View>
          </View>
        </View>

        {type !== 'draw' && (
          <View className={styles.formRow}>
            <Text className={styles.formLabel}>赢家</Text>
            <View className={styles.seatRow}>
              {[0, 1, 2, 3].map((s) => seatBtn(s, winnerSeat === s, () => setWinnerSeat(s)))}
            </View>
          </View>
        )}

        {type === 'discard' && (
          <View className={styles.formRow}>
            <Text className={styles.formLabel}>谁打的(点炮方)</Text>
            <View className={styles.seatRow}>
              {[0, 1, 2, 3].map((s) =>
                seatBtn(s, discarderSeat === s, () => s !== winnerSeat && setDiscarderSeat(s))
              )}
            </View>
          </View>
        )}

        {type !== 'draw' && (
          <View className={styles.formRow}>
            <Text className={styles.formLabel}>番数 <Text className={styles.formHint}>(含花牌,≥8)</Text></Text>
            <Input
              className={styles.fanInput}
              type='number'
              value={fanText}
              onInput={(e) => setFanText(e.detail.value)}
              placeholder='8'
            />
          </View>
        )}

        {preview && (
          <View className={styles.preview}>
            <Text className={styles.previewLabel}>本回合得分</Text>
            <View className={styles.previewRow}>
              {preview.map((d, i) => (
                <View key={i} className={styles.previewCell}>
                  <Text className={styles.previewSeat}>{SEAT_LABELS[i]}</Text>
                  <Text className={d > 0 ? styles.previewPos : d < 0 ? styles.previewNeg : styles.previewZero}>
                    {d > 0 ? `+${d}` : d}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View className={styles.actionRow}>
          <View className={styles.cancelBtn} onClick={onCancel}>
            <Text>取消</Text>
          </View>
          <View
            className={`${styles.saveBtn} ${canSave ? '' : styles.saveBtnDisabled}`}
            onClick={() => canSave && save()}
          >
            <Text>保存</Text>
          </View>
        </View>
      </View>
    </View>
  );

  // H5 portals to body so the modal escapes the page wrapper. In weapp
  // there's no DOM/react-dom, so render in-place — `position: fixed`
  // already covers the viewport correctly there.
  const useDomPortal =
    process.env.TARO_ENV === 'h5' &&
    typeof document !== 'undefined' &&
    !!document.body;
  if (useDomPortal) {
    return createPortal(modal, document.body);
  }
  return modal;
}
