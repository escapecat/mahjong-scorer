import { computeRoundDeltas, sumRoundDeltas, SEAT_LABELS } from '../../engine/scoring';
import type { Session } from './sessionStorage';

export type TimeRange = 'today' | 'week' | 'month' | 'all';

/** Returns the inclusive lower bound timestamp for the given range. 'all' → 0. */
export function rangeStart(range: TimeRange, now = Date.now()): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  if (range === 'today') return d.getTime();
  if (range === 'week') {
    // Monday-start week. JS Sunday=0 ... Saturday=6.
    const day = d.getDay() === 0 ? 7 : d.getDay();
    d.setDate(d.getDate() - (day - 1));
    return d.getTime();
  }
  if (range === 'month') {
    d.setDate(1);
    return d.getTime();
  }
  return 0;
}

export interface PlayerAggregate {
  name: string;
  total: number;
  sessionCount: number;
  roundCount: number;
}

/**
 * Aggregate session results by player name. Names are matched case-sensitively
 * by exact string equality (so "张三" and "张三 " are different — by design,
 * a typo'd name shouldn't quietly merge). Sessions outside the time range are
 * skipped.
 */
export function aggregateByPlayer(sessions: readonly Session[], range: TimeRange = 'all'): PlayerAggregate[] {
  const cutoff = rangeStart(range);
  const map = new Map<string, PlayerAggregate>();

  for (const s of sessions) {
    if (s.startTime < cutoff) continue;
    const totals = sumRoundDeltas(s.rounds);
    for (let seat = 0; seat < 4; seat++) {
      const name = s.players[seat] || SEAT_LABELS[seat];
      const cur = map.get(name) ?? { name, total: 0, sessionCount: 0, roundCount: 0 };
      cur.total += totals[seat];
      cur.sessionCount += 1;
      cur.roundCount += s.rounds.length;
      map.set(name, cur);
    }
  }

  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

// ── Per-round running totals (for trend chart) ──

export interface RunningPoint {
  /** 0 = pre-game, 1 = after round 1, etc. */
  roundIndex: number;
  /** Cumulative seat totals after this many rounds. */
  totals: readonly [number, number, number, number];
}

export function buildRunningTotals(session: Session): RunningPoint[] {
  const points: RunningPoint[] = [{ roundIndex: 0, totals: [0, 0, 0, 0] }];
  const running: number[] = [0, 0, 0, 0];
  session.rounds.forEach((r, i) => {
    const d = computeRoundDeltas(r);
    for (let s = 0; s < 4; s++) running[s] += d[s];
    points.push({ roundIndex: i + 1, totals: [running[0], running[1], running[2], running[3]] });
  });
  return points;
}
