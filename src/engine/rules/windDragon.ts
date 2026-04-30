import type { FanRule, FanContext } from '../models/types';
import { isTripletOrKong, isWindMeld, isDragonMeld } from '../models/meld';
import { tileEquals } from '../models/tile';
import { FN } from './fanNames';

function windTripletCount(ctx: FanContext): number {
  return ctx.decomposition.melds.filter(m => isTripletOrKong(m) && isWindMeld(m)).length;
}

function dragonTripletCount(ctx: FanContext): number {
  return ctx.decomposition.melds.filter(m => isTripletOrKong(m) && isDragonMeld(m)).length;
}

export const windDragonFans: FanRule[] = [
  // ── 88番 ──
  {
    name: FN.DaSiXi, points: 88,
    description: '4副刻子均为风牌（东南西北）',
    excludes: [FN.XiaoSiXi, FN.SanFengKe, FN.QuanFengKe, FN.MenFengKe, FN.YaoJiuKe, FN.PengPengHe],
    match: (ctx) => windTripletCount(ctx) === 4 ? 1 : 0,
  },
  {
    name: FN.DaSanYuan, points: 88,
    description: '3副箭牌刻子（中发白）',
    excludes: [FN.XiaoSanYuan, FN.ShuangJianKe, FN.JianKe],
    match: (ctx) => dragonTripletCount(ctx) === 3 ? 1 : 0,
  },

  // ── 64番 ──
  {
    name: FN.XiaoSiXi, points: 64,
    description: '3副风牌刻子+风牌作将',
    excludes: [FN.SanFengKe, FN.YaoJiuKe],
    match: (ctx) => {
      const { pair } = ctx.decomposition;
      return windTripletCount(ctx) === 3 && pair.suit === 'wind' ? 1 : 0;
    },
  },
  {
    name: FN.XiaoSanYuan, points: 64,
    description: '2副箭牌刻子+箭牌作将',
    excludes: [FN.ShuangJianKe, FN.JianKe],
    match: (ctx) => {
      const { pair } = ctx.decomposition;
      return dragonTripletCount(ctx) === 2 && pair.suit === 'dragon' ? 1 : 0;
    },
  },

  // ── 12番 ──
  {
    name: FN.SanFengKe, points: 12,
    description: '有3副风牌刻子',
    excludes: [FN.QueYiMen],
    match: (ctx) => windTripletCount(ctx) === 3 ? 1 : 0,
  },

  // ── 6番 ──
  {
    name: FN.ShuangJianKe, points: 6,
    description: '有2副箭牌刻子',
    excludes: [FN.JianKe],
    match: (ctx) => dragonTripletCount(ctx) === 2 ? 1 : 0,
  },

  // ── 2番 ──
  {
    name: FN.MenFengKe, points: 2,
    description: '有门风的刻子',
    excludes: [],
    match: (ctx) => {
      const { seatWind } = ctx.game;
      return ctx.decomposition.melds.some(m =>
        isTripletOrKong(m) && tileEquals(m.start, seatWind)) ? 1 : 0;
    },
  },
  {
    name: FN.QuanFengKe, points: 2,
    description: '有圈风的刻子',
    excludes: [],
    match: (ctx) => {
      const { roundWind } = ctx.game;
      return ctx.decomposition.melds.some(m =>
        isTripletOrKong(m) && tileEquals(m.start, roundWind)) ? 1 : 0;
    },
  },
  {
    name: FN.JianKe, points: 2,
    description: '有箭牌（中/发/白）的刻子',
    excludes: [],
    match: (ctx) => {
      return ctx.decomposition.melds.filter(m => isTripletOrKong(m) && isDragonMeld(m)).length;
    },
  },
];
