import type { FanRule, FanContext } from '../models/types';
import { FN } from './fanNames';
import type { Suit } from '../models/tile';
import { NUMBER_SUIT_LIST, SUIT_PERMUTATIONS } from '../models/tile';

/** Group sequence start ranks by suit */
function seqBySuit(ctx: FanContext): Map<Suit, number[]> {
  const map = new Map<Suit, number[]>();
  for (const s of NUMBER_SUIT_LIST) map.set(s, []);
  for (const m of ctx.decomposition.melds) {
    if (m.type === 'sequence' && (m.start.suit === 'man' || m.start.suit === 'pin' || m.start.suit === 'sou')) {
      map.get(m.start.suit)!.push(m.start.rank);
    }
  }
  return map;
}

function maxSameSequenceInfo(bySuit: Map<Suit, number[]>): { count: number; suit: Suit; rank: number } {
  let best = { count: 0, suit: 'man' as Suit, rank: 0 };
  for (const [suit, ranks] of bySuit) {
    const freq = new Map<number, number>();
    for (const r of ranks) freq.set(r, (freq.get(r) ?? 0) + 1);
    for (const [rank, count] of freq) {
      if (count > best.count) best = { count, suit, rank };
    }
  }
  return best;
}

function getMaxStepSequences(bySuit: Map<Suit, number[]>): number {
  let max = 0;
  for (const ranks of bySuit.values()) {
    if (ranks.length < 2) continue;
    const sorted = [...ranks].sort((a, b) => a - b);
    for (const step of [1, 2]) {
      for (let start = 0; start < sorted.length; start++) {
        let len = 1;
        const working = [...sorted];
        let current = working[start];
        working.splice(start, 1);
        while (true) {
          const next = current + step;
          const idx = working.indexOf(next);
          if (idx < 0) break;
          len++;
          current = next;
          working.splice(idx, 1);
        }
        max = Math.max(max, len);
      }
    }
  }
  return max;
}

export const sequencePatternFans: FanRule[] = [
  // ── 48番 ──
  {
    name: FN.YiSeSiTongShun, points: 48,
    description: '一种花色4副序数相同的顺子',
    excludes: [FN.YiSeSanJieGao, FN.YiBanGao, FN.SiGuiYi, FN.YiSeSanTongShun, FN.QueYiMen],
    match: (ctx) => maxSameSequenceInfo(seqBySuit(ctx)).count >= 4 ? 1 : 0,
  },
  // ── 32番 ──
  {
    name: FN.YiSeSiBuGao, points: 32,
    description: '同一花色4副顺子依次递增（步长1或2）',
    excludes: [FN.YiSeSanBuGao, FN.QueYiMen],
    match: (ctx) => getMaxStepSequences(seqBySuit(ctx)) >= 4 ? 1 : 0,
  },
  // ── 24番 ──
  {
    name: FN.YiSeSanTongShun, points: 24,
    description: '一种花色3副序数相同的顺子',
    excludes: [FN.YiSeSanJieGao, FN.YiBanGao],
    match: (ctx) => {
      const info = maxSameSequenceInfo(seqBySuit(ctx));
      return info.count >= 3 && info.count < 4 ? 1 : 0;
    },
  },
  // ── 16番 ──
  {
    name: FN.QingLong, points: 16,
    description: '一种花色的123、456、789三组顺子',
    excludes: [FN.LianLiu, FN.LaoShaoFu],
    match: (ctx) => {
      const bs = seqBySuit(ctx);
      for (const suit of NUMBER_SUIT_LIST) {
        const ranks = bs.get(suit)!;
        if (ranks.includes(0) && ranks.includes(3) && ranks.includes(6)) return 1;
      }
      return 0;
    },
  },
  {
    name: FN.YiSeSanBuGao, points: 16,
    description: '同一花色3副顺子依次递增（步长1或2）',
    excludes: [],
    match: (ctx) => {
      const max = getMaxStepSequences(seqBySuit(ctx));
      return max >= 3 && max < 4 ? 1 : 0;
    },
  },
  {
    name: FN.SanSeShuangLongHui, points: 16,
    description: '2种花色2个老少副、另一种花色5作将',
    excludes: [FN.XiXiangFeng, FN.LaoShaoFu, FN.WuZi, FN.PingHe],
    match: (ctx) => {
      const bs = seqBySuit(ctx);
      const pair = ctx.decomposition.pair;
      for (const [s0, s1, s2] of SUIT_PERMUTATIONS) {
        const r0 = bs.get(s0)!, r1 = bs.get(s1)!;
        if (r0.includes(0) && r0.includes(6) && r1.includes(0) && r1.includes(6)
          && pair.suit === s2 && pair.rank === 4) {
          return 1;
        }
      }
      return 0;
    },
  },

  // ── 8番 ──
  {
    name: FN.HuaLong, points: 8,
    description: '三色123/456/789组成1-9序数牌',
    excludes: [FN.LianLiu, FN.LaoShaoFu],
    match: (ctx) => {
      const bs = seqBySuit(ctx);
      // Skip if 清龙 already present (same suit 123+456+789)
      for (const suit of NUMBER_SUIT_LIST) {
        const ranks = bs.get(suit)!;
        if (ranks.includes(0) && ranks.includes(3) && ranks.includes(6)) return 0;
      }
      for (const [s0, s1, s2] of SUIT_PERMUTATIONS) {
        if (bs.get(s0)!.includes(0) && bs.get(s1)!.includes(3) && bs.get(s2)!.includes(6)) {
          return 1;
        }
      }
      return 0;
    },
  },
  {
    name: FN.SanSeSanTongShun, points: 8,
    description: '万筒条各有一副序数相同的顺子',
    excludes: [FN.XiXiangFeng],
    match: (ctx) => {
      const bs = seqBySuit(ctx);
      for (let rank = 0; rank < 7; rank++) {
        if (NUMBER_SUIT_LIST.every(s => bs.get(s)!.includes(rank))) return 1;
      }
      return 0;
    },
  },

  // ── 6番 ──
  {
    name: FN.SanSeSanBuGao, points: 6,
    description: '三种花色各一副顺子，起始序数依次递增1',
    excludes: [],
    match: (ctx) => {
      const bs = seqBySuit(ctx);
      for (let start = 0; start <= 4; start++) {
        for (const [s0, s1, s2] of SUIT_PERMUTATIONS) {
          if (bs.get(s0)!.includes(start)
            && bs.get(s1)!.includes(start + 1)
            && bs.get(s2)!.includes(start + 2)) return 1;
        }
      }
      return 0;
    },
  },

  // ── 1番 ──
  {
    name: FN.YiBanGao, points: 1,
    description: '一种花色2副序数相同的顺子',
    excludes: [],
    match: (ctx) => {
      const info = maxSameSequenceInfo(seqBySuit(ctx));
      return info.count >= 2 && info.count < 3 ? 1 : 0;
    },
  },
  {
    name: FN.XiXiangFeng, points: 1,
    description: '两种花色各有一副序数相同的顺子',
    excludes: [],
    match: (ctx) => {
      // Per 国标, 喜相逢 is awarded once per rank that has same sequence in
      // exactly 2 different suits. Hand with 123m+123p (rank 0) AND 456m+456s
      // (rank 3) earns 喜相逢 ×2.
      // Same-suit pair (一般高) and three-suit match (三色三同顺) take priority,
      // so this rule yields 0 if either of those conditions holds.
      const bs = seqBySuit(ctx);
      const sameInfo = maxSameSequenceInfo(bs);
      if (sameInfo.count >= 2) return 0; // 一般高/一色三/四同顺 has priority
      let count = 0;
      for (let rank = 0; rank < 7; rank++) {
        const suitCount = NUMBER_SUIT_LIST.filter(s => bs.get(s)!.includes(rank)).length;
        if (suitCount >= 3) return 0; // three-suit takes priority over the whole hand
        if (suitCount === 2) count++;
      }
      return count;
    },
  },
  {
    name: FN.LianLiu, points: 1,
    description: '一种花色6张相连接的序数牌',
    excludes: [],
    match: (ctx) => {
      const bs = seqBySuit(ctx);
      for (const suit of NUMBER_SUIT_LIST) {
        const sorted = [...bs.get(suit)!].sort((a, b) => a - b);
        for (let i = 0; i < sorted.length - 1; i++) {
          if (sorted[i + 1] === sorted[i] + 3) return 1;
        }
      }
      return 0;
    },
  },
  {
    name: FN.LaoShaoFu, points: 1,
    description: '一种花色的123、789两组顺子',
    excludes: [],
    match: (ctx) => {
      const bs = seqBySuit(ctx);
      for (const suit of NUMBER_SUIT_LIST) {
        const ranks = bs.get(suit)!;
        if (ranks.includes(0) && ranks.includes(6)) return 1;
      }
      return 0;
    },
  },
];
