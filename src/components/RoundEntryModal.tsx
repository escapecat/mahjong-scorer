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
  const [mode, setMode] = useState<'auto' | 'manual'>(initial?.manualDeltas ? 'manual' : 'auto');
  const [type, setType] = useState<WinType>(initial?.type ?? 'selfDraw');
  const [winnerSeat, setWinnerSeat] = useState<number | null>(initial?.winnerSeat ?? null);
  const [discarderSeat, setDiscarderSeat] = useState<number | null>(initial?.discarderSeat ?? null);
  const [fanText, setFanText] = useState<string>(initial?.fan != null ? String(initial.fan) : '8');
  const [manualText, setManualText] = useState<[string, string, string, string]>(
    initial?.manualDeltas
      ? [String(initial.manualDeltas[0]), String(initial.manualDeltas[1]), String(initial.manualDeltas[2]), String(initial.manualDeltas[3])]
      : ['', '', '', '']
  );

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

  const manualNums = manualText.map((s) => {
    const n = parseInt(s, 10);
    return isNaN(n) ? 0 : n;
  }) as [number, number, number, number];
  const manualSum = manualNums.reduce((a, b) => a + b, 0);
  const manualAnyFilled = manualText.some((s) => s.trim() !== '');

  const canSave =
    mode === 'manual'
      ? manualAnyFilled
      : type === 'draw'
        ? true
        : type === 'selfDraw'
          ? winnerSeat != null && fanValid && fan >= 8
          : winnerSeat != null && discarderSeat != null && winnerSeat !== discarderSeat && fanValid && fan >= 8;

  // Live preview of deltas (auto mode only — manual mode shows the inputs themselves)
  const preview = mode === 'auto' && canSave && type !== 'draw'
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
    const id = initial?.id ?? `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const timestamp = initial?.timestamp ?? Date.now();
    if (mode === 'manual') {
      // Use 'discard' as a neutral type for the round; deltas are taken from manualDeltas
      // and we still store the winner/fan if the user filled them, for historical context.
      onSave({
        id,
        timestamp,
        type: type === 'draw' ? 'draw' : type,
        winnerSeat: winnerSeat ?? undefined,
        discarderSeat: type === 'discard' ? discarderSeat ?? undefined : undefined,
        fan: type === 'draw' ? undefined : (fanValid ? fan : undefined),
        manualDeltas: manualNums,
      });
      return;
    }
    onSave({
      id,
      timestamp,
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
          <Text className={styles.formLabel}>计分方式</Text>
          <View className={styles.toggleRow}>
            <View className={`${styles.toggle} ${mode === 'auto' ? styles.toggleActive : ''}`} onClick={() => setMode('auto')}>
              <Text>自动算(国标)</Text>
            </View>
            <View className={`${styles.toggle} ${mode === 'manual' ? styles.toggleActive : ''}`} onClick={() => setMode('manual')}>
              <Text>手动填分</Text>
            </View>
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
            <Text className={styles.formLabel}>赢家{mode === 'manual' ? <Text className={styles.formHint}> (可选,记录用)</Text> : null}</Text>
            <View className={styles.seatRow}>
              {[0, 1, 2, 3].map((s) => seatBtn(s, winnerSeat === s, () => setWinnerSeat(s)))}
            </View>
          </View>
        )}

        {type === 'discard' && (
          <View className={styles.formRow}>
            <Text className={styles.formLabel}>谁打的(点炮方){mode === 'manual' ? <Text className={styles.formHint}> (可选,记录用)</Text> : null}</Text>
            <View className={styles.seatRow}>
              {[0, 1, 2, 3].map((s) =>
                seatBtn(s, discarderSeat === s, () => s !== winnerSeat && setDiscarderSeat(s))
              )}
            </View>
          </View>
        )}

        {type !== 'draw' && (
          <View className={styles.formRow}>
            <Text className={styles.formLabel}>
              番数
              {mode === 'auto'
                ? <Text className={styles.formHint}> (含花牌,≥8)</Text>
                : <Text className={styles.formHint}> (可选,记录用)</Text>}
            </Text>
            <Input
              className={styles.fanInput}
              type='number'
              value={fanText}
              onInput={(e) => setFanText(e.detail.value)}
              placeholder='8'
            />
          </View>
        )}

        {mode === 'manual' && type !== 'draw' && (
          <View className={styles.formRow}>
            <Text className={styles.formLabel}>各人得分 <Text className={styles.formHint}>(正数赢、负数输,可不为零)</Text></Text>
            <View className={styles.manualRow}>
              {[0, 1, 2, 3].map((s) => (
                <View key={s} className={styles.manualCell}>
                  <Text className={styles.manualSeat}>{SEAT_LABELS[s]}</Text>
                  <Input
                    className={styles.manualInput}
                    type='digit'
                    value={manualText[s]}
                    placeholder='0'
                    onInput={(e) => {
                      const next = [...manualText] as [string, string, string, string];
                      next[s] = e.detail.value;
                      setManualText(next);
                    }}
                  />
                </View>
              ))}
            </View>
            <Text className={`${styles.manualSumHint} ${manualSum === 0 ? styles.manualSumOk : styles.manualSumWarn}`}>
              4 人合计: {manualSum >= 0 ? '+' : ''}{manualSum}{manualSum !== 0 ? ' (一般为 0)' : ''}
            </Text>
          </View>
        )}

        {preview && (
          <View className={styles.preview}>
            <Text className={styles.previewLabel}>本回合得分(自动算)</Text>
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
