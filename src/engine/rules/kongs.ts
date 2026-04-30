import type { FanRule } from '../models/types';
import { FN } from './fanNames';

export const kongFans: FanRule[] = [
  {
    name: FN.SiGang, points: 88,
    description: '4个杠',
    excludes: [FN.DanDiaoJiang, FN.PengPengHe, FN.SanGang, FN.ShuangAnGang, FN.ShuangMingGang, FN.AnGang, FN.MingGang],
    match: (ctx) => ctx.game.kongCount >= 4 ? 1 : 0,
  },
  {
    name: FN.SanGang, points: 32,
    description: '3个杠',
    excludes: [FN.ShuangAnGang, FN.ShuangMingGang, FN.AnGang, FN.MingGang],
    match: (ctx) => ctx.game.kongCount === 3 ? 1 : 0,
  },
  {
    name: FN.ShuangAnGang, points: 6,
    description: '2个暗杠',
    excludes: [FN.AnGang, FN.ShuangAnKe],
    match: (ctx) => ctx.game.anKongCount >= 2 ? 1 : 0,
  },
  {
    name: FN.ShuangMingGang, points: 4,
    description: '2个明杠',
    excludes: [FN.MingGang],
    match: (ctx) => ctx.game.mingKongCount >= 2 ? 1 : 0,
  },
  {
    name: FN.AnGang, points: 2,
    description: '有暗杠',
    excludes: [],
    match: (ctx) => ctx.game.anKongCount >= 1 ? 1 : 0,
  },
  {
    name: FN.MingGang, points: 1,
    description: '有明杠',
    excludes: [],
    match: (ctx) => ctx.game.mingKongCount >= 1 ? 1 : 0,
  },
];
