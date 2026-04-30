import { describe, it, expect } from 'vitest';
import { computeRoundDeltas, sumRoundDeltas, type Round } from '../scoring';

function mkRound(over: Partial<Round>): Round {
  return { id: 'x', timestamp: 0, type: 'draw', ...over };
}

describe('computeRoundDeltas', () => {
  it('self-draw at minimum 8 fan: winner +48, each loser -16', () => {
    const r = mkRound({ type: 'selfDraw', winnerSeat: 0, fan: 8 });
    expect(computeRoundDeltas(r)).toEqual([48, -16, -16, -16]);
  });

  it('self-draw at 24 fan: winner +96, each loser -32', () => {
    const r = mkRound({ type: 'selfDraw', winnerSeat: 2, fan: 24 });
    expect(computeRoundDeltas(r)).toEqual([-32, -32, 96, -32]);
  });

  it('discard at 8 fan: winner +32, discarder -16, others -8', () => {
    const r = mkRound({ type: 'discard', winnerSeat: 0, discarderSeat: 2, fan: 8 });
    expect(computeRoundDeltas(r)).toEqual([32, -8, -16, -8]);
  });

  it('discard at 16 fan: winner +40, discarder -24, others -8', () => {
    const r = mkRound({ type: 'discard', winnerSeat: 1, discarderSeat: 3, fan: 16 });
    expect(computeRoundDeltas(r)).toEqual([-8, 40, -8, -24]);
  });

  it('draw (黄庄) yields zero deltas', () => {
    expect(computeRoundDeltas(mkRound({ type: 'draw' }))).toEqual([0, 0, 0, 0]);
  });

  it('all rounds sum to zero (no money created/destroyed)', () => {
    const rounds: Round[] = [
      mkRound({ type: 'selfDraw', winnerSeat: 0, fan: 12 }),
      mkRound({ type: 'discard', winnerSeat: 1, discarderSeat: 3, fan: 88 }),
      mkRound({ type: 'discard', winnerSeat: 2, discarderSeat: 0, fan: 8 }),
      mkRound({ type: 'draw' }),
    ];
    for (const r of rounds) {
      const d = computeRoundDeltas(r);
      expect(d[0] + d[1] + d[2] + d[3]).toBe(0);
    }
  });

  it('rejects malformed rounds (winner == discarder, missing seat) without crashing', () => {
    expect(computeRoundDeltas(mkRound({ type: 'selfDraw' /* no winnerSeat */ }))).toEqual([0, 0, 0, 0]);
    expect(computeRoundDeltas(mkRound({ type: 'discard', winnerSeat: 0, discarderSeat: 0, fan: 8 }))).toEqual([0, 0, 0, 0]);
    expect(computeRoundDeltas(mkRound({ type: 'discard', winnerSeat: 0, fan: 8 /* no discarder */ }))).toEqual([0, 0, 0, 0]);
  });
});

describe('sumRoundDeltas', () => {
  it('aggregates deltas across rounds', () => {
    const rounds: Round[] = [
      mkRound({ type: 'selfDraw', winnerSeat: 0, fan: 8 }),  // [+48, -16, -16, -16]
      mkRound({ type: 'discard', winnerSeat: 0, discarderSeat: 1, fan: 8 }), // [+32, -16, -8, -8]
      mkRound({ type: 'draw' }), // [0,0,0,0]
    ];
    expect(sumRoundDeltas(rounds)).toEqual([80, -32, -24, -24]);
  });

  it('empty list returns zero', () => {
    expect(sumRoundDeltas([])).toEqual([0, 0, 0, 0]);
  });
});
