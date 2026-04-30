import type { FanRule, FanContext } from '../models/types';
import { isTripletOrKong } from '../models/meld';
import { FN } from './fanNames';
import { NUMBER_SUIT_LIST, SUIT_PERMUTATIONS, type Suit } from '../models/tile';

/** Group triplet ranks by suit */
function tripBySuit(ctx: FanContext): Map<Suit, number[]> {
  const map = new Map<Suit, number[]>();
  for (const s of NUMBER_SUIT_LIST) map.set(s, []);
  for (const m of ctx.decomposition.melds) {
    if (isTripletOrKong(m) && (m.start.suit === 'man' || m.start.suit === 'pin' || m.start.suit === 'sou')) {
      map.get(m.start.suit)!.push(m.start.rank);
    }
  }
  return map;
}

function getMaxConsecutiveTriplets(bySuit: Map<Suit, number[]>): number {
  let max = 0;
  for (const ranks of bySuit.values()) {
    if (ranks.length < 2) continue;
    const sorted = [...new Set(ranks)].sort((a, b) => a - b);
    let run = 1;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === sorted[i - 1] + 1) run++;
      else run = 1;
      max = Math.max(max, run);
    }
  }
  return max;
}

function sameNumberTripletCounts(ctx: FanContext): number[] {
  const result = new Array(9).fill(0);
  for (const m of ctx.decomposition.melds) {
    if (isTripletOrKong(m) && (m.start.suit === 'man' || m.start.suit === 'pin' || m.start.suit === 'sou')) {
      result[m.start.rank]++;
    }
  }
  return result;
}

export const tripletPatternFans: FanRule[] = [
  // ── 48番 ──
  {
    name: FN.YiSeSiJieGao, points: 48,
    description: '同一花色4副刻子序数依次递增1',
    excludes: [FN.YiSeSanTongShun, FN.YiSeSanJieGao, FN.PengPengHe, FN.QueYiMen],
    match: (ctx) => getMaxConsecutiveTriplets(tripBySuit(ctx)) >= 4 ? 1 : 0,
  },

  // ── 24番 ──
  {
    name: FN.YiSeSanJieGao, points: 24,
    description: '同一花色3副刻子序数依次递增1',
    excludes: [FN.YiSeSanTongShun],
    match: (ctx) => {
      const max = getMaxConsecutiveTriplets(tripBySuit(ctx));
      return max >= 3 && max < 4 ? 1 : 0;
    },
  },

  // ── 16番 ──
  {
    name: FN.SanTongKe, points: 16,
    description: '3副序数相同的刻子（万筒条各一）',
    excludes: [FN.ShuangTongKe],
    match: (ctx) => sameNumberTripletCounts(ctx).some(c => c >= 3) ? 1 : 0,
  },

  // ── 8番 ──
  {
    name: FN.SanSeSanJieGao, points: 8,
    description: '三种花色各一副刻子，序数依次递增1',
    excludes: [],
    match: (ctx) => {
      const bs = tripBySuit(ctx);
      for (let start = 0; start <= 6; start++) {
        for (const [s0, s1, s2] of SUIT_PERMUTATIONS) {
          if (bs.get(s0)!.includes(start)
            && bs.get(s1)!.includes(start + 1)
            && bs.get(s2)!.includes(start + 2)) return 1;
        }
      }
      return 0;
    },
  },

  // ── 2番 ──
  {
    name: FN.ShuangTongKe, points: 2,
    description: '2副序数相同的刻子',
    excludes: [],
    match: (ctx) => {
      const counts = sameNumberTripletCounts(ctx);
      return counts.some(c => c >= 3) ? 0 : counts.some(c => c >= 2) ? 1 : 0;
    },
  },
];
