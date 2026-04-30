import type { SpecialHandRule, SpecialHandResult, GameContext, FanRule } from '../models/types';
import { TileSet } from '../models/tileSet';
import { tileFromIndex, tile, Tiles, tileEquals, TERMINAL_HONOR_TILES, SUIT_PERMUTATIONS, NUMBER_SUIT_LIST } from '../models/tile';
import { isThirteenOrphans, isSevenStarNotConnected, isAllNotConnected } from '../decomposer';
import { sequence, triplet, type Meld, type HandDecomposition } from '../models/meld';
import { FN } from './fanNames';

// ── Helpers ──

function singleTileGroups(counts: TileSet): import('../models/tile').Tile[][] {
  const groups: import('../models/tile').Tile[][] = [];
  for (const { tile: t, count } of counts.nonZero()) {
    for (let j = 0; j < count; j++) groups.push([t]);
  }
  return groups;
}

function sevenPairsTileGroups(counts: TileSet): import('../models/tile').Tile[][] {
  const groups: import('../models/tile').Tile[][] = [];
  for (const { tile: t, count } of counts.nonZero()) {
    for (let p = 0; p < Math.floor(count / 2); p++) groups.push([t, t]);
  }
  return groups;
}

// Whether a rule is a "tile property" rule (applicable to seven pairs)
const TILE_PROPERTY_NAMES = new Set([
  FN.ZiYiSe, FN.QingYaoJiu, FN.HunYaoJiu, FN.QingYiSe, FN.HunYiSe,
  FN.QuanDa, FN.QuanZhong, FN.QuanXiao, FN.DaYuWu, FN.XiaoYuWu,
  FN.DuanYao, FN.WuZi, FN.QueYiMen, FN.WuMenQi, FN.LvYiSe, FN.TuiBuDao,
]);

// Seven pairs should NOT get meld-structure fans
const SEVEN_PAIRS_EXCLUDED = new Set([
  FN.QingYaoJiu, FN.HunYaoJiu, FN.QuanShuangKe,
]);

function isTilePropertyRule(rule: FanRule): boolean {
  return TILE_PROPERTY_NAMES.has(rule.name) && !SEVEN_PAIRS_EXCLUDED.has(rule.name);
}

// ── Special Hand Rules ──

export const shiSanYaoRule: SpecialHandRule = {
  name: FN.ShiSanYao,
  isMatch: (counts) => isThirteenOrphans([...counts.rawCounts()]),
  evaluate: (counts, game) => {
    const groups: import('../models/tile').Tile[][] = [];
    for (const { tile: t, count } of counts.nonZero()) {
      groups.push(Array(count).fill(t));
    }
    return {
      fans: [{ name: FN.ShiSanYao, points: 88, description: '手牌为19万19筒19条+东南西北中发白+其中一张作将' }],
      tileGroups: groups,
      description: '十三幺（特殊牌型）',
    };
  },
};

export const qiXingBuKaoRule: SpecialHandRule = {
  name: FN.QiXingBuKao,
  isMatch: (counts) => isSevenStarNotConnected([...counts.rawCounts()]),
  evaluate: (counts) => ({
    fans: [
      { name: FN.QiXingBuKao, points: 24, description: '手牌含东南西北中发白各一张+三种花色互不相连的7张序数牌' },
      { name: FN.QuanBuKao, points: 12, description: '由七星不靠包含' },
    ],
    tileGroups: singleTileGroups(counts),
    description: '七星不靠（特殊牌型）',
  }),
};

export const quanBuKaoRule: SpecialHandRule = {
  name: FN.QuanBuKao,
  isMatch: (counts) => {
    // Only match if NOT seven-star (that rule takes priority)
    if (isSevenStarNotConnected([...counts.rawCounts()])) return false;
    return isAllNotConnected([...counts.rawCounts()]);
  },
  evaluate: (counts) => ({
    fans: [
      { name: FN.QuanBuKao, points: 12, description: '手中所有牌互不相连，含至少5种字牌' },
    ],
    tileGroups: singleTileGroups(counts),
    description: '全不靠（特殊牌型）',
  }),
};

export const qiDuiRule: SpecialHandRule = {
  name: FN.QiDui,
  isMatch: (counts, game) => {
    if (game.hasOpenMeld || game.totalMeldCount > 0) return false;
    return counts.isSevenPairs();
  },
  evaluate: (counts) => {
    const fans: SpecialHandResult['fans'] = [
      { name: FN.QiDui, points: 24, description: '手牌由7个对子组成' },
    ];

    // Check 连七对
    if (isSevenShiftedPairs(counts)) {
      fans.push({ name: FN.LianQiDui, points: 88, description: '7个对子为同一花色且序数相连' });
    }

    // 四归一
    const fourCount = counts.countFourOfAKind();
    for (let i = 0; i < fourCount; i++) {
      fans.push({ name: FN.SiGuiYi, points: 2, description: '4张相同的牌在手中' });
    }

    return {
      fans,
      tileGroups: sevenPairsTileGroups(counts),
      description: '七对（7个对子）',
      additionalRuleFilter: isTilePropertyRule,
    };
  },
};

export const zuHeLongRule: SpecialHandRule = {
  name: FN.ZuHeLong,
  isMatch: (counts) => hasComposedDragon(counts),
  evaluate: (counts, game) => {
    // Try each permutation, find best
    let best: SpecialHandResult | null = null;

    for (const [s0, s1, s2] of SUIT_PERMUTATIONS) {
      const g0 = [0, 3, 6], g1 = [1, 4, 7], g2 = [2, 5, 8];

      if (!g0.every(r => counts.get(tile(s0, r)) > 0)) continue;
      if (!g1.every(r => counts.get(tile(s1, r)) > 0)) continue;
      if (!g2.every(r => counts.get(tile(s2, r)) > 0)) continue;

      const remaining = counts.clone();
      for (const r of g0) remaining.remove(tile(s0, r));
      for (const r of g1) remaining.remove(tile(s1, r));
      for (const r of g2) remaining.remove(tile(s2, r));

      // Remaining 5 tiles must form 1 meld + 1 pair
      const raw = [...remaining.rawCounts()];
      for (let i = 0; i < 34; i++) {
        if (raw[i] < 2) continue;
        raw[i] -= 2;

        let idx = -1;
        for (let j = 0; j < 34; j++) { if (raw[j] > 0) { idx = j; break; } }

        // Try triplet
        if (idx >= 0 && raw[idx] >= 3) {
          raw[idx] -= 3;
          if (raw.every(c => c === 0)) {
            const result: SpecialHandResult = {
              fans: [{ name: FN.ZuHeLong, points: 12, description: `组合龙` }],
              tileGroups: [], // TODO: build proper groups
              description: '组合龙（特殊牌型）',
            };
            if (!best || totalFan(result.fans) > totalFan(best.fans)) best = result;
          }
          raw[idx] += 3;
        }

        // Try sequence
        if (idx >= 0 && idx < 27 && idx % 9 <= 6 && raw[idx] > 0 && raw[idx + 1] > 0 && raw[idx + 2] > 0) {
          raw[idx]--; raw[idx + 1]--; raw[idx + 2]--;
          if (raw.every(c => c === 0)) {
            const result: SpecialHandResult = {
              fans: [{ name: FN.ZuHeLong, points: 12, description: `组合龙` }],
              tileGroups: [],
              description: '组合龙（特殊牌型）',
            };
            if (!best || totalFan(result.fans) > totalFan(best.fans)) best = result;
          }
          raw[idx]++; raw[idx + 1]++; raw[idx + 2]++;
        }

        raw[i] += 2;
      }
    }

    return best;
  },
};

function totalFan(fans: Array<{ points: number }>): number {
  return fans.reduce((sum, f) => sum + f.points, 0);
}

function hasComposedDragon(counts: TileSet): boolean {
  for (const [s0, s1, s2] of SUIT_PERMUTATIONS) {
    if ([0, 3, 6].every(r => counts.get(tile(s0, r)) > 0)
      && [1, 4, 7].every(r => counts.get(tile(s1, r)) > 0)
      && [2, 5, 8].every(r => counts.get(tile(s2, r)) > 0)) {
      return true;
    }
  }
  return false;
}

function isSevenShiftedPairs(counts: TileSet): boolean {
  if (!counts.isSevenPairs()) return false;
  if (counts.hasHonors()) return false;
  const raw = counts.rawCounts();

  for (let suit = 0; suit < 3; suit++) {
    const base = suit * 9;
    const pairs: number[] = [];
    let allZeroOrTwo = true;
    for (let i = 0; i < 9; i++) {
      const c = raw[base + i];
      if (c === 2) pairs.push(i);
      else if (c !== 0) { allZeroOrTwo = false; break; }
    }
    if (!allZeroOrTwo) continue;
    if (pairs.length === 7 && pairs[6] - pairs[0] === 6) return true;
  }
  return false;
}

export const allSpecialHandRules: SpecialHandRule[] = [
  shiSanYaoRule,
  qiXingBuKaoRule,
  quanBuKaoRule,
  qiDuiRule,
  zuHeLongRule,
];
