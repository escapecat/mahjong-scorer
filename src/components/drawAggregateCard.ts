import type { PlayerAggregate, TimeRange } from '../pages/session/aggregation';
import {
  SHARE_CARD_WIDTH as W,
  SHARE_CARD_PAD as PAD,
  COLORS,
  roundedRectPath,
  fitText,
  fillBackgroundGradient,
  drawDivider,
  drawFooter,
} from './canvasUtils';

const RANGE_LABELS: Record<TimeRange, string> = {
  today: '今天',
  week: '本周',
  month: '本月',
  all: '全部',
};

function formatDateOnly(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

const ROW_H = 56;

export function measureAggregateCardHeight(players: readonly PlayerAggregate[]): number {
  // top pad 24 + header 26 + divider 14 + range 22 + N rows × 60 (with gap) + footer 32
  return 24 + 26 + 14 + 22 + (players.length * (ROW_H + 6)) + 32;
}

export function drawAggregateCard(
  ctx: any,
  players: readonly PlayerAggregate[],
  range: TimeRange,
): { width: number; height: number } {
  const totalH = measureAggregateCardHeight(players);

  fillBackgroundGradient(ctx, W, totalH);

  let y = 24;

  // Header
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`国标麻将 · 玩家累计`, PAD, y);
  y += 26;

  drawDivider(ctx, PAD, W - PAD, y);
  y += 14;

  // Subtitle: time range + 局/把 totals
  const totalSessions = players.reduce((s, p) => s + p.sessionCount, 0);
  const totalRounds = players.reduce((s, p) => s + p.roundCount, 0);
  // sessionCount is summed across players → per-player count, not unique session count.
  // Each session contributes to 4 player rows, so divide by 4 for the actual session total.
  const uniqueSessions = Math.round(totalSessions / 4);
  const uniqueRounds = Math.round(totalRounds / 4);

  ctx.fillStyle = COLORS.subText;
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const subtitle = `${RANGE_LABELS[range]}  ·  ${uniqueSessions} 局  ·  ${uniqueRounds} 把  ·  ${formatDateOnly(Date.now())}`;
  ctx.fillText(subtitle, W / 2, y);
  y += 22;

  // Player rows
  for (let rank = 0; rank < players.length; rank++) {
    const p = players[rank];
    const isLeader = rank === 0;

    roundedRectPath(ctx, PAD, y, W - 2 * PAD, ROW_H, 12);
    ctx.fillStyle = isLeader ? COLORS.cardLeader : COLORS.cardBg;
    ctx.fill();
    if (isLeader) {
      ctx.strokeStyle = COLORS.cardLeaderBorder;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    const cy = y + ROW_H / 2;

    // Rank
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${rank + 1}.`, PAD + 14, cy);

    // Name (clipped)
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 18px sans-serif';
    const nameMaxWidth = W - 2 * PAD - 50 - 120; // reserve right side for score+meta
    ctx.fillText(fitText(ctx, p.name, nameMaxWidth), PAD + 50, cy - 6);

    // Sub-meta below name
    ctx.fillStyle = COLORS.muted;
    ctx.font = '11px sans-serif';
    ctx.fillText(`${p.sessionCount} 局 / ${p.roundCount} 把`, PAD + 50, cy + 13);

    // Score (right, larger, vertically centered)
    ctx.fillStyle = p.total > 0 ? COLORS.pos : p.total < 0 ? COLORS.neg : COLORS.zero;
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(p.total >= 0 ? `+${p.total}` : String(p.total), W - PAD - 14, cy);

    y += ROW_H + 6;
  }

  drawFooter(ctx, W, y);

  return { width: W, height: totalH };
}
