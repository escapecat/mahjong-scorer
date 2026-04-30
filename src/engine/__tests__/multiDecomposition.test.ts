import { describe, it, expect } from 'vitest';
import { quickEvaluate } from './helpers';

describe('multiple decompositions', () => {
  it('111222333m + 456m + 99p has more than one valid decomposition', () => {
    // 111m+222m+333m  → 三节高 / 三连刻 family
    // 123m+123m+123m  → 三同顺 / 一般高 family
    const r = quickEvaluate({ hand: '111222333456m99p', winningTile: '9p' });
    expect(r.allCandidates).toBeDefined();
    expect(r.allCandidates!.length).toBeGreaterThan(1);
    // Primary is the highest-scoring one
    const sorted = [...r.allCandidates!].map((c) => c.totalFan);
    expect(sorted).toEqual([...sorted].sort((a, b) => b - a));
    expect(r.totalFan).toBe(sorted[0]);
  });

  it('hand with single decomposition still returns allCandidates of length >= 1', () => {
    // 4 distinct sequences across 3 suits + a pair → minimal decomposition variety
    const r = quickEvaluate({ hand: '123m234m456p789s11p', winningTile: '1p' });
    expect(r.allCandidates).toBeDefined();
    expect(r.allCandidates!.length).toBeGreaterThanOrEqual(1);
  });

  it('inner candidates do not carry their own allCandidates (no recursion)', () => {
    const r = quickEvaluate({ hand: '111222333456m99p', winningTile: '9p' });
    for (const c of r.allCandidates ?? []) {
      expect(c.allCandidates).toBeUndefined();
    }
  });
});
