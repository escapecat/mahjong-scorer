import { TileSet } from './models/tileSet';
import { tileFromIndex, type Tile } from './models/tile';

export interface MissingTile {
  tile: Tile;
  count: number;
}

export interface FanPotential {
  fanName: string;
  points: number;
  /** Number of tiles that need to be swapped to reach this pattern */
  distance: number;
  /** Brief human-readable hint */
  description: string;
  /** Specific tiles still needed (only populated for "targeted" fans) */
  missingTiles?: MissingTile[];
}

/** Compute distance and the specific tiles still needed for a target distribution. */
function computeDiff(current: TileSet, target: number[]): { distance: number; missing: MissingTile[] } {
  const missing: MissingTile[] = [];
  let distance = 0;
  for (let i = 0; i < 34; i++) {
    const have = current.getByIndex(i);
    const want = target[i];
    if (want > have) {
      const need = want - have;
      distance += need;
      missing.push({ tile: tileFromIndex(i), count: need });
    }
  }
  return { distance, missing };
}

const SUIT_BASE = [0, 9, 18]; // man, pin, sou
const SUIT_NAMES = ['万', '筒', '条'];

// ── 88番 ──

function computeDaSiXi(c: TileSet): FanPotential | null {
  // Target: 12 wind tiles (3 of each E,S,W,N) + 2 pair (any non-wind)
  let best = Infinity;
  let bestMissing: MissingTile[] = [];
  for (let pair = 0; pair < 34; pair++) {
    if (pair >= 27 && pair <= 30) continue; // pair can't be wind
    const t = new Array(34).fill(0);
    t[27] = 3; t[28] = 3; t[29] = 3; t[30] = 3;
    t[pair] = 2;
    const r = computeDiff(c, t);
    if (r.distance < best) { best = r.distance; bestMissing = r.missing; }
  }
  if (best === 0 || best >= 14) return null;
  return { fanName: '大四喜', points: 88, distance: best, description: '凑齐 4 副风刻 + 1 对', missingTiles: bestMissing };
}

function computeDaSanYuan(c: TileSet): FanPotential | null {
  // Target: 9 dragon tiles (3 each of C,F,P) + 5 free tiles
  const t = new Array(34).fill(0);
  t[31] = 3; t[32] = 3; t[33] = 3;
  const r = computeDiff(c, t);
  if (r.distance === 0 || r.distance >= 14) return null;
  return { fanName: '大三元', points: 88, distance: r.distance, description: '凑齐 3 副箭刻（中发白）', missingTiles: r.missing };
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
  let bestMissing: MissingTile[] = [];
  for (const base of SUIT_BASE) {
    for (let extra = 0; extra < 9; extra++) {
      const t = new Array(34).fill(0);
      const required = [3, 1, 1, 1, 1, 1, 1, 1, 3];
      for (let r = 0; r < 9; r++) t[base + r] = required[r];
      t[base + extra] += 1;
      const r = computeDiff(c, t);
      if (r.distance < best) { best = r.distance; bestMissing = r.missing; }
    }
  }
  if (best === 0 || best >= 14) return null;
  return { fanName: '九莲宝灯', points: 88, distance: best, description: '凑齐 1112345678999 同花色', missingTiles: bestMissing };
}

function computeLianQiDui(c: TileSet): FanPotential | null {
  // 7 consecutive pairs in one suit
  let best = Infinity;
  let bestMissing: MissingTile[] = [];
  for (const base of SUIT_BASE) {
    for (let start = 0; start <= 2; start++) {
      const t = new Array(34).fill(0);
      for (let r = 0; r < 7; r++) t[base + start + r] = 2;
      const r = computeDiff(c, t);
      if (r.distance < best) { best = r.distance; bestMissing = r.missing; }
    }
  }
  if (best === 0 || best >= 14) return null;
  return { fanName: '连七对', points: 88, distance: best, description: '凑齐同花色 7 个连续对子', missingTiles: bestMissing };
}

function computeShiSanYao(c: TileSet): FanPotential | null {
  // 13 orphans (1m,9m,1p,9p,1s,9s,E,S,W,N,C,F,P) + 1 extra orphan
  const orphans = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];
  let best = Infinity;
  let bestMissing: MissingTile[] = [];
  for (const extraOrphan of orphans) {
    const t = new Array(34).fill(0);
    for (const o of orphans) t[o] = 1;
    t[extraOrphan] = 2;
    const r = computeDiff(c, t);
    if (r.distance < best) { best = r.distance; bestMissing = r.missing; }
  }
  if (best === 0 || best >= 14) return null;
  return { fanName: '十三幺', points: 88, distance: best, description: '凑齐 13 种幺九 + 任 1 张幺九', missingTiles: bestMissing };
}

// ── 64番 ──

function computeQingYaoJiu(c: TileSet): FanPotential | null {
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
  let bestMissing: MissingTile[] = [];
  for (let pairWind = 0; pairWind < 4; pairWind++) {
    const t = new Array(34).fill(0);
    for (let w = 0; w < 4; w++) t[27 + w] = w === pairWind ? 2 : 3;
    const r = computeDiff(c, t);
    if (r.distance < best) { best = r.distance; bestMissing = r.missing; }
  }
  if (best === 0 || best >= 14) return null;
  return { fanName: '小四喜', points: 64, distance: best, description: '3 副风刻 + 1 副风对子', missingTiles: bestMissing };
}

function computeXiaoSanYuan(c: TileSet): FanPotential | null {
  let best = Infinity;
  let bestMissing: MissingTile[] = [];
  for (let pairDragon = 0; pairDragon < 3; pairDragon++) {
    const t = new Array(34).fill(0);
    for (let d = 0; d < 3; d++) t[31 + d] = d === pairDragon ? 2 : 3;
    const r = computeDiff(c, t);
    if (r.distance < best) { best = r.distance; bestMissing = r.missing; }
  }
  if (best === 0 || best >= 14) return null;
  return { fanName: '小三元', points: 64, distance: best, description: '2 副箭刻 + 1 副箭对子', missingTiles: bestMissing };
}

function computeZiYiSe(c: TileSet): FanPotential | null {
  let nonHonor = 0;
  for (let i = 0; i < 27; i++) nonHonor += c.getByIndex(i);
  if (nonHonor === 0 || nonHonor >= 14) return null;
  return { fanName: '字一色', points: 64, distance: nonHonor, description: `去掉 ${nonHonor} 张数字牌` };
}

function computeYiSeShuangLongHui(c: TileSet): FanPotential | null {
  // Same suit: 123 + 789 + 123 + 789 + 55  →  pattern [2,2,2,0,2,0,2,2,2] = 14 tiles
  let best = Infinity;
  let bestMissing: MissingTile[] = [];
  for (const base of SUIT_BASE) {
    const t = new Array(34).fill(0);
    const pattern = [2, 2, 2, 0, 2, 0, 2, 2, 2];
    for (let r = 0; r < 9; r++) t[base + r] = pattern[r];
    const r = computeDiff(c, t);
    if (r.distance < best) { best = r.distance; bestMissing = r.missing; }
  }
  if (best === 0 || best >= 14) return null;
  return { fanName: '一色双龙会', points: 64, distance: best, description: '同花色 123×2 + 789×2 + 5对', missingTiles: bestMissing };
}

// ── 48番 ──

function computeYiSeSiTongShun(c: TileSet): FanPotential | null {
  // 4 same sequences in one suit + 2 pair (any other tile)
  let best = Infinity;
  let bestMissing: MissingTile[] = [];
  for (const base of SUIT_BASE) {
    for (let seqStart = 0; seqStart <= 6; seqStart++) {
      for (let pair = 0; pair < 34; pair++) {
        if (pair >= base && pair < base + 9 && pair >= base + seqStart && pair < base + seqStart + 3) continue;
        const t = new Array(34).fill(0);
        t[base + seqStart] = 4;
        t[base + seqStart + 1] = 4;
        t[base + seqStart + 2] = 4;
        t[pair] = (t[pair] || 0) + 2;
        const r = computeDiff(c, t);
        if (r.distance < best) { best = r.distance; bestMissing = r.missing; }
      }
    }
  }
  if (best === 0 || best >= 14) return null;
  return { fanName: '一色四同顺', points: 48, distance: best, description: '同花色 4 副相同顺子', missingTiles: bestMissing };
}

function computeYiSeSiJieGao(c: TileSet): FanPotential | null {
  // 4 consecutive triplets in one suit + pair
  let best = Infinity;
  let bestMissing: MissingTile[] = [];
  for (const base of SUIT_BASE) {
    for (let start = 0; start <= 5; start++) {
      for (let pair = 0; pair < 34; pair++) {
        if (pair >= base + start && pair < base + start + 4) continue;
        const t = new Array(34).fill(0);
        for (let k = 0; k < 4; k++) t[base + start + k] = 3;
        t[pair] = (t[pair] || 0) + 2;
        const r = computeDiff(c, t);
        if (r.distance < best) { best = r.distance; bestMissing = r.missing; }
      }
    }
  }
  if (best === 0 || best >= 14) return null;
  return { fanName: '一色四节高', points: 48, distance: best, description: '同花色 4 副连续递增刻子', missingTiles: bestMissing };
}

// ── 32番 ──

function computeHunYaoJiu(c: TileSet): FanPotential | null {
  let nonYaoJiu = 0;
  for (let i = 0; i < 27; i++) {
    const r = i % 9;
    if (r !== 0 && r !== 8) nonYaoJiu += c.getByIndex(i);
  }
  let honorCount = 0;
  for (let i = 27; i < 34; i++) honorCount += c.getByIndex(i);

  let dist = nonYaoJiu;
  if (honorCount === 0) dist += 1;

  if (dist === 0 || dist >= 14) return null;
  return { fanName: '混幺九', points: 32, distance: dist, description: '只用 1/9/字 牌（含字牌）' };
}

function computeYiSeSiBuGao(c: TileSet): FanPotential | null {
  // 4 stepped sequences in one suit (step 1 or 2)
  let best = Infinity;
  let bestMissing: MissingTile[] = [];
  for (const base of SUIT_BASE) {
    for (let start = 0; start <= 3; start++) {
      const t = new Array(34).fill(0);
      for (let s = start; s < start + 4; s++) {
        t[base + s] += 1;
        t[base + s + 1] += 1;
        t[base + s + 2] += 1;
      }
      const r = computeDiff(c, t);
      if (r.distance < best) { best = r.distance; bestMissing = r.missing; }
    }
    {
      const t = new Array(34).fill(0);
      for (const s of [0, 2, 4, 6]) {
        t[base + s] += 1;
        t[base + s + 1] += 1;
        t[base + s + 2] += 1;
      }
      const r = computeDiff(c, t);
      if (r.distance < best) { best = r.distance; bestMissing = r.missing; }
    }
  }
  if (best === 0 || best >= 14) return null;
  return { fanName: '一色四步高', points: 32, distance: best, description: '同花色 4 副阶梯顺子', missingTiles: bestMissing };
}

// ── 24番 ──

function computeQiDui(c: TileSet): FanPotential | null {
  // 7 distinct pairs (any tiles). Only the top 7 tile types contribute —
  // a hand with 11 different singletons doesn't get credit for all 11.
  const contributions: { idx: number; v: number }[] = [];
  for (let i = 0; i < 34; i++) {
    contributions.push({ idx: i, v: Math.min(2, c.getByIndex(i)) });
  }
  contributions.sort((a, b) => b.v - a.v);
  const top7 = contributions.slice(0, 7);
  const top7Sum = top7.reduce((s, x) => s + x.v, 0);
  const dist = 14 - top7Sum;
  if (dist === 0 || dist >= 14) return null;
  // Missing: for each of top 7 with v < 2, we need (2 - v) more copies of THAT tile
  const missing: MissingTile[] = [];
  for (const x of top7) {
    if (x.v < 2) missing.push({ tile: tileFromIndex(x.idx), count: 2 - x.v });
  }
  return { fanName: '七对', points: 24, distance: dist, description: '凑齐 7 个对子', missingTiles: missing };
}

function computeQiXingBuKao(c: TileSet): FanPotential | null {
  // 14 = 7 distinct honors + 7 of 9 knitted positions (1+4+7 / 2+5+8 / 3+6+9 across 3 suits)
  const perms = [
    [0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0],
  ];
  let best = Infinity;
  let bestMissing: MissingTile[] = [];
  for (const p of perms) {
    const knitted: number[] = [];
    for (const r of [0, 3, 6]) knitted.push(SUIT_BASE[p[0]] + r);
    for (const r of [1, 4, 7]) knitted.push(SUIT_BASE[p[1]] + r);
    for (const r of [2, 5, 8]) knitted.push(SUIT_BASE[p[2]] + r);
    // Pick 7 of the 9 knitted positions (drop 2)
    for (let s1 = 0; s1 < 9; s1++) {
      for (let s2 = s1 + 1; s2 < 9; s2++) {
        const t = new Array(34).fill(0);
        for (let i = 27; i < 34; i++) t[i] = 1;
        for (let k = 0; k < 9; k++) {
          if (k !== s1 && k !== s2) t[knitted[k]] = 1;
        }
        const r = computeDiff(c, t);
        if (r.distance < best) { best = r.distance; bestMissing = r.missing; }
      }
    }
  }
  if (best === 0 || best >= 14) return null;
  return { fanName: '七星不靠', points: 24, distance: best, description: '7 字 + 三花色 147/258/369 中选 7 张', missingTiles: bestMissing };
}

function computeQuanShuangKe(c: TileSet): FanPotential | null {
  const evenRanks = [1, 3, 5, 7];
  const evenTiles: number[] = [];
  for (const base of SUIT_BASE) for (const r of evenRanks) evenTiles.push(base + r);

  let best = Infinity;
  let bestMissing: MissingTile[] = [];
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
            const r = computeDiff(c, t);
            if (r.distance < best) { best = r.distance; bestMissing = r.missing; }
          }
        }
      }
    }
  }
  if (best === 0 || best >= 14) return null;
  return { fanName: '全双刻', points: 24, distance: best, description: '只用 2/4/6/8 组成 4 刻 + 1 对', missingTiles: bestMissing };
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
  let best = Infinity;
  let bestMissing: MissingTile[] = [];
  for (const base of SUIT_BASE) {
    for (let seqStart = 0; seqStart <= 6; seqStart++) {
      const t = new Array(34).fill(0);
      t[base + seqStart] = 3;
      t[base + seqStart + 1] = 3;
      t[base + seqStart + 2] = 3;
      const r = computeDiff(c, t);
      if (r.distance < best) { best = r.distance; bestMissing = r.missing; }
    }
  }
  if (best === 0 || best >= 14) return null;
  return { fanName: '一色三同顺', points: 24, distance: best, description: '同花色 3 副相同顺子', missingTiles: bestMissing };
}

function computeYiSeSanJieGao(c: TileSet): FanPotential | null {
  let best = Infinity;
  let bestMissing: MissingTile[] = [];
  for (const base of SUIT_BASE) {
    for (let start = 0; start <= 6; start++) {
      const t = new Array(34).fill(0);
      for (let k = 0; k < 3; k++) t[base + start + k] = 3;
      const r = computeDiff(c, t);
      if (r.distance < best) { best = r.distance; bestMissing = r.missing; }
    }
  }
  if (best === 0 || best >= 14) return null;
  return { fanName: '一色三节高', points: 24, distance: best, description: '同花色 3 副连续递增刻子', missingTiles: bestMissing };
}

function computeQuanDa(c: TileSet): FanPotential | null {
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

function computeYiSeSanBuGao(c: TileSet): FanPotential | null {
  let best = Infinity;
  let bestMissing: MissingTile[] = [];
  for (const base of SUIT_BASE) {
    for (let start = 0; start <= 4; start++) {
      const t = new Array(34).fill(0);
      for (let s = start; s < start + 3; s++) {
        t[base + s] += 1;
        t[base + s + 1] += 1;
        t[base + s + 2] += 1;
      }
      const r = computeDiff(c, t);
      if (r.distance < best) { best = r.distance; bestMissing = r.missing; }
    }
    for (let start = 0; start <= 2; start++) {
      const t = new Array(34).fill(0);
      for (const offset of [0, 2, 4]) {
        const s = start + offset;
        t[base + s] += 1;
        t[base + s + 1] += 1;
        t[base + s + 2] += 1;
      }
      const r = computeDiff(c, t);
      if (r.distance < best) { best = r.distance; bestMissing = r.missing; }
    }
  }
  if (best === 0 || best >= 14) return null;
  return { fanName: '一色三步高', points: 16, distance: best, description: '同花色 3 副阶梯顺子', missingTiles: bestMissing };
}

function computeQuanDaiWu(c: TileSet): FanPotential | null {
  // Heuristic: ranks 2-6 + at least 6 fives
  let bad = 0;
  let fives = 0;
  for (let i = 0; i < 34; i++) {
    if (i >= 27) { bad += c.getByIndex(i); continue; }
    const r = i % 9;
    if (r < 2 || r > 6) bad += c.getByIndex(i);
    if (r === 4) fives += c.getByIndex(i);
  }
  const minFiveSwaps = Math.max(0, 6 - fives);
  const dist = Math.max(bad, minFiveSwaps);
  if (dist === 0 || dist >= 14) return null;
  return { fanName: '全带五', points: 16, distance: dist, description: '每副面子+将都含 5（粗略估计）' };
}

function computeQingLong(c: TileSet): FanPotential | null {
  let best = Infinity;
  let bestSuit = -1;
  let bestMissing: MissingTile[] = [];
  for (let s = 0; s < 3; s++) {
    const t = new Array(34).fill(0);
    for (let r = 0; r < 9; r++) t[SUIT_BASE[s] + r] = 1;
    const r = computeDiff(c, t);
    if (r.distance < best) { best = r.distance; bestSuit = s; bestMissing = r.missing; }
  }
  if (best === 0 || best >= 14 || bestSuit < 0) return null;
  return {
    fanName: '清龙',
    points: 16,
    distance: best,
    description: `${SUIT_NAMES[bestSuit]} 1-9 各至少 1 张`,
    missingTiles: bestMissing,
  };
}

function computeSanSeShuangLongHui(c: TileSet): FanPotential | null {
  const perms = [
    [0, 1, 2], [0, 2, 1], [1, 2, 0],
  ];
  let best = Infinity;
  let bestMissing: MissingTile[] = [];
  for (const [a, b, p] of perms) {
    const t = new Array(34).fill(0);
    for (const r of [0, 1, 2, 6, 7, 8]) {
      t[SUIT_BASE[a] + r] = 1;
      t[SUIT_BASE[b] + r] = 1;
    }
    t[SUIT_BASE[p] + 4] = 2;
    const r = computeDiff(c, t);
    if (r.distance < best) { best = r.distance; bestMissing = r.missing; }
  }
  if (best === 0 || best >= 14) return null;
  return { fanName: '三色双龙会', points: 16, distance: best, description: '两花色 123+789 + 第三花色 5 对', missingTiles: bestMissing };
}

function computeSanTongKe(c: TileSet): FanPotential | null {
  let best = Infinity;
  let bestMissing: MissingTile[] = [];
  for (let r = 0; r < 9; r++) {
    const t = new Array(34).fill(0);
    t[r] = 3;
    t[9 + r] = 3;
    t[18 + r] = 3;
    const res = computeDiff(c, t);
    if (res.distance < best) { best = res.distance; bestMissing = res.missing; }
  }
  if (best === 0 || best >= 14) return null;
  return { fanName: '三同刻', points: 16, distance: best, description: '万筒条同序数刻子各 1 副', missingTiles: bestMissing };
}

// ── 12番 ──

function computeQuanBuKao(c: TileSet): FanPotential | null {
  // 14 distinct tiles chosen from {7 honors} ∪ {9 knitted in some perm} (drop 2 of 16)
  const perms = [
    [0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0],
  ];
  let best = Infinity;
  let bestMissing: MissingTile[] = [];
  for (const p of perms) {
    const candidates: number[] = [];
    for (let i = 27; i < 34; i++) candidates.push(i);
    for (const r of [0, 3, 6]) candidates.push(SUIT_BASE[p[0]] + r);
    for (const r of [1, 4, 7]) candidates.push(SUIT_BASE[p[1]] + r);
    for (const r of [2, 5, 8]) candidates.push(SUIT_BASE[p[2]] + r);
    // Pick 14 of 16 (drop any 2)
    for (let d1 = 0; d1 < 16; d1++) {
      for (let d2 = d1 + 1; d2 < 16; d2++) {
        const t = new Array(34).fill(0);
        for (let k = 0; k < 16; k++) {
          if (k !== d1 && k !== d2) t[candidates[k]] = 1;
        }
        const r = computeDiff(c, t);
        if (r.distance < best) { best = r.distance; bestMissing = r.missing; }
      }
    }
  }
  if (best === 0 || best >= 14) return null;
  return { fanName: '全不靠', points: 12, distance: best, description: '14 张分布于 7 字 + 三花色 147/258/369', missingTiles: bestMissing };
}

function computeDaYuWu(c: TileSet): FanPotential | null {
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
  const perms = [
    [0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0],
  ];
  let best = Infinity;
  let bestMissing: MissingTile[] = [];
  for (const p of perms) {
    const t = new Array(34).fill(0);
    t[SUIT_BASE[p[0]] + 0] = 1; t[SUIT_BASE[p[0]] + 1] = 1; t[SUIT_BASE[p[0]] + 2] = 1;
    t[SUIT_BASE[p[1]] + 3] = 1; t[SUIT_BASE[p[1]] + 4] = 1; t[SUIT_BASE[p[1]] + 5] = 1;
    t[SUIT_BASE[p[2]] + 6] = 1; t[SUIT_BASE[p[2]] + 7] = 1; t[SUIT_BASE[p[2]] + 8] = 1;
    const r = computeDiff(c, t);
    if (r.distance < best) { best = r.distance; bestMissing = r.missing; }
  }
  if (best === 0 || best >= 14) return null;
  return { fanName: '花龙', points: 8, distance: best, description: '三花色组成 1-9（123+456+789）', missingTiles: bestMissing };
}

// ── 6番 ──

function computeHunYiSe(c: TileSet): FanPotential | null {
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
    computeYiSeSiBuGao, computeHunYaoJiu,
    // 24
    computeQiDui, computeQiXingBuKao, computeQuanShuangKe, computeQingYiSe,
    computeYiSeSanTongShun, computeYiSeSanJieGao, computeQuanDa, computeQuanZhong, computeQuanXiao,
    // 16
    computeYiSeSanBuGao, computeQuanDaiWu, computeQingLong, computeSanSeShuangLongHui, computeSanTongKe,
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

  results.sort((a, b) => {
    if (a.distance !== b.distance) return a.distance - b.distance;
    return b.points - a.points;
  });

  return results;
}
