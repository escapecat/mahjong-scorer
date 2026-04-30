import type { FanRule, FanContext } from '../models/types';
import { FN } from './fanNames';

// Pushed-down hand tiles (推不倒): 1234589p + 2459s + P (白)
const PUSHED_DOWN_INDICES = new Set([
  9, 10, 11, 12, 13, 16, 17,  // 1-5,8,9p
  19, 21, 22, 25,              // 2,4,5,8s (rank 1,3,4,7)
  33,                          // 白
]);

export const tilePropertyFans: FanRule[] = [
  // ── 64番 ──
  {
    name: FN.ZiYiSe, points: 64,
    description: '手牌全部由字牌组成',
    excludes: [FN.PengPengHe, FN.HunYaoJiu, FN.QuanDaiYao, FN.YaoJiuKe, FN.QueYiMen],
    match: (ctx) => ctx.allCounts.isAllHonors() ? 1 : 0,
  },
  {
    name: FN.QingYaoJiu, points: 64,
    description: '手牌全部由序数牌的1和9组成',
    excludes: [FN.HunYaoJiu, FN.PengPengHe, FN.QuanDaiYao, FN.YaoJiuKe, FN.WuZi],
    match: (ctx) => ctx.allCounts.isAllTerminals() ? 1 : 0,
  },
  {
    name: FN.HunYaoJiu, points: 32,
    description: '手牌全部由幺九牌（1、9、字牌）组成',
    excludes: [FN.PengPengHe, FN.YaoJiuKe, FN.QuanDaiYao],
    match: (ctx) => ctx.allCounts.isAllTerminalsOrHonors() ? 1 : 0,
  },

  // ── 24番 ──
  {
    name: FN.QingYiSe, points: 24,
    description: '手牌全部为一种花色',
    excludes: [FN.QueYiMen, FN.WuZi],
    match: (ctx) => ctx.allCounts.isPureSuit() ? 1 : 0,
  },
  {
    name: FN.QuanDa, points: 24,
    description: '手牌全部由789的序数牌组成',
    excludes: [FN.WuZi, FN.DaYuWu],
    match: (ctx) => !ctx.allCounts.hasHonors() && ctx.allCounts.isOnlyRanks(r => r >= 6) ? 1 : 0,
  },
  {
    name: FN.QuanZhong, points: 24,
    description: '手牌全部由456的序数牌组成',
    excludes: [FN.DuanYao, FN.WuZi],
    match: (ctx) => !ctx.allCounts.hasHonors() && ctx.allCounts.isOnlyRanks(r => r >= 3 && r <= 5) ? 1 : 0,
  },
  {
    name: FN.QuanXiao, points: 24,
    description: '手牌全部由123的序数牌组成',
    excludes: [FN.WuZi, FN.XiaoYuWu],
    match: (ctx) => !ctx.allCounts.hasHonors() && ctx.allCounts.isOnlyRanks(r => r <= 2) ? 1 : 0,
  },
  {
    name: FN.QuanShuangKe, points: 24,
    description: '4副刻子均为序数偶数牌，将牌也为偶数',
    excludes: [FN.PengPengHe, FN.DuanYao, FN.WuZi],
    match: (ctx) => ctx.allCounts.isAllEvenRanks() ? 1 : 0,
  },

  // ── 12番 ──
  {
    name: FN.DaYuWu, points: 12,
    description: '手牌全部由序数牌6-9组成',
    excludes: [FN.WuZi],
    match: (ctx) => {
      if (ctx.allCounts.hasHonors()) return 0;
      const isAllBig = ctx.allCounts.isOnlyRanks(r => r >= 6);
      if (isAllBig) return 0; // 全大 takes priority (checked elsewhere)
      return ctx.allCounts.isOnlyRanks(r => r >= 5) ? 1 : 0;
    },
  },
  {
    name: FN.XiaoYuWu, points: 12,
    description: '手牌全部由序数牌1-4组成',
    excludes: [FN.WuZi],
    match: (ctx) => {
      if (ctx.allCounts.hasHonors()) return 0;
      const isAllSmall = ctx.allCounts.isOnlyRanks(r => r <= 2);
      if (isAllSmall) return 0; // 全小 takes priority
      return ctx.allCounts.isOnlyRanks(r => r <= 3) ? 1 : 0;
    },
  },

  // ── 8番 ──
  {
    name: FN.TuiBuDao, points: 8,
    description: '手牌全部由上下对称的牌组成',
    excludes: [FN.QueYiMen],
    match: (ctx) => {
      const raw = ctx.allCounts.rawCounts();
      for (let i = 0; i < 34; i++) {
        if (raw[i] > 0 && !PUSHED_DOWN_INDICES.has(i)) return 0;
      }
      return ctx.allCounts.total() > 0 ? 1 : 0;
    },
  },

  // ── 6番 ──
  {
    name: FN.HunYiSe, points: 6,
    description: '手牌由一种花色的序数牌加字牌组成',
    excludes: [FN.QueYiMen],
    match: (ctx) => ctx.allCounts.isHalfFlush() ? 1 : 0,
  },
  {
    name: FN.WuMenQi, points: 6,
    description: '手牌包含万、筒、条、风牌、箭牌五种类别',
    excludes: [],
    match: (ctx) => ctx.allCounts.hasFiveGates() ? 1 : 0,
  },

  // ── 2番 ──
  {
    name: FN.DuanYao, points: 2,
    description: '手牌不含1、9和字牌',
    excludes: [FN.WuZi],
    match: (ctx) => ctx.allCounts.isAllSimples() ? 1 : 0,
  },

  // ── 1番 ──
  {
    name: FN.QueYiMen, points: 1,
    description: '手牌缺少万/筒/条中的一种',
    excludes: [],
    match: (ctx) => {
      const suits = ctx.allCounts.suitsPresent();
      if (suits >= 3 || suits === 0) return 0;
      // Don't award if pure suit or half flush (those suppress this anyway, but avoid double)
      if (ctx.allCounts.isPureSuit() || ctx.allCounts.isHalfFlush()) return 0;
      // Don't award if 三风刻 (3 wind triplets implies 缺一门 trivially)
      if (ctx.allCounts.windTripletCount() === 3) return 0;
      return 1;
    },
  },
  {
    name: FN.WuZi, points: 1,
    description: '手牌不含字牌',
    excludes: [],
    match: (ctx) => {
      if (ctx.allCounts.hasHonors()) return 0;
      // Don't award if 全大/全中/全小 (they suppress this)
      const raw = ctx.allCounts.rawCounts();
      const allBig = !ctx.allCounts.hasHonors() && ctx.allCounts.isOnlyRanks(r => r >= 6);
      const allMid = !ctx.allCounts.hasHonors() && ctx.allCounts.isOnlyRanks(r => r >= 3 && r <= 5);
      const allSmall = !ctx.allCounts.hasHonors() && ctx.allCounts.isOnlyRanks(r => r <= 2);
      if (allBig || allMid || allSmall) return 0;
      return 1;
    },
  },
];
