import type { FanRule, FanContext } from '../models/types';
import { isTripletOrKong, isWindMeld, isDragonMeld, isSuitMeld } from '../models/meld';
import { tileEquals, isNumberSuit } from '../models/tile';
import { FN } from './fanNames';

const NINE_GATES_REQUIRED = [3, 1, 1, 1, 1, 1, 1, 1, 3];

export const highFans: FanRule[] = [
  // ── 88番 ──
  {
    name: FN.LvYiSe, points: 88,
    description: '手牌全部由23468条和发字组成',
    excludes: [FN.HunYiSe],
    match: (ctx) => ctx.allCounts.isAllGreen() ? 1 : 0,
  },
  {
    name: FN.JiuLianBaoDeng, points: 88,
    description: '同一花色按1112345678999组成的门清听牌',
    excludes: [FN.QingYiSe, FN.YaoJiuKe, FN.MenQianQing],
    match: (ctx) => {
      if (ctx.game.hasOpenMeld) return 0;
      if (ctx.allCounts.hasHonors()) return 0;
      const raw = ctx.allCounts.rawCounts();
      for (let suit = 0; suit < 3; suit++) {
        const base = suit * 9;
        let total = 0;
        let ok = true;
        for (let i = 0; i < 9; i++) {
          if (raw[base + i] < NINE_GATES_REQUIRED[i]) { ok = false; break; }
          total += raw[base + i];
        }
        if (!ok || total !== 14) continue;
        // Check other suits are empty
        let otherEmpty = true;
        for (let s = 0; s < 3; s++) {
          if (s === suit) continue;
          for (let i = 0; i < 9; i++) {
            if (raw[s * 9 + i] > 0) { otherEmpty = false; break; }
          }
          if (!otherEmpty) break;
        }
        if (otherEmpty) return 1;
      }
      return 0;
    },
  },

  // ── 64番 ──
  {
    name: FN.YiSeShuangLongHui, points: 64,
    description: '由一种花色的两个老少副，5作将的和牌',
    excludes: [FN.PingHe, FN.QiDui, FN.QingYiSe, FN.YiBanGao, FN.LaoShaoFu, FN.QueYiMen, FN.WuZi],
    match: (ctx) => {
      const { decomposition: d } = ctx;
      const seqs = d.melds.filter(m => m.type === 'sequence');
      for (const suit of ['man', 'pin', 'sou'] as const) {
        const count123 = seqs.filter(m => m.start.suit === suit && m.start.rank === 0).length;
        const count789 = seqs.filter(m => m.start.suit === suit && m.start.rank === 6).length;
        if (count123 >= 2 && count789 >= 2 && d.pair.suit === suit && d.pair.rank === 4) {
          return 1;
        }
      }
      return 0;
    },
  },
];
