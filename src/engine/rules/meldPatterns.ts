import type { FanRule, FanContext } from '../models/types';
import { isTripletOrKong, meldTiles } from '../models/meld';
import { isNumberSuit, isTerminalOrHonor } from '../models/tile';
import { FN } from './fanNames';

export const meldPatternFans: FanRule[] = [
  // ── 6番 ──
  {
    name: FN.PengPengHe, points: 6,
    description: '4副面子均为刻子/杠',
    excludes: [],
    match: (ctx) => ctx.decomposition.melds.every(m => isTripletOrKong(m)) ? 1 : 0,
  },

  // ── 16番 ──
  {
    name: FN.QuanDaiWu, points: 16,
    description: '每副面子和将牌都包含5',
    excludes: [FN.DuanYao, FN.WuZi],
    match: (ctx) => {
      const { pair, melds } = ctx.decomposition;
      if (!isNumberSuit(pair) || pair.rank !== 4) return 0;
      for (const m of melds) {
        if (!meldTiles(m).some(t => isNumberSuit(t) && t.rank === 4)) return 0;
      }
      return 1;
    },
  },

  // ── 4番 ──
  {
    name: FN.QuanDaiYao, points: 4,
    description: '每副面子和将牌都包含幺九牌',
    excludes: [],
    match: (ctx) => {
      const { pair, melds } = ctx.decomposition;
      if (isNumberSuit(pair) && pair.rank !== 0 && pair.rank !== 8) {
        if (!isTerminalOrHonor(pair)) return 0;
      }
      for (const m of melds) {
        if (!meldTiles(m).some(t => isTerminalOrHonor(t))) return 0;
      }
      return 1;
    },
  },

  // ── 2番 ──
  {
    name: FN.PingHe, points: 2,
    description: '4副面子均为顺子，将牌为序数牌',
    excludes: [FN.WuZi],
    match: (ctx) => {
      const { pair, melds } = ctx.decomposition;
      if (!melds.every(m => m.type === 'sequence')) return 0;
      if (!isNumberSuit(pair)) return 0;
      return 1;
    },
  },
  {
    name: FN.SiGuiYi, points: 2,
    description: '4张相同的牌在手中（未声明为杠）',
    excludes: [],
    match: (ctx) => ctx.allCounts.countFourOfAKind(),
  },

  // ── 1番 ──
  {
    name: FN.YaoJiuKe, points: 1,
    description: '含幺九牌或风牌的刻子（不含圈风、门风、箭牌刻）',
    excludes: [],
    match: (ctx) => {
      const { game, decomposition } = ctx;
      const excluded = new Set<number>();
      excluded.add(27 + game.seatWind.rank); // seat wind
      excluded.add(27 + game.roundWind.rank); // round wind
      excluded.add(31); excluded.add(32); excluded.add(33); // dragons

      let count = 0;
      for (const m of decomposition.melds) {
        if (!isTripletOrKong(m)) continue;
        const idx = m.start.suit === 'man' ? m.start.rank
          : m.start.suit === 'pin' ? 9 + m.start.rank
          : m.start.suit === 'sou' ? 18 + m.start.rank
          : m.start.suit === 'wind' ? 27 + m.start.rank
          : 31 + m.start.rank;
        if (excluded.has(idx)) continue;
        if (isTerminalOrHonor(m.start)) count++;
      }
      return count;
    },
  },
];
