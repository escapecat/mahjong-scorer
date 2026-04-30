import { TileSet } from './models/tileSet';
import type { Tile } from './models/tile';

export interface FanPotential {
  fanName: string;
  points: number;
  /** Number of tiles that need to be swapped to reach this pattern */
  distance: number;
  /** Brief human-readable hint */
  description: string;
}

/** Edit distance from current hand to a target tile distribution */
function distanceTo(current: TileSet, target: number[]): number {
  let dist = 0;
  for (let i = 0; i < 34; i++) {
    const have = current.getByIndex(i);
    const want = target[i];
    if (want > have) dist += want - have;
  }
  return dist;
}

const SUIT_BASE = [0, 9, 18]; // man, pin, sou
const SUIT_NAMES = ['万', '筒', '条'];

// ── 88番 ──

function computeDaSiXi(c: TileSet): FanPotential | null {
  // Target: 12 wind tiles (3 of each E,S,W,N) + 2 pair (any non-wind)
  let best = Infinity;
  for (let pair = 0; pair < 34; pair++) {
    if (pair >= 27 && pair <= 30) continue; // pair can't be wind
    const t = new Array(34).fill(0);
    t[27] = 3; t[28] = 3; t[29] = 3; t[30] = 3;
    t[pair] = 2;
    best = Math.min(best, distanceTo(c, t));
  }
  if (best === 0 || best >= 14) return null;
  return { fanName: '大四喜', points: 88, distance: best, description: '凑齐 4 副风刻 + 1 对' };
}

function computeDaSanYuan(c: TileSet): FanPotential | null {
  // Target: 9 dragon tiles (3 each of C,F,P) + 5 free tiles
  const t = new Array(34).fill(0);
  t[31] = 3; t[32] = 3; t[33] = 3;
  const d = distanceTo(c, t);
  if (d === 0 || d >= 14) return null;
  return { fanName: '大三元', points: 88, distance: d, description: '凑齐 3 副箭刻（中发白）' };
}

function computeLvYiSe(c: TileSet): FanPotential | null {
  // Green tiles: 2s(19), 3s(20), 4s(21), 6s(23), 8s(25), Fa(32)
  const greenIndices = new Set([19, 20, 21, 23, 25, 32]);
  let nonGreen = 0;
  for (let i = 0; i < 34; i++) {
    if (!greenIndices.has(i)) nonGreen += c.getByIndex(i);
  }
  if (nonGreen === 0 || nonGreen >= 14) return null;
  return { fanName: '绿一色', points: 88, distance: nonGreen, description: `去掉 ${nonGreen} 张非绿牌` };
}

function computeJiuLianBaoDeng(c: TileSet): FanPotential | null {
  // 1112345678999 in one suit + 1 extra in same suit
  let best = Infinity;
  for (const base of SUIT_BASE) {
    // Required: [3,1,1,1,1,1,1,1,3] in this suit
    // Plus 1 extra of any rank in same suit (winning tile)
    for (let extra = 0; extra < 9; extra++) {
      const t = new Array(34).fill(0);
      const required = [3, 1, 1, 1, 1, 1, 1, 1, 3];
      for (let r = 0; r < 9; r++) t[base + r] = required[r];
      t[base + extra] += 1;
      best = Math.min(best, distanceTo(c, t));
    }
  }
  if (best === 0 || best >= 14) return null;
  return { fanName: '九莲宝灯', points: 88, distance: best, description: '凑齐 1112345678999 同花色' };
}

function computeLianQiDui(c: TileSet): FanPotential | null {
  // 7 consecutive pairs in one suit
  let best = Infinity;
  for (const base of SUIT_BASE) {
    for (let start = 0; start <= 2; start++) {
      const t = new Array(34).fill(0);
      for (let r = 0; r < 7; r++) t[base + start + r] = 2;
      best = Math.min(best, distanceTo(c, t));
    }
  }
  if (best === 0 || best >= 14) return null;
  return { fanName: '连七对', points: 88, distance: best, description: '凑齐同花色 7 个连续对子' };
}

function computeShiSanYao(c: TileSet): FanPotential | null {
  // 13 orphans (1m,9m,1p,9p,1s,9s,E,S,W,N,C,F,P) + 1 extra orphan
  const orphans = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];
  let best = Infinity;
  for (const extraOrphan of orphans) {
    const t = new Array(34).fill(0);
    for (const o of orphans) t[o] = 1;
    t[extraOrphan] = 2;
    best = Math.min(best, distanceTo(c, t));
  }
  if (best === 0 || best >= 14) return null;
  return { fanName: '十三幺', points: 88, distance: best, description: '凑齐 13 种幺九 + 任 1 张幺九' };
}

// ── 64番 ──

function computeQingYaoJiu(c: TileSet): FanPotential | null {
  // All 14 tiles are 1m/9m/1p/9p/1s/9s only (no honors!)
  // Need triplets + pair structure. Just measure how many non-1/9 you have.
  let nonTerm = 0;
  for (let i = 0; i < 34; i++) {
    if (i >= 27) { nonTerm += c.getByIndex(i); continue; }
    const r = i % 9;
    if (r !== 0 && r !== 8) nonTerm += c.getByIndex(i);
  }
  if (nonTerm === 0 || nonTerm >= 14) return null;
  return { fanName: '清幺九', points: 64, distance: nonTerm, description: `去掉 ${nonTerm} 张非 1/9 牌` };
}

function computeXiaoSiXi(c: TileSet): FanPotential | null {
  // 3 wind triplets + 1 wind pair + 1 free meld (3 tiles)
  let best = Infinity;
  for (let pairWind = 0; pairWind < 4; pairWind++) {
    const t = new Array(34).fill(0);
    for (let w = 0; w < 4; w++) t[27 + w] = w === pairWind ? 2 : 3;
    // 3 free tiles for the last meld — distance accounts for them naturally
    best = Math.min(best, distanceTo(c, t));
  }
  if (best === 0 || best >= 14) return null;
  return { fanName: '小四喜', points: 64, distance: best, description: '3 副风刻 + 1 副风对子' };
}

function computeXiaoSanYuan(c: TileSet): FanPotential | null {
  // 2 dragon triplets + 1 dragon pair + 6 free tiles
  let best = Infinity;
  for (let pairDragon = 0; pairDragon < 3; pairDragon++) {
    const t = new Array(34).fill(0);
    for (let d = 0; d < 3; d++) t[31 + d] = d === pairDragon ? 2 : 3;
    best = Math.min(best, distanceTo(c, t));
  }
  if (best === 0 || best >= 14) return null;
  return { fanName: '小三元', points: 64, distance: best, description: '2 副箭刻 + 1 副箭对子' };
}

function computeZiYiSe(c: TileSet): FanPotential | null {
  let nonHonor = 0;
  for (let i = 0; i < 27; i++) nonHonor += c.getByIndex(i);
  if (nonHonor === 0 || nonHonor >= 14) return null;
  return { fanName: '字一色', points: 64, distance: nonHonor, description: `去掉 ${nonHonor} 张数字牌` };
}

function computeYiSeShuangLongHui(c: TileSet): FanPotential | null {
  // Same suit: 123 + 789 + 123 + 789 + 55
  // Target counts: [2,1,1,0,2,0,1,1,2] in one suit
  let best = Infinity;
  for (const base of SUIT_BASE) {
    const t = new Array(34).fill(0);
    const pattern = [2, 1, 1, 0, 2, 0, 1, 1, 2];
    for (let r = 0; r < 9; r++) t[base + r] = pattern[r];
    best = Math.min(best, distanceTo(c, t));
  }
  if (best === 0 || best >= 14) return null;
  return { fanName: '一色双龙会', points: 64, distance: best, description: '同花色 123×2 + 789×2 + 5对' };
}

// ── 48番 ──

function computeYiSeSiTongShun(c: TileSet): FanPotential | null {
  // 4 same sequences in one suit + 2 pair (any other tile)
  let best = Infinity;
  for (const base of SUIT_BASE) {
    for (let seqStart = 0; seqStart <= 6; seqStart++) {
      // 4 of each in 3 consecutive ranks = 12 tiles + 2 pair
      for (let pair = 0; pair < 34; pair++) {
        if (pair >= base && pair < base + 9 && pair >= base + seqStart && pair < base + seqStart + 3) continue;
        const t = new Array(34).fill(0);
        t[base + seqStart] = 4;
        t[base + seqStart + 1] = 4;
        t[base + seqStart + 2] = 4;
        t[pair] = (t[pair] || 0) + 2;
        best = Math.min(best, distanceTo(c, t));
      }
    }
  }
  if (best === 0 || best >= 14) return null;
  return { fanName: '一色四同顺', points: 48, distance: best, description: '同花色 4 副相同顺子' };
}

function computeYiSeSiJieGao(c: TileSet): FanPotential | null {
  // 4 consecutive triplets in one suit + pair
  let best = Infinity;
  for (const base of SUIT_BASE) {
    for (let start = 0; start <= 5; start++) {
      for (let pair = 0; pair < 34; pair++) {
        if (pair >= base + start && pair < base + start + 4) continue;
        const t = new Array(34).fill(0);
        for (let k = 0; k < 4; k++) t[base + start + k] = 3;
        t[pair] = (t[pair] || 0) + 2;
        best = Math.min(best, distanceTo(c, t));
      }
    }
  }
  if (best === 0 || best >= 14) return null;
  return { fanName: '一色四节高', points: 48, distance: best, description: '同花色 4 副连续递增刻子' };
}

// ── 32番 ──

function computeHunYaoJiu(c: TileSet): FanPotential | null {
  // All terminal/honor + at least 1 honor (else it's 清幺九)
  let nonYaoJiu = 0;
  for (let i = 0; i < 27; i++) {
    const r = i % 9;
    if (r !== 0 && r !== 8) nonYaoJiu += c.getByIndex(i);
  }
  let honorCount = 0;
  for (let i = 27; i < 34; i++) honorCount += c.getByIndex(i);

  let dist = nonYaoJiu;
  if (honorCount === 0) dist += 1; // need at least 1 honor

  if (dist === 0 || dist >= 14) return null;
  return { fanName: '混幺九', points: 32, distance: dist, description: '只用 1/9/字 牌（含字牌）' };
}

// ── 24番 ──

function computeQiDui(c: TileSet): FanPotential | null {
  // 7 distinct pairs (any tiles)
  // Greedy: count of pairs in current hand
  let pairCount = 0;
  let oddCount = 0; // tiles with count 1 or 3
  let totalSafePaired = 0; // contribution toward the 7 pairs (capped at 2 per type)
  for (let i = 0; i < 34; i++) {
    const ct = c.getByIndex(i);
    if (ct >= 2) pairCount++;
    totalSafePaired += Math.min(2, ct);
  }
  // Distance = 14 - totalSafePaired (each "missing" pair tile = 1 swap)
  const dist = 14 - totalSafePaired;
  if (dist === 0 || dist >= 14) return null;
  return { fanName: '七对', points: 24, distance: dist, description: '凑齐 7 个对子' };
}

function computeQiXingBuKao(c: TileSet): FanPotential | null {
  // 7 honors (each 1) + 7 numbers from 147/258/369 (one suit per group)
  // For each permutation of 3 number groups → 3 suits, compute target
  const perms = [
    [0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0],
  ];
  let best = Infinity;
  for (const p of perms) {
    const t = new Array(34).fill(0);
    // 7 honors
    for (let i = 27; i < 34; i++) t[i] = 1;
    // 147 in suit p[0], 258 in suit p[1], 369 in suit p[2]
    for (const r of [0, 3, 6]) t[SUIT_BASE[p[0]] + r] = 1;
    for (const r of [1, 4, 7]) t[SUIT_BASE[p[1]] + r] = 1;
    for (const r of [2, 5, 8]) t[SUIT_BASE[p[2]] + r] = 1;
    best = Math.min(best, distanceTo(c, t));
  }
  if (best === 0 || best >= 14) return null;
  return { fanName: '七星不靠', points: 24, distance: best, description: '7 字 + 三花色 147/258/369' };
}

function computeQuanShuangKe(c: TileSet): FanPotential | null {
  // 4 even-rank triplets (ranks 1,3,5,7 = 2,4,6,8) + even-rank pair
  // Pick 4 distinct (suit, rank) for triplets + 1 distinct for pair
  // All from set: ranks 1,3,5,7 in any suit (12 options total)
  const evenRanks = [1, 3, 5, 7];
  const evenTiles: number[] = [];
  for (const base of SUIT_BASE) for (const r of evenRanks) evenTiles.push(base + r);

  let best = Infinity;
  // For each combination of 4 tiles for triplets + 1 for pair
  for (let p = 0; p < evenTiles.length; p++) {
    for (let a = 0; a < evenTiles.length; a++) {
      if (a === p) continue;
      for (let b = a + 1; b < evenTiles.length; b++) {
        if (b === p) continue;
        for (let cc = b + 1; cc < evenTiles.length; cc++) {
          if (cc === p) continue;
          for (let d = cc + 1; d < evenTiles.length; d++) {
            if (d === p) continue;
            const t = new Array(34).fill(0);
            t[evenTiles[a]] = 3;
            t[evenTiles[b]] = 3;
            t[evenTiles[cc]] = 3;
            t[evenTiles[d]] = 3;
            t[evenTiles[p]] = 2;
            best = Math.min(best, distanceTo(c, t));
          }
        }
      }
    }
  }
  if (best === 0 || best >= 14) return null;
  return { fanName: '全双刻', points: 24, distance: best, description: '只用 2/4/6/8 组成 4 刻 + 1 对' };
}

function computeQingYiSe(c: TileSet): FanPotential | null {
  let best = Infinity;
  let bestSuit = -1;
  for (let s = 0; s < 3; s++) {
    let nonSuit = 0;
    for (let i = 0; i < 34; i++) {
      const tileSuit = i < 9 ? 0 : i < 18 ? 1 : i < 27 ? 2 : -1;
      if (tileSuit !== s) nonSuit += c.getByIndex(i);
    }
    if (nonSuit < best) { best = nonSuit; bestSuit = s; }
  }
  if (best === 0 || best >= 14 || bestSuit < 0) return null;
  return {
    fanName: '清一色',
    points: 24,
    distance: best,
    description: `去掉 ${best} 张非${SUIT_NAMES[bestSuit]}子`,
  };
}

function computeYiSeSanTongShun(c: TileSet): FanPotential | null {
  // 3 same sequences in one suit + 5 free tiles
  let best = Infinity;
  for (const base of SUIT_BASE) {
    for (let seqStart = 0; seqStart <= 6; seqStart++) {
      const t = new Array(34).fill(0);
      t[base + seqStart] = 3;
      t[base + seqStart + 1] = 3;
      t[base + seqStart + 2] = 3;
      best = Math.min(best, distanceTo(c, t));
    }
  }
  if (best === 0 || best >= 14) return null;
  return { fanName: '一色三同顺', points: 24, distance: best, description: '同花色 3 副相同顺子' };
}

function computeYiSeSanJieGao(c: TileSet): FanPotential | null {
  // 3 consecutive triplets in one suit + 5 free
  let best = Infinity;
  for (const base of SUIT_BASE) {
    for (let start = 0; start <= 6; start++) {
      const t = new Array(34).fill(0);
      for (let k = 0; k < 3; k++) t[base + start + k] = 3;
      best = Math.min(best, distanceTo(c, t));
    }
  }
  if (best === 0 || best >= 14) return null;
  return { fanName: '一色三节高', points: 24, distance: best, description: '同花色 3 副连续递增刻子' };
}

function computeQuanDa(c: TileSet): FanPotential | null {
  // All tiles in ranks 6-9 (789, since 全大 means 7,8,9 only — wait actually 全大=7,8,9 NOT 6,7,8,9)
  // Re-check: 全大 = 由序数牌789组成 → ranks 6,7,8 (0-indexed)
  let nonBig = 0;
  for (let i = 0; i < 34; i++) {
    if (i >= 27) { nonBig += c.getByIndex(i); continue; }
    const r = i % 9;
    if (r < 6) nonBig += c.getByIndex(i);
  }
  if (nonBig === 0 || nonBig >= 14) return null;
  return { fanName: '全大', points: 24, distance: nonBig, description: `去掉 ${nonBig} 张非 7/8/9 牌` };
}

function computeQuanZhong(c: TileSet): FanPotential | null {
  // ranks 3,4,5 (0-indexed) → 4,5,6 displayed
  let nonMid = 0;
  for (let i = 0; i < 34; i++) {
    if (i >= 27) { nonMid += c.getByIndex(i); continue; }
    const r = i % 9;
    if (r < 3 || r > 5) nonMid += c.getByIndex(i);
  }
  if (nonMid === 0 || nonMid >= 14) return null;
  return { fanName: '全中', points: 24, distance: nonMid, description: `去掉 ${nonMid} 张非 4/5/6 牌` };
}

function computeQuanXiao(c: TileSet): FanPotential | null {
  // ranks 0,1,2 → 1,2,3 displayed
  let nonSmall = 0;
  for (let i = 0; i < 34; i++) {
    if (i >= 27) { nonSmall += c.getByIndex(i); continue; }
    const r = i % 9;
    if (r > 2) nonSmall += c.getByIndex(i);
  }
  if (nonSmall === 0 || nonSmall >= 14) return null;
  return { fanName: '全小', points: 24, distance: nonSmall, description: `去掉 ${nonSmall} 张非 1/2/3 牌` };
}

// ── 16番 ──

function computeQingLong(c: TileSet): FanPotential | null {
  // 123 + 456 + 789 in one suit. Need 3 of each suit position 0-8 actually.
  // Wait, just 1 each for positions 0-8 in the suit (forming 3 sequences).
  // Plus 5 more tiles for the meld + pair (any).
  let best = Infinity;
  let bestSuit = -1;
  for (let s = 0; s < 3; s++) {
    const t = new Array(34).fill(0);
    for (let r = 0; r < 9; r++) t[SUIT_BASE[s] + r] = 1;
    const d = distanceTo(c, t);
    if (d < best) { best = d; bestSuit = s; }
  }
  if (best === 0 || best >= 14 || bestSuit < 0) return null;
  return {
    fanName: '清龙',
    points: 16,
    distance: best,
    description: `${SUIT_NAMES[bestSuit]} 1-9 各至少 1 张`,
  };
}

function computeSanSeShuangLongHui(c: TileSet): FanPotential | null {
  // 2 suits each with 123+789, third suit has 55 pair
  const perms = [
    [0, 1, 2], [0, 2, 1], [1, 2, 0],
  ];
  let best = Infinity;
  for (const [a, b, p] of perms) {
    const t = new Array(34).fill(0);
    for (const r of [0, 1, 2, 6, 7, 8]) {
      t[SUIT_BASE[a] + r] = 1;
      t[SUIT_BASE[b] + r] = 1;
    }
    t[SUIT_BASE[p] + 4] = 2;
    best = Math.min(best, distanceTo(c, t));
  }
  if (best === 0 || best >= 14) return null;
  return { fanName: '三色双龙会', points: 16, distance: best, description: '两花色 123+789 + 第三花色 5 对' };
}

function computeSanTongKe(c: TileSet): FanPotential | null {
  // 3 triplets of same rank across 3 suits + 5 free
  let best = Infinity;
  for (let r = 0; r < 9; r++) {
    const t = new Array(34).fill(0);
    t[r] = 3;            // man
    t[9 + r] = 3;        // pin
    t[18 + r] = 3;       // sou
    best = Math.min(best, distanceTo(c, t));
  }
  if (best === 0 || best >= 14) return null;
  return { fanName: '三同刻', points: 16, distance: best, description: '万筒条同序数刻子各 1 副' };
}

// ── 12番 ──

function computeQuanBuKao(c: TileSet): FanPotential | null {
  // 5+ honors (each unique) + numbers from 147/258/369 (one suit per group)
  // Distance = like 七星不靠 but accept 5-7 honors
  // Simpler: same target as 七星不靠 minus 0-2 honors
  const perms = [
    [0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0],
  ];
  let best = Infinity;
  for (const p of perms) {
    const t = new Array(34).fill(0);
    for (let i = 27; i < 34; i++) t[i] = 1;
    for (const r of [0, 3, 6]) t[SUIT_BASE[p[0]] + r] = 1;
    for (const r of [1, 4, 7]) t[SUIT_BASE[p[1]] + r] = 1;
    for (const r of [2, 5, 8]) t[SUIT_BASE[p[2]] + r] = 1;
    best = Math.min(best, distanceTo(c, t));
  }
  if (best === 0 || best >= 14) return null;
  return { fanName: '全不靠', points: 12, distance: best, description: '5+ 字 + 三花色 147/258/369' };
}

function computeDaYuWu(c: TileSet): FanPotential | null {
  // ranks 5-8 (6789)
  let bad = 0;
  for (let i = 0; i < 34; i++) {
    if (i >= 27) { bad += c.getByIndex(i); continue; }
    const r = i % 9;
    if (r < 5) bad += c.getByIndex(i);
  }
  if (bad === 0 || bad >= 14) return null;
  return { fanName: '大于五', points: 12, distance: bad, description: `去掉 ${bad} 张非 6-9 牌` };
}

function computeXiaoYuWu(c: TileSet): FanPotential | null {
  let bad = 0;
  for (let i = 0; i < 34; i++) {
    if (i >= 27) { bad += c.getByIndex(i); continue; }
    const r = i % 9;
    if (r > 3) bad += c.getByIndex(i);
  }
  if (bad === 0 || bad >= 14) return null;
  return { fanName: '小于五', points: 12, distance: bad, description: `去掉 ${bad} 张非 1-4 牌` };
}

// ── 8番 ──

function computeHuaLong(c: TileSet): FanPotential | null {
  // 123 in suit a, 456 in suit b, 789 in suit c (3 suits)
  const perms = [
    [0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0],
  ];
  let best = Infinity;
  for (const p of perms) {
    const t = new Array(34).fill(0);
    t[SUIT_BASE[p[0]] + 0] = 1; t[SUIT_BASE[p[0]] + 1] = 1; t[SUIT_BASE[p[0]] + 2] = 1;
    t[SUIT_BASE[p[1]] + 3] = 1; t[SUIT_BASE[p[1]] + 4] = 1; t[SUIT_BASE[p[1]] + 5] = 1;
    t[SUIT_BASE[p[2]] + 6] = 1; t[SUIT_BASE[p[2]] + 7] = 1; t[SUIT_BASE[p[2]] + 8] = 1;
    best = Math.min(best, distanceTo(c, t));
  }
  if (best === 0 || best >= 14) return null;
  return { fanName: '花龙', points: 8, distance: best, description: '三花色组成 1-9（123+456+789）' };
}

// ── 6番 ──

function computeHunYiSe(c: TileSet): FanPotential | null {
  // One suit + honors only
  let best = Infinity;
  let bestSuit = -1;
  for (let s = 0; s < 3; s++) {
    let bad = 0;
    for (let i = 0; i < 27; i++) {
      const tileSuit = Math.floor(i / 9);
      if (tileSuit !== s) bad += c.getByIndex(i);
    }
    if (bad < best) { best = bad; bestSuit = s; }
  }
  if (best === 0 || best >= 14 || bestSuit < 0) return null;
  return {
    fanName: '混一色',
    points: 6,
    distance: best,
    description: `去掉 ${best} 张非${SUIT_NAMES[bestSuit]}子（保留字牌）`,
  };
}

// ── 2番 ──

function computeDuanYao(c: TileSet): FanPotential | null {
  // No 1, 9, or honors
  let bad = 0;
  for (let i = 0; i < 34; i++) {
    if (i >= 27) { bad += c.getByIndex(i); continue; }
    const r = i % 9;
    if (r === 0 || r === 8) bad += c.getByIndex(i);
  }
  if (bad === 0 || bad >= 14) return null;
  return { fanName: '断幺', points: 2, distance: bad, description: `去掉 ${bad} 张 1/9/字 牌` };
}

// ── Main entry ──

export function calculateFanPotential(allCounts: TileSet): FanPotential[] {
  const results: FanPotential[] = [];
  const c = allCounts;

  const adders: Array<(c: TileSet) => FanPotential | null> = [
    // 88
    computeDaSiXi, computeDaSanYuan, computeLvYiSe, computeJiuLianBaoDeng,
    computeLianQiDui, computeShiSanYao,
    // 64
    computeQingYaoJiu, computeXiaoSiXi, computeXiaoSanYuan, computeZiYiSe, computeYiSeShuangLongHui,
    // 48
    computeYiSeSiTongShun, computeYiSeSiJieGao,
    // 32
    computeHunYaoJiu,
    // 24
    computeQiDui, computeQiXingBuKao, computeQuanShuangKe, computeQingYiSe,
    computeYiSeSanTongShun, computeYiSeSanJieGao, computeQuanDa, computeQuanZhong, computeQuanXiao,
    // 16
    computeQingLong, computeSanSeShuangLongHui, computeSanTongKe,
    // 12
    computeQuanBuKao, computeDaYuWu, computeXiaoYuWu,
    // 8
    computeHuaLong,
    // 6
    computeHunYiSe,
    // 2
    computeDuanYao,
  ];

  for (const fn of adders) {
    const r = fn(c);
    if (r) results.push(r);
  }

  // Sort by distance asc, then points desc
  results.sort((a, b) => {
    if (a.distance !== b.distance) return a.distance - b.distance;
    return b.points - a.points;
  });

  return results;
}
