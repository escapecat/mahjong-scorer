import { describe, it, expect } from 'vitest';
import { quickEvaluate } from './helpers';

describe('multi-instance fans', () => {
  it('双同刻 fires twice when two ranks each have 2 same-rank triplets', () => {
    // 222m + 222p + 333m + 333p + 99s = 4 triplets + pair (kong'd to break 七对/四暗刻 not relevant since these are open)
    // Two separate rank-pairings: rank 1 (m+p) and rank 2 (m+p).
    const r = quickEvaluate({
      hand: '222333m222333p99s',
      winningTile: '9s',
    });
    const shuangTongKe = r.fans.filter((f) => f.name === '双同刻');
    expect(shuangTongKe.length).toBe(2);
  });

  it('喜相逢 fires twice when two different ranks each appear in two suits', () => {
    // 123m + 123p + 456m + 456s + 99p = 4 sequences + pair
    // rank 0 (123) appears in m+p; rank 3 (456) appears in m+s.
    const r = quickEvaluate({
      hand: '123m123p456m456s99p',
      winningTile: '9p',
    });
    const xiXiangFeng = r.fans.filter((f) => f.name === '喜相逢');
    expect(xiXiangFeng.length).toBe(2);
  });
});
