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

// ── CSV export ──

/** Quote a CSV cell if needed (commas, quotes, newlines). */
function csvCell(v: string | number): string {
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function isoDate(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * One row per round. Columns:
 * 局号, 时间, 第几把, 类型, 赢家, 出冲方, 番数, 底分, [4 个玩家 deltas]
 *
 * Header includes the 4 player names per session, but since sessions can have
 * different names we just label "东得分/南得分/西得分/北得分" plus a "玩家(东/南/西/北)" summary column.
 */
export function sessionsToCSV(sessions: readonly Session[]): string {
  const lines: string[] = [];
  lines.push(['局号', '时间', '第几把', '类型', '赢家', '出冲方', '番数', '底分', '东', '南', '西', '北', '东得分', '南得分', '西得分', '北得分'].map(csvCell).join(','));

  for (let si = 0; si < sessions.length; si++) {
    const s = sessions[si];
    if (s.rounds.length === 0) {
      // include empty session as a single header-only row so it's not lost
      lines.push([si + 1, isoDate(s.startTime), '', '', '', '', '', s.baseScore, ...s.players, '', '', '', ''].map(csvCell).join(','));
      continue;
    }
    s.rounds.forEach((r, idx) => {
      const d = computeRoundDeltas(r);
      const winner = r.winnerSeat != null ? `${SEAT_LABELS[r.winnerSeat]}/${s.players[r.winnerSeat]}` : '';
      const discarder = r.discarderSeat != null ? `${SEAT_LABELS[r.discarderSeat]}/${s.players[r.discarderSeat]}` : '';
      const typeLabel = r.type === 'selfDraw' ? '自摸' : r.type === 'discard' ? '点炮' : '黄庄';
      lines.push([
        si + 1,
        isoDate(r.timestamp),
        idx + 1,
        typeLabel,
        winner,
        discarder,
        r.fan ?? '',
        s.baseScore,
        s.players[0], s.players[1], s.players[2], s.players[3],
        d[0], d[1], d[2], d[3],
      ].map(csvCell).join(','));
    });
  }

  return lines.join('\n');
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
