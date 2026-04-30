import { describe, it, expect } from 'vitest';
import { aggregateByPlayer, sessionsToCSV, buildRunningTotals, rangeStart } from '../../pages/session/aggregation';
import type { Session } from '../../pages/session/sessionStorage';
import type { Round } from '../scoring';

function mkSession(over: Partial<Session>): Session {
  return {
    id: 's',
    startTime: Date.now(),
    players: ['张三', '李四', '王五', '赵六'],
    rounds: [],
    baseScore: 8,
    ...over,
  };
}

function mkRound(over: Partial<Round>): Round {
  return { id: 'r', timestamp: 0, type: 'draw', baseScore: 8, ...over };
}

describe('aggregateByPlayer', () => {
  it('sums across sessions with same names', () => {
    const s1 = mkSession({
      players: ['张三', '李四', '王五', '赵六'],
      rounds: [mkRound({ type: 'selfDraw', winnerSeat: 0, fan: 8, baseScore: 8 })],
    });
    const s2 = mkSession({
      id: 's2',
      players: ['张三', '李四', '王五', '赵六'],
      rounds: [mkRound({ type: 'selfDraw', winnerSeat: 0, fan: 8, baseScore: 8 })],
    });
    const agg = aggregateByPlayer([s1, s2]);
    const zhangsan = agg.find((p) => p.name === '张三');
    expect(zhangsan?.total).toBe(96); // 48 + 48
    expect(zhangsan?.sessionCount).toBe(2);
    expect(zhangsan?.roundCount).toBe(2);
  });

  it('does not merge differently-named seats', () => {
    const s1 = mkSession({ players: ['张三', '李四', '王五', '赵六'] });
    const s2 = mkSession({ id: 's2', players: ['张三 ', '李四', '王五', '赵六'] }); // trailing space
    const agg = aggregateByPlayer([s1, s2]);
    const names = new Set(agg.map((p) => p.name));
    expect(names.has('张三')).toBe(true);
    expect(names.has('张三 ')).toBe(true);
  });

  it('respects time range', () => {
    const oldSession = mkSession({ id: 'old', startTime: 0 });
    const newSession = mkSession({ id: 'new', startTime: Date.now() });
    expect(aggregateByPlayer([oldSession, newSession], 'today').length).toBe(4);
    expect(aggregateByPlayer([oldSession, newSession], 'all').length).toBe(4);
    // 'today' aggregate sessionCount per player should be 1, not 2
    const todayAgg = aggregateByPlayer([oldSession, newSession], 'today');
    expect(todayAgg[0].sessionCount).toBe(1);
  });

  it('sorted by total desc', () => {
    const s = mkSession({
      players: ['A', 'B', 'C', 'D'],
      rounds: [mkRound({ type: 'selfDraw', winnerSeat: 0, fan: 8, baseScore: 8 })],
    });
    const agg = aggregateByPlayer([s]);
    expect(agg[0].name).toBe('A');
    expect(agg[0].total).toBe(48);
    expect(agg[1].total).toBe(-16);
  });
});

describe('sessionsToCSV', () => {
  it('emits header + one row per round', () => {
    const s = mkSession({
      rounds: [
        mkRound({ id: 'r1', type: 'selfDraw', winnerSeat: 0, fan: 8, baseScore: 8 }),
        mkRound({ id: 'r2', type: 'discard', winnerSeat: 1, discarderSeat: 3, fan: 12, baseScore: 8 }),
      ],
    });
    const csv = sessionsToCSV([s]);
    const lines = csv.split('\n');
    expect(lines.length).toBe(3); // header + 2 rounds
    expect(lines[0]).toContain('局号');
    expect(lines[0]).toContain('番数');
    expect(lines[1]).toContain('自摸');
    expect(lines[2]).toContain('点炮');
  });

  it('quotes cells with commas', () => {
    const s = mkSession({ players: ['a,b', 'c', 'd', 'e'], rounds: [mkRound({ type: 'draw' })] });
    const csv = sessionsToCSV([s]);
    expect(csv).toContain('"a,b"');
  });

  it('preserves empty sessions', () => {
    const csv = sessionsToCSV([mkSession({})]);
    const lines = csv.split('\n');
    expect(lines.length).toBe(2); // header + 1 empty-session row
  });
});

describe('buildRunningTotals', () => {
  it('starts at zero and walks per round', () => {
    const s = mkSession({
      rounds: [
        mkRound({ type: 'selfDraw', winnerSeat: 0, fan: 8, baseScore: 8 }),
        mkRound({ type: 'discard', winnerSeat: 0, discarderSeat: 1, fan: 8, baseScore: 8 }),
      ],
    });
    const pts = buildRunningTotals(s);
    expect(pts.length).toBe(3); // 0, after-1, after-2
    expect(pts[0].totals).toEqual([0, 0, 0, 0]);
    expect(pts[1].totals).toEqual([48, -16, -16, -16]);
    expect(pts[2].totals).toEqual([80, -32, -24, -24]);
  });

  it('empty session returns just the zero point', () => {
    expect(buildRunningTotals(mkSession({}))).toEqual([{ roundIndex: 0, totals: [0, 0, 0, 0] }]);
  });
});

describe('rangeStart', () => {
  it('today starts at midnight', () => {
    const ts = rangeStart('today', new Date('2026-05-01T15:30:00').getTime());
    expect(new Date(ts).getHours()).toBe(0);
  });
  it('all returns 0', () => {
    expect(rangeStart('all')).toBe(0);
  });
});
