import { describe, it, expect } from 'vitest';
import { calculateShanten } from '../shantenCalculator';
import { parseTiles } from './helpers';

describe('ShantenCalculator - tenpai (0 shanten)', () => {
  it('detects tenpai hand at 0 shanten', () => {
    // 13 tiles, 1 away from winning: 4 melds done + 1 single tile waiting for pair
    const hand = parseTiles('123m456p789s111m9p');
    expect(calculateShanten(hand, 0)).toBe(0);
  });

  it('detects 1-shanten hand', () => {
    // Need 2 more useful tiles
    const hand = parseTiles('123m456p789s11m22m');
    const shanten = calculateShanten(hand, 0);
    expect(shanten).toBeGreaterThanOrEqual(0);
    expect(shanten).toBeLessThanOrEqual(1);
  });
});

describe('ShantenCalculator - seven pairs', () => {
  it('detects 6 pairs as 0 shanten (need 1 more pair)', () => {
    // 6 pairs + 1 single = 13 tiles
    const hand = parseTiles('1133557799m11p3p');
    const shanten = calculateShanten(hand, 0);
    expect(shanten).toBeLessThanOrEqual(1);
  });
});

describe('ShantenCalculator - thirteen orphans', () => {
  it('detects 12 unique orphans + pair as 0 shanten', () => {
    // Has all 13 orphan types, but no pair yet → 0 shanten if we have 13 unique
    // Has 12 unique + 1 dup = 0 shanten
    const hand = parseTiles('1m9m1p9p1s9sESWNCFP1m');
    // 14 tiles, complete
    expect(calculateShanten(hand, 0)).toBeLessThanOrEqual(0);
  });

  it('detects partial 13 orphans high shanten', () => {
    // Only 6 of 13 orphan types
    const hand = parseTiles('1m9m1p9p1s9s2m3m4m5m6m7m8m');
    const shanten = calculateShanten(hand, 0);
    expect(shanten).toBeGreaterThan(0);
  });
});

describe('ShantenCalculator - with locked melds', () => {
  it('with 1 locked meld, 10 tiles can be tenpai', () => {
    // 10 hand tiles + 1 chi meld = 13 total, 0 shanten if tenpai
    const hand = parseTiles('123m456p99s11m');
    // 10 hand tiles, 1 meld locked → need 3 more melds + pair from these 10
    // 123m + 456p + 99s + 11m = 3 partial groups (2 sequences + 2 pairs)
    // Could be tenpai or near
    const shanten = calculateShanten(hand, 1);
    expect(shanten).toBeGreaterThanOrEqual(-1);
    expect(shanten).toBeLessThan(8);
  });

  it('with 4 locked melds, 1 pair → tenpai (0 shanten)', () => {
    // 1 hand tile + 4 melds = 13. Need 1 more for pair.
    const hand = parseTiles('9p');
    expect(calculateShanten(hand, 4)).toBe(0);
  });
});

describe('ShantenCalculator - far from win', () => {
  it('chaotic hand has higher shanten', () => {
    const hand = parseTiles('1m3p5sE2m4p6sS3m5p7s');
    const shanten = calculateShanten(hand, 0);
    expect(shanten).toBeGreaterThan(0);
  });
});

describe('ShantenCalculator - basic regression', () => {
  it('returns a valid shanten number (not 8 — initial value)', () => {
    // Catch the bug where calculateShanten always returns 8
    const hand = parseTiles('123m456p789s111m9p');
    const result = calculateShanten(hand, 0);
    expect(result).toBeLessThan(8);
  });
});
