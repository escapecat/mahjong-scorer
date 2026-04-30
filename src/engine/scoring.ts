/**
 * 国标 (Chinese Standard) mahjong session scoring, with configurable base.
 *
 * The standard 国标 rule uses 起和番 = 8 (everyone pays the base + fan winner).
 * Many local variants use a different base (0 / 1 / 5 / 10 / etc.) — set
 * `Round.baseScore` accordingly. If unset, defaults to 8.
 *
 * Formula (parameterized over `b` = base score):
 *  - 自摸: winner +(b + 番)×3,  each loser -(b + 番)
 *  - 点炮: winner +(b + 番) + b + b,  discarder -(b + 番),  others -b each
 *  - 流局 (黄庄): 0 transfer
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
  /** Base unit ("起和番"). 国标 default is 8. Some houses use 0/1/5/10. */
  baseScore?: number;
  /** Free-form note, e.g. "包牌张三" — currently unused, reserved for Phase 2. */
  notes?: string;
  /** Manual override: if present, used INSTEAD of auto-computed deltas.
   *  Lets users record house-rule scoring (一炮多响、罚分 etc). */
  manualDeltas?: ScoreDelta;
}

/** Per-seat score delta for one round; sum is always 0 for valid rounds. */
export type ScoreDelta = readonly [number, number, number, number];

export function computeRoundDeltas(round: Round): ScoreDelta {
  // Honor manual overrides first — used when local rules don't match standard
  // 国标 (e.g. different 起和番, 一炮多响, 包牌, 罚分).
  if (round.manualDeltas) return round.manualDeltas;
  if (round.type === 'draw') {
    return [0, 0, 0, 0];
  }

  const winner = round.winnerSeat;
  if (winner == null || winner < 0 || winner > 3) {
    return [0, 0, 0, 0];
  }
  const fan = round.fan ?? 0;
  const base = round.baseScore ?? 8;
  const winUnit = base + fan;

  const out: number[] = [0, 0, 0, 0];

  if (round.type === 'selfDraw') {
    out[winner] = winUnit * 3;
    for (let i = 0; i < 4; i++) {
      if (i !== winner) out[i] = -winUnit;
    }
    return [out[0], out[1], out[2], out[3]];
  }

  // discard
  const discarder = round.discarderSeat;
  if (discarder == null || discarder < 0 || discarder > 3 || discarder === winner) {
    return [0, 0, 0, 0];
  }
  out[winner] = winUnit + base + base;
  out[discarder] = -winUnit;
  for (let i = 0; i < 4; i++) {
    if (i !== winner && i !== discarder) out[i] = -base;
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
