import { describe, it, expect } from 'vitest';
import { TileSet } from '../models/tileSet';
import { tile, Tiles } from '../models/tile';
import { decomposeHand, isWinningHand, canFormSets } from '../decomposer';

describe('decomposeHand', () => {
  it('decomposes a simple winning hand', () => {
    // 123m 456m 789m 111p 99s
    const ts = new TileSet();
    ts.add(tile('man', 0)); ts.add(tile('man', 1)); ts.add(tile('man', 2));
    ts.add(tile('man', 3)); ts.add(tile('man', 4)); ts.add(tile('man', 5));
    ts.add(tile('man', 6)); ts.add(tile('man', 7)); ts.add(tile('man', 8));
    ts.add(tile('pin', 0), 3);
    ts.add(tile('sou', 8), 2);

    const decomps = decomposeHand(ts);
    expect(decomps.length).toBeGreaterThan(0);

    // Should have at least one decomp with 4 melds + pair
    const d = decomps[0];
    expect(d.melds).toHaveLength(4);
    expect(d.pair.suit).toBe('sou');
    expect(d.pair.rank).toBe(8);
  });

  it('returns multiple decompositions for ambiguous hands', () => {
    // 111222333m 44m 55m — can be 3 triplets or sequences
    const ts = new TileSet();
    ts.add(tile('man', 0), 3);
    ts.add(tile('man', 1), 3);
    ts.add(tile('man', 2), 3);
    ts.add(tile('man', 3), 2);
    ts.add(tile('man', 4), 2); // one is pair, one is part of meld... actually this is 13 tiles

    // Let me use a proper 14-tile hand: 111222333m 456p 99s
    const ts2 = new TileSet();
    ts2.add(tile('man', 0), 3);
    ts2.add(tile('man', 1), 3);
    ts2.add(tile('man', 2), 3);
    ts2.add(tile('pin', 3)); ts2.add(tile('pin', 4)); ts2.add(tile('pin', 5));
    ts2.add(tile('sou', 8), 2);

    const decomps = decomposeHand(ts2);
    // 111m+222m+333m (triplets) or 123m+123m+123m (sequences)
    expect(decomps.length).toBeGreaterThanOrEqual(2);
  });

  it('returns empty for non-winning hand', () => {
    const ts = new TileSet();
    ts.add(tile('man', 0), 2);
    ts.add(tile('man', 2), 2);
    ts.add(tile('man', 4), 2);
    ts.add(tile('man', 6), 2);
    ts.add(tile('pin', 0), 2);
    ts.add(tile('pin', 2), 2);
    ts.add(tile('pin', 4), 2);

    const decomps = decomposeHand(ts);
    // These are 7 pairs — decomposeHand doesn't handle seven pairs (that's a special hand)
    // But standard decomposition should fail
    // Actually 7 pairs of non-consecutive tiles won't form standard melds
    expect(decomps).toHaveLength(0);
  });

  it('handles locked melds', () => {
    // Hand: 123m + 99s, locked: 456p (chi), 777s (peng)
    const hand = new TileSet();
    hand.add(tile('man', 0)); hand.add(tile('man', 1)); hand.add(tile('man', 2));
    hand.add(tile('sou', 8), 2);

    const locked = [
      { type: 'sequence' as const, start: tile('pin', 3), isOpen: true },
      { type: 'triplet' as const, start: tile('sou', 6), isOpen: true },
    ];

    const decomps = decomposeHand(hand, locked);
    expect(decomps.length).toBeGreaterThan(0);
    // Each decomposition should include the 2 locked melds + 1 hand meld
    expect(decomps[0].melds).toHaveLength(3);
  });
});

describe('isWinningHand', () => {
  it('detects standard winning hand', () => {
    const ts = new TileSet();
    ts.add(tile('man', 0)); ts.add(tile('man', 1)); ts.add(tile('man', 2));
    ts.add(tile('man', 3)); ts.add(tile('man', 4)); ts.add(tile('man', 5));
    ts.add(tile('man', 6)); ts.add(tile('man', 7)); ts.add(tile('man', 8));
    ts.add(tile('pin', 0), 3);
    ts.add(tile('sou', 8), 2);
    expect(isWinningHand(ts)).toBe(true);
  });

  it('detects seven pairs', () => {
    const ts = new TileSet();
    for (let i = 0; i < 7; i++) ts.add(tile('man', i), 2);
    expect(isWinningHand(ts)).toBe(true);
  });

  it('rejects non-winning hand', () => {
    const ts = new TileSet();
    ts.add(tile('man', 0), 1);
    ts.add(tile('man', 2), 1);
    ts.add(tile('man', 4), 1);
    ts.add(tile('man', 6), 1);
    ts.add(tile('pin', 0), 1);
    ts.add(tile('pin', 2), 1);
    ts.add(tile('pin', 4), 1);
    ts.add(tile('pin', 6), 1);
    ts.add(tile('sou', 0), 1);
    ts.add(tile('sou', 2), 1);
    ts.add(tile('sou', 4), 1);
    ts.add(tile('sou', 6), 1);
    ts.add(Tiles.East, 1);
    ts.add(Tiles.South, 1);
    expect(isWinningHand(ts)).toBe(false);
  });
});
