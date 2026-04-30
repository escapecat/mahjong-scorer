/**
 * 国标 (Chinese Standard) mahjong session scoring.
 *
 * Per 1998 中国麻将竞赛规则:
 *  - 起和番 = 8 (minimum fan to claim a win, included in each transaction).
 *  - 自摸: 三家各向赢家支付 (8 + 番).
 *      winner: +(8 + 番) × 3
 *      each loser: -(8 + 番)
 *  - 点炮: 出冲者支付 (8 + 番),其他两家各支付 8.
 *      winner: +(8 + 番) + 8 + 8 = +(24 + 番)
 *      discarder: -(8 + 番)
 *      others: -8 each
 *  - 流局 (黄庄): 没人胡牌,本回合 0 流转。
 *
 * `fan` here is the TOTAL fan including the flower bonus the engine already
 * computes — callers should pass `evaluationResult.totalFan` straight in.
 */

export type WinType = 'selfDraw' | 'discard' | 'draw';

export interface Round {
  /** Stable id, generated when the round is recorded. */
  id: string;
  /** Unix ms when the round was recorded (used for "今日"/"本周" grouping). */
  timestamp: number;
  type: WinType;
  /** Seat index 0-3 (E/S/W/N). Required for selfDraw / discard. */
  winnerSeat?: number;
  /** Seat index 0-3. Required only for discard wins. */
  discarderSeat?: number;
  /** Total fan claimed (≥ 8 for valid wins, but we don't enforce). */
  fan?: number;
  /** Free-form note, e.g. "包牌张三" — currently unused, reserved for Phase 2. */
  notes?: string;
}

/** Per-seat score delta for one round; sum is always 0 for valid rounds. */
export type ScoreDelta = readonly [number, number, number, number];

export function computeRoundDeltas(round: Round): ScoreDelta {
  if (round.type === 'draw') {
    return [0, 0, 0, 0];
  }

  const winner = round.winnerSeat;
  if (winner == null || winner < 0 || winner > 3) {
    return [0, 0, 0, 0];
  }
  const fan = round.fan ?? 0;
  const baseUnit = 8 + fan;

  const out: number[] = [0, 0, 0, 0];

  if (round.type === 'selfDraw') {
    out[winner] = baseUnit * 3;
    for (let i = 0; i < 4; i++) {
      if (i !== winner) out[i] = -baseUnit;
    }
    return [out[0], out[1], out[2], out[3]];
  }

  // discard
  const discarder = round.discarderSeat;
  if (discarder == null || discarder < 0 || discarder > 3 || discarder === winner) {
    return [0, 0, 0, 0];
  }
  out[winner] = baseUnit + 8 + 8;
  out[discarder] = -baseUnit;
  for (let i = 0; i < 4; i++) {
    if (i !== winner && i !== discarder) out[i] = -8;
  }
  return [out[0], out[1], out[2], out[3]];
}

/** Sum a list of round deltas into per-seat totals. */
export function sumRoundDeltas(rounds: readonly Round[]): ScoreDelta {
  const total: number[] = [0, 0, 0, 0];
  for (const r of rounds) {
    const d = computeRoundDeltas(r);
    for (let i = 0; i < 4; i++) total[i] += d[i];
  }
  return [total[0], total[1], total[2], total[3]];
}

export const SEAT_LABELS = ['东', '南', '西', '北'] as const;
