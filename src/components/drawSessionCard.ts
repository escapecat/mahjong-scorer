import { sumRoundDeltas, SEAT_LABELS, type ScoreDelta } from '../engine/scoring';
import { buildRunningTotals, type RunningPoint } from '../pages/session/aggregation';
import type { Session } from '../pages/session/sessionStorage';
import {
  SHARE_CARD_WIDTH as W,
  SHARE_CARD_PAD as PAD,
  COLORS,
  formatTime,
  roundedRectPath,
  niceUp,
  fitText,
  fillBackgroundGradient,
  drawDivider,
  drawFooter,
} from './canvasUtils';

const RANK_MEDAL = ['1st', '2nd', '3rd', '4th'];

function drawTrendChart(
  ctx: any,
  points: readonly RunningPoint[],
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  if (points.length < 2) return;

  roundedRectPath(ctx, x, y, w, h, 12);
  ctx.fillStyle = COLORS.chartCard;
  ctx.fill();

  const padL = 32;
  const padR = 10;
  const padT = 12;
  const padB = 22;

  let yMax = 1;
  for (const p of points) for (const v of p.totals) yMax = Math.max(yMax, Math.abs(v));
  yMax = niceUp(yMax);
  const yMin = -yMax;

  const xs = (i: number) => x + padL + (i / (points.length - 1)) * (w - padL - padR);
  const ys = (v: number) => y + padT + ((yMax - v) / (yMax - yMin)) * (h - padT - padB);

  const yTicks = [yMax, yMax / 2, 0, -yMax / 2, yMin].map((v) => Math.round(v));
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (const v of yTicks) {
    const ty = ys(v);
    ctx.lineWidth = v === 0 ? 1 : 0.5;
    ctx.strokeStyle = v === 0 ? COLORS.axisZero : COLORS.axisGrid;
    ctx.beginPath();
    ctx.moveTo(x + padL, ty);
    ctx.lineTo(x + w - padR, ty);
    ctx.stroke();
    ctx.fillStyle = COLORS.subText;
    ctx.fillText(v >= 0 ? `+${v}` : String(v), x + padL - 4, ty);
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = COLORS.muted;
  const tickEvery = Math.max(1, Math.ceil((points.length - 1) / 6));
  for (let i = 1; i < points.length; i++) {
    if (i !== points.length - 1 && i % tickEvery !== 0) continue;
    ctx.fillText(`#${points[i].roundIndex}`, xs(i), y + h - 14);
  }

  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let seat = 0; seat < 4; seat++) {
    ctx.strokeStyle = COLORS.seatLines[seat];
    ctx.beginPath();
    points.forEach((p, i) => {
      const px = xs(i);
      const py = ys(p.totals[seat]);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
  }

  for (let seat = 0; seat < 4; seat++) {
    const last = points[points.length - 1];
    ctx.fillStyle = COLORS.seatLines[seat];
    ctx.beginPath();
    ctx.arc(xs(points.length - 1), ys(last.totals[seat]), 2.8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.lineCap = 'butt';
  ctx.lineJoin = 'miter';
}

function drawTrendLegend(
  ctx: any,
  session: Session,
  totals: ScoreDelta,
  x: number,
  y: number,
  w: number,
): void {
  const cellW = w / 4;
  ctx.font = 'bold 13px sans-serif';
  ctx.textBaseline = 'middle';
  for (let seat = 0; seat < 4; seat++) {
    const cellX = x + cellW * seat;
    const cy = y + 12;

    ctx.fillStyle = COLORS.seatLines[seat];
    ctx.beginPath();
    ctx.arc(cellX + 8, cy, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = COLORS.text;
    ctx.textAlign = 'left';
    const score = totals[seat];
    const scoreStr = score >= 0 ? `+${score}` : String(score);
    const fullText = `${session.players[seat]} ${scoreStr}`;
    ctx.fillText(fitText(ctx, fullText, cellW - 22), cellX + 18, cy);
  }
}

export function measureSessionCardHeight(session: Session): number {
  const hasChart = session.rounds.length >= 1;
  return 24 + 26 + 14 + 22 + (4 * 56) + (hasChart ? 208 + 24 : 0) + 28;
}

export function drawSessionCard(ctx: any, session: Session): { width: number; height: number } {
  const totals: ScoreDelta = sumRoundDeltas(session.rounds);
  const points = buildRunningTotals(session);
  const totalH = measureSessionCardHeight(session);

  fillBackgroundGradient(ctx, W, totalH);

  let y = 24;

  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('国标麻将 · 战报', PAD, y);
  y += 26;

  drawDivider(ctx, PAD, W - PAD, y);
  y += 14;

  ctx.fillStyle = COLORS.subText;
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const endTime = session.endTime ?? Date.now();
  const dateText = `${formatTime(session.startTime)} - ${formatTime(endTime)}  ·  ${session.rounds.length} 把  ·  底分 ${session.baseScore}`;
  ctx.fillText(dateText, W / 2, y);
  y += 22;

  const order = [0, 1, 2, 3].sort((a, b) => totals[b] - totals[a]);

  for (let rank = 0; rank < 4; rank++) {
    const seat = order[rank];
    const isLeader = rank === 0;
    const rowH = 50;

    roundedRectPath(ctx, PAD, y, W - 2 * PAD, rowH, 12);
    ctx.fillStyle = isLeader ? COLORS.cardLeader : COLORS.cardBg;
    ctx.fill();
    if (isLeader) {
      ctx.strokeStyle = COLORS.cardLeaderBorder;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    const cy = y + rowH / 2;

    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(RANK_MEDAL[rank], PAD + 14, cy);

    ctx.fillStyle = COLORS.subText;
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(SEAT_LABELS[seat], PAD + 56, cy);

    const score = totals[seat];
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 18px sans-serif';
    const nameMaxWidth = W - 2 * PAD - 80 - 84;
    ctx.fillText(fitText(ctx, session.players[seat], nameMaxWidth), PAD + 80, cy);

    ctx.fillStyle = score > 0 ? COLORS.pos : score < 0 ? COLORS.neg : COLORS.zero;
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(score >= 0 ? `+${score}` : String(score), W - PAD - 14, cy);

    y += rowH + 6;
  }

  y += 2;
  if (points.length >= 2) {
    drawTrendChart(ctx, points, PAD, y, W - 2 * PAD, 200);
    y += 208;
    drawTrendLegend(ctx, session, totals, PAD, y, W - 2 * PAD);
    y += 24;
  }

  drawFooter(ctx, W, y);

  return { width: W, height: totalH };
}

export { SHARE_CARD_WIDTH } from './canvasUtils';
