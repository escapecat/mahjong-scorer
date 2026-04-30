import type { FanRule, FanContext } from '../models/types';
import { tileIndex } from '../models/tile';
import { getWaitTypes, countWinningTiles } from '../waitAnalyzer';
import { FN } from './fanNames';

export const situationalFans: FanRule[] = [
  // ── 8番 ──
  {
    name: FN.MiaoShouHuiChun, points: 8,
    description: '摸到牌墙最后一张牌自摸和牌',
    excludes: [FN.ZiMo],
    match: (ctx) => ctx.game.isLastTile && ctx.game.isSelfDraw ? 1 : 0,
  },
  {
    name: FN.HaiDiLaoYue, points: 8,
    description: '吃到最后一张打出的牌和牌',
    excludes: [FN.ZiMo],
    match: (ctx) => ctx.game.isLastTile && !ctx.game.isSelfDraw ? 1 : 0,
  },
  {
    name: FN.GangShangKaiHua, points: 8,
    description: '开杠后摸牌和牌',
    excludes: [FN.ZiMo],
    match: (ctx) => ctx.game.isKongDraw ? 1 : 0,
  },
  {
    name: FN.QiangGangHe, points: 8,
    description: '他家加杠时抢杠和牌',
    excludes: [FN.HeJueZhang],
    match: (ctx) => ctx.game.isRobbingKong ? 1 : 0,
  },

  // ── 6番 ──
  {
    name: FN.QuanQiuRen, points: 6,
    description: '4副面子均为吃碰明杠，单钓将牌点炮和',
    excludes: [FN.DanDiaoJiang],
    match: (ctx) => {
      if (ctx.game.isSelfDraw) return 0;
      if (ctx.game.totalOpenMeldCount !== 4) return 0;
      if (ctx.game.anKongCount > 0) return 0;
      if (!ctx.game.winningTile) return 0;
      const waits = getWaitTypes(ctx.handCounts, ctx.game.winningTile);
      return waits.has('single') ? 1 : 0;
    },
  },

  // ── 4番 ──
  {
    name: FN.BuQiuRen, points: 4,
    description: '自摸和牌且没有吃碰明杠',
    excludes: [FN.ZiMo, FN.MenQianQing],
    match: (ctx) => ctx.game.isSelfDraw && !ctx.game.hasOpenMeld ? 1 : 0,
  },
  {
    name: FN.HeJueZhang, points: 4,
    description: '和牌时该牌为场上最后一张',
    excludes: [],
    match: (ctx) => ctx.game.isWinningTileLast ? 1 : 0,
  },

  // ── 2番 ──
  {
    name: FN.MenQianQing, points: 2,
    description: '没有吃碰明杠，点炮和牌',
    excludes: [],
    match: (ctx) => !ctx.game.isSelfDraw && !ctx.game.hasOpenMeld ? 1 : 0,
  },

  // ── 1番 ──
  // 国标 wait fans (边张/坎张/单钓将) all require single-tile wait — see official
  // rule descriptions: "单和 123 的 3", "单钓一张将牌", etc. Multi-tile waits
  // (e.g. a 3-way 1p/4p/7p ladder) don't qualify even if the actually-won tile
  // happens to fit the shape.
  // They're also mutually exclusive: one winning tile can only fill one role.
  // When multiple shapes apply (rare, e.g. winning tile that is both a pair
  // partner and a sequence middle), prefer the sequence-shape interpretation
  // (边张/坎张) — the pre-draw "partial + pair" structure is the natural read.
  {
    name: FN.BianZhang, points: 1,
    description: '和牌张为边张听牌',
    excludes: [FN.DanDiaoJiang],
    match: (ctx) => {
      if (!ctx.game.winningTile) return 0;
      if (countWinningTiles(ctx.handCounts, ctx.lockedMelds, ctx.game.winningTile) !== 1) return 0;
      const waits = getWaitTypes(ctx.handCounts, ctx.game.winningTile);
      return waits.has('edge') ? 1 : 0;
    },
  },
  {
    name: FN.KanZhang, points: 1,
    description: '和牌张为坎张听牌',
    excludes: [FN.DanDiaoJiang],
    match: (ctx) => {
      if (!ctx.game.winningTile) return 0;
      if (countWinningTiles(ctx.handCounts, ctx.lockedMelds, ctx.game.winningTile) !== 1) return 0;
      const waits = getWaitTypes(ctx.handCounts, ctx.game.winningTile);
      return waits.has('closed') ? 1 : 0;
    },
  },
  {
    name: FN.DanDiaoJiang, points: 1,
    description: '和牌张为单钓将牌',
    excludes: [],
    match: (ctx) => {
      if (!ctx.game.winningTile) return 0;
      if (countWinningTiles(ctx.handCounts, ctx.lockedMelds, ctx.game.winningTile) !== 1) return 0;
      const waits = getWaitTypes(ctx.handCounts, ctx.game.winningTile);
      return waits.has('single') ? 1 : 0;
    },
  },
  {
    name: FN.ZiMo, points: 1,
    description: '自摸和牌',
    excludes: [],
    match: (ctx) => ctx.game.isSelfDraw ? 1 : 0,
  },
];
