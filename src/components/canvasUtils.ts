/**
 * Shared 2D Canvas drawing helpers used by drawSessionCard and
 * drawAggregateCard. All operate on a CanvasRenderingContext2D-compatible ctx.
 */

export const SHARE_CARD_WIDTH = 480;
export const SHARE_CARD_PAD = 24;

export const COLORS = {
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

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function roundedRectPath(ctx: any, x: number, y: number, w: number, h: number, r: number): void {
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

export function niceUp(v: number): number {
  if (v <= 1) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const m = v / mag;
  const r = m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10;
  return r * mag;
}

/** Truncate text with an ellipsis if it would exceed maxWidth in the
 *  current ctx font. */
export function fitText(ctx: any, text: string, maxWidth: number): string {
  if (!text) return '';
  if (typeof ctx.measureText !== 'function') return text;
  if (ctx.measureText(text).width <= maxWidth) return text;
  let cut = text;
  while (cut.length > 0 && ctx.measureText(cut + '…').width > maxWidth) {
    cut = cut.slice(0, -1);
  }
  return cut + '…';
}

export function fillBackgroundGradient(ctx: any, w: number, h: number): void {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, COLORS.bgTop);
  grad.addColorStop(1, COLORS.bgBottom);
  ctx.fillStyle = grad;
  roundedRectPath(ctx, 0, 0, w, h, 16);
  ctx.fill();
}

export function drawDivider(ctx: any, x1: number, x2: number, y: number): void {
  ctx.strokeStyle = COLORS.divider;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
}

export function drawFooter(ctx: any, w: number, y: number, text = '国标麻将算番器'): void {
  ctx.fillStyle = COLORS.muted;
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(text, w / 2, y + 8);
}
