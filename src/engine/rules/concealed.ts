import type { FanRule, FanContext } from '../models/types';
import { isTripletOrKong } from '../models/meld';
import { tileEquals, tileIndex } from '../models/tile';
import { FN } from './fanNames';

function countConcealedTriplets(ctx: FanContext): number {
  const { decomposition, game } = ctx;
  let count = 0;

  for (let i = 0; i < decomposition.melds.length; i++) {
    const m = decomposition.melds[i];
    if (isTripletOrKong(m) && !m.isOpen) {
      count++;
    }
  }

  // If not self-draw, the winning tile might have completed a concealed triplet
  // making it actually an open triplet
  if (!game.isSelfDraw && game.winningTile) {
    for (let i = 0; i < decomposition.melds.length; i++) {
      const m = decomposition.melds[i];
      if (!m.isOpen && m.type === 'triplet' && tileEquals(m.start, game.winningTile)) {
        count--;
        break;
      }
    }
  }

  return Math.max(0, count);
}

export const concealedFans: FanRule[] = [
  {
    name: FN.SiAnKe, points: 64,
    description: '4副刻子均为暗刻',
    excludes: [FN.MenQianQing, FN.PengPengHe, FN.SanAnKe, FN.ShuangAnKe, FN.BuQiuRen, FN.ZiMo],
    match: (ctx) => countConcealedTriplets(ctx) >= 4 ? 1 : 0,
  },
  {
    name: FN.SanAnKe, points: 16,
    description: '有3副暗刻',
    excludes: [FN.ShuangAnKe],
    match: (ctx) => countConcealedTriplets(ctx) === 3 ? 1 : 0,
  },
  {
    name: FN.ShuangAnKe, points: 2,
    description: '有2副暗刻',
    excludes: [],
    match: (ctx) => countConcealedTriplets(ctx) === 2 ? 1 : 0,
  },
];
