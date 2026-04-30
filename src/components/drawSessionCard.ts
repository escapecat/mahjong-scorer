import { sumRoundDeltas, SEAT_LABELS, type ScoreDelta } from '../engine/scoring';
import { buildRunningTotals, type RunningPoint } from '../pages/session/aggregation';
import type { Session } from '../pages/session/sessionStorage';

/**
 * Pure 2D-canvas renderer for the session battle-report card. Works against
 * any CanvasRenderingContext2D-compatible context — H5 HTMLCanvasElement, the
 * weapp Canvas component (libVersion 2.7+), or any other Canvas2D shim.
 *
 * Caller is responsible for: sizing the canvas, applying a scale (e.g. ctx.scale(2,2)
 * for HiDPI), and reading the pixel data afterwards (toBlob / canvasToTempFilePath).
 */

const W = 480;
const PAD = 24;
const COLORS = {
  bgTop: '#f7f9fc',
  bgBottom: '#e6ebf2',
  text: '#1e293b',
  subText: '#64748b',
  muted: '#94a3b8',
  divider: 'rgba(37, 99, 235, 0.15)',
  cardBg: '#ffffff',
  cardLeader: '#fef3c7',
  cardLeaderBorder: 'rgba(234, 179, 8, 0.5)',
  pos: '#16a34a',
  neg: '#ef4444',
  zero: '#94a3b8',
  chartCard: 'rgba(255, 255, 255, 0.92)',
  axisZero: '#94a3b8',
  axisGrid: '#e2e8f0',
  seatLines: ['#2563eb', '#16a34a', '#ea580c', '#9333ea'] as const,
} as const;

const RANK_MEDAL = ['1st', '2nd', '3rd', '4th'];

function pad2(n: number): string { return String(n).padStart(2, '0'); }
function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function roundedRectPath(ctx: any, x: number, y: number, w: number, h: number, r: number): void {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.arcTo(x + w, y, x + w, y + rad, rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.arcTo(x + w, y + h, x + w - rad, y + h, rad);
  ctx.lineTo(x + rad, y + h);
  ctx.arcTo(x, y + h, x, y + h - rad, rad);
  ctx.lineTo(x, y + rad);
  ctx.arcTo(x, y, x + rad, y, rad);
  ctx.closePath();
}

/** Truncate text with an ellipsis if it would exceed maxWidth in the
 *  current ctx font. Some weapp Canvas2D measureText returns 0 for empty
 *  fonts, but for normal use this is reliable. */
function fitText(ctx: any, text: string, maxWidth: number): string {
  if (!text) return '';
  if (typeof ctx.measureText !== 'function') return text;
  if (ctx.measureText(text).width <= maxWidth) return text;
  let cut = text;
  while (cut.length > 0 && ctx.measureText(cut + '…').width > maxWidth) {
    cut = cut.slice(0, -1);
  }
  return cut + '…';
}

function niceUp(v: number): number {
  if (v <= 1) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const m = v / mag;
  const r = m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10;
  return r * mag;
}

function drawTrendChart(
  ctx: any,
  points: readonly RunningPoint[],
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  if (points.length < 2) return;

  // Card bg
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

  // Gridlines + Y-axis labels
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

  // X-axis tick labels (sparse)
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = COLORS.muted;
  const tickEvery = Math.max(1, Math.ceil((points.length - 1) / 6));
  for (let i = 1; i < points.length; i++) {
    if (i !== points.length - 1 && i % tickEvery !== 0) continue;
    ctx.fillText(`#${points[i].roundIndex}`, xs(i), y + h - 14);
  }

  // Seat lines
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

  // End-of-line dots
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

/** Pre-compute the total height the card needs given session content. */
export function measureSessionCardHeight(session: Session): number {
  const hasChart = session.rounds.length >= 1;
  // top pad 24 + header 26 + divider 14 + date 22 + 4 rows × 56 + chart 208 + legend 24 + footer 28
  return 24 + 26 + 14 + 22 + (4 * 56) + (hasChart ? 208 + 24 : 0) + 28;
}

function drawTrendLegend(
  ctx: any,
  session: Session,
  totals: ScoreDelta,
  x: number,
  y: number,
  w: number,
): void {
  // 4 cells in a single row, each with a colored dot + name + delta
  const cellW = w / 4;
  ctx.font = 'bold 13px sans-serif';
  ctx.textBaseline = 'middle';
  for (let seat = 0; seat < 4; seat++) {
    const cellX = x + cellW * seat;
    const cy = y + 12;

    // colored dot
    ctx.fillStyle = COLORS.seatLines[seat];
    ctx.beginPath();
    ctx.arc(cellX + 8, cy, 4, 0, Math.PI * 2);
    ctx.fill();

    // name + delta in same row, clipped to cell width
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = 'left';
    const score = totals[seat];
    const scoreStr = score >= 0 ? `+${score}` : String(score);
    const fullText = `${session.players[seat]} ${scoreStr}`;
    ctx.fillText(fitText(ctx, fullText, cellW - 22), cellX + 18, cy);
  }
}

export function drawSessionCard(ctx: any, session: Session): { width: number; height: number } {
  const totals: ScoreDelta = sumRoundDeltas(session.rounds);
  const points = buildRunningTotals(session);
  const totalH = measureSessionCardHeight(session);

  // Fill background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, totalH);
  grad.addColorStop(0, COLORS.bgTop);
  grad.addColorStop(1, COLORS.bgBottom);
  ctx.fillStyle = grad;
  roundedRectPath(ctx, 0, 0, W, totalH, 16);
  ctx.fill();

  let y = 24;

  // Header
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('国标麻将 · 战报', PAD, y);
  y += 26;

  // Divider line
  ctx.strokeStyle = COLORS.divider;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PAD, y);
  ctx.lineTo(W - PAD, y);
  ctx.stroke();
  y += 14;

  // Date row centered
  ctx.fillStyle = COLORS.subText;
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const endTime = session.endTime ?? Date.now();
  const dateText = `${formatTime(session.startTime)} - ${formatTime(endTime)}  ·  ${session.rounds.length} 把  ·  底分 ${session.baseScore}`;
  ctx.fillText(dateText, W / 2, y);
  y += 22;

  // Scoreboard
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

    // Rank text (left)
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(RANK_MEDAL[rank], PAD + 14, cy);

    // Seat label
    ctx.fillStyle = COLORS.subText;
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(SEAT_LABELS[seat], PAD + 56, cy);

    // Player name (clipped if too long for the available space)
    const score = totals[seat];
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 18px sans-serif';
    // Reserve ~84px on the right for the score, ~80px on the left for medal/seat
    const nameMaxWidth = W - 2 * PAD - 80 - 84;
    ctx.fillText(fitText(ctx, session.players[seat], nameMaxWidth), PAD + 80, cy);

    // Score (right)
    ctx.fillStyle = score > 0 ? COLORS.pos : score < 0 ? COLORS.neg : COLORS.zero;
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(score >= 0 ? `+${score}` : String(score), W - PAD - 14, cy);

    y += rowH + 6;
  }

  // Trend chart + legend
  y += 2;
  if (points.length >= 2) {
    drawTrendChart(ctx, points, PAD, y, W - 2 * PAD, 200);
    y += 208;
    drawTrendLegend(ctx, session, totals, PAD, y, W - 2 * PAD);
    y += 24;
  }

  // Footer
  ctx.fillStyle = COLORS.muted;
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('国标麻将算番器', W / 2, y + 8);

  return { width: W, height: totalH };
}

export const SHARE_CARD_WIDTH = W;
