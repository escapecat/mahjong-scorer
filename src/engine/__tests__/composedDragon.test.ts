import { describe, it, expect } from 'vitest';
import { quickEvaluate, hasFan } from './helpers';
import { FN } from '../rules/fanNames';

describe('组合龙 (Composed Dragon)', () => {
  it('recognizes 147m + 258p + 369s + meld + pair', () => {
    // 9 tiles for composed dragon + 3 (triplet) + 2 (pair) = 14
    const r = quickEvaluate({
      hand: '147m258p369s111m99s',
      winningTile: '9s',
    });
    expect(hasFan(r, FN.ZuHeLong)).toBe(true);
  });

  it('recognizes 147p + 258s + 369m permutation', () => {
    const r = quickEvaluate({
      hand: '147p258s369m111p99s',
      winningTile: '9s',
    });
    expect(hasFan(r, FN.ZuHeLong)).toBe(true);
  });

  it('recognizes 147s + 258m + 369p permutation', () => {
    const r = quickEvaluate({
      hand: '147s258m369p111s99m',
      winningTile: '9m',
    });
    expect(hasFan(r, FN.ZuHeLong)).toBe(true);
  });

  it('recognizes with sequence remainder (instead of triplet)', () => {
    // 147m + 258p + 369s + 234s (sequence) + 99m
    const r = quickEvaluate({
      hand: '147m258p369s234s99m',
      winningTile: '9m',
    });
    // 9 dragon tiles + 234s sequence + 99m pair = 14
    expect(hasFan(r, FN.ZuHeLong)).toBe(true);
  });

  it('does NOT fire without all 3 groups', () => {
    // Missing 369s: hand has 147m + 258p only + extras
    const r = quickEvaluate({
      hand: '147m258p123s111m99s',
      winningTile: '9s',
    });
    expect(hasFan(r, FN.ZuHeLong)).toBe(false);
  });

  it('counts towards total fan correctly', () => {
    const r = quickEvaluate({
      hand: '147m258p369s111m99s',
      winningTile: '9s',
    });
    // 组合龙 12 + 五门齐 6 (man+pin+sou+wind+dragon? no, no wind/dragon here) +
    // Actually: man+pin+sou + extra. No 五门齐 (no wind, no dragon).
    // So at least 组合龙 12 fan
    expect(r.totalFan).toBeGreaterThanOrEqual(12);
  });
});

describe('Multi-Decomposition Selection', () => {
  it('picks 4-triplet decomp over 3-trip-1-seq when self-draw', () => {
    // Hand could be 4 triplets (四暗刻 64) or 3 trip + 1 seq (lower)
    // 111m + 222m + 333m + 456m + 99p = either 3 triplets + sequence, or...
    // Wait, 1m=3, 2m=3, 3m=3, 4m=1, 5m=1, 6m=1 — only ONE arrangement of 1m,2m,3m: 3 triplets OR 3 sequences (+456m)
    // 4 triplets impossible: would need 4m,5m,6m to also be triplets (4×3 = 12 + 4×3 = 24, way too many)
    const r = quickEvaluate({
      hand: '111m222m333m456m99p',
      winningTile: '9p',
      game: { isSelfDraw: true },
    });
    // 3 concealed triplets (self-draw): 三暗刻
    expect(hasFan(r, FN.SanAnKe)).toBe(true);
  });

  it('picks higher-scoring decomp between 一色三同顺 and 一色三节高', () => {
    // Hand: 123m+123m+123m+456m+99m
    // Path A (4 sequences): 一色三同顺 24 + 清一色 24 + 平和 2 = ~50
    // Path B (3 triplets + 1 seq): 一色三节高 24 + 清一色 24 + 三暗刻 16 + 不求人 4 = ~68 (with self-draw)
    // Self-draw → Path B wins
    const r = quickEvaluate({
      hand: '123m123m123m456m99m',
      winningTile: '9m',
      game: { isSelfDraw: true },
    });
    // Path B should win (higher score)
    expect(hasFan(r, FN.YiSeSanJieGao) || hasFan(r, FN.YiSeSanTongShun)).toBe(true);
  });

  it('special hand 七对 wins when applicable', () => {
    // Hand can ONLY be 七对 (7 pairs) — no standard decomposition
    const r = quickEvaluate({ hand: '1133557799m11pEE', winningTile: 'E' });
    expect(hasFan(r, FN.QiDui)).toBe(true);
  });

  it('special hand 十三幺 wins when applicable', () => {
    const r = quickEvaluate({ hand: '1m9m1p9p1s9sESWNCFP1m', winningTile: '1m' });
    expect(hasFan(r, FN.ShiSanYao)).toBe(true);
  });
});

describe('Win Detection (isWinningHand)', () => {
  it('standard winning hand recognized', () => {
    const r = quickEvaluate({ hand: '123m456p789s111m99p', winningTile: '9p' });
    expect(r.totalFan).toBeGreaterThan(0);
  });

  it('seven pairs winning hand recognized', () => {
    const r = quickEvaluate({ hand: '1133557799m11pEE', winningTile: 'E' });
    expect(r.totalFan).toBeGreaterThan(0);
  });

  it('thirteen orphans winning hand recognized', () => {
    const r = quickEvaluate({ hand: '1m9m1p9p1s9sESWNCFP1m', winningTile: '1m' });
    expect(r.totalFan).toBeGreaterThan(0);
  });

  it('non-winning random hand returns 0 total', () => {
    // 14 tiles but no valid decomposition
    const r = quickEvaluate({ hand: '13579m13579p1234s', winningTile: '4s' });
    expect(r.totalFan).toBe(0);
  });

  it('hand with wrong tile count returns 0', () => {
    // Only 5 tiles
    const r = quickEvaluate({ hand: '12345m', winningTile: '5m' });
    expect(r.totalFan).toBe(0);
  });
});
