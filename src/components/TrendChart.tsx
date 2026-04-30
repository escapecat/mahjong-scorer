import { View, Text, Image } from '@tarojs/components';
import { SEAT_LABELS } from '../engine/scoring';
import type { RunningPoint } from '../pages/session/aggregation';
import styles from './TrendChart.module.css';

interface Props {
  points: readonly RunningPoint[];
  /** Player display names matching seats 0-3 (defaults to 东南西北). */
  players?: readonly [string, string, string, string];
}

const SEAT_COLORS = ['#2563eb', '#16a34a', '#ea580c', '#9333ea'] as const;

const W = 320;
const H = 180;
const PAD_L = 36;
const PAD_R = 8;
const PAD_T = 12;
const PAD_B = 24;

function niceUp(v: number): number {
  if (v <= 1) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const m = v / mag;
  const r = m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10;
  return r * mag;
}

/** Build the chart as an SVG string + return a data URI for <Image>.
 *  This works in both H5 and weapp — Taro's <svg> JSX doesn't render in
 *  weapp (only View/Text/Image are supported), so we encode the whole SVG
 *  as a data URI image instead. */
function buildSvgDataUri(points: readonly RunningPoint[]): string {
  let yMax = 1;
  for (const p of points) for (const v of p.totals) yMax = Math.max(yMax, Math.abs(v));
  yMax = niceUp(yMax);
  const yMin = -yMax;

  const xScale = (i: number) => PAD_L + (i / (points.length - 1)) * (W - PAD_L - PAD_R);
  const yScale = (v: number) => PAD_T + ((yMax - v) / (yMax - yMin)) * (H - PAD_T - PAD_B);

  const yTicks = [yMax, yMax / 2, 0, -yMax / 2, yMin].map((v) => Math.round(v));

  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">`);

  // gridlines + y-axis labels
  for (const v of yTicks) {
    const y = yScale(v).toFixed(1);
    const isZero = v === 0;
    parts.push(
      `<line x1="${PAD_L}" x2="${W - PAD_R}" y1="${y}" y2="${y}" stroke="${isZero ? '#94a3b8' : '#e2e8f0'}" stroke-width="${isZero ? 1 : 0.5}"${isZero ? '' : ' stroke-dasharray="2 2"'} />`
    );
    parts.push(
      `<text x="${PAD_L - 4}" y="${(yScale(v) + 3).toFixed(1)}" text-anchor="end" font-size="9" fill="#64748b">${v >= 0 ? '+' + v : v}</text>`
    );
  }

  // x-axis labels (sparse)
  const tickEvery = Math.max(1, Math.ceil((points.length - 1) / 6));
  for (let i = 1; i < points.length; i++) {
    if (i !== points.length - 1 && i % tickEvery !== 0) continue;
    const x = xScale(i).toFixed(1);
    parts.push(
      `<text x="${x}" y="${H - 8}" text-anchor="middle" font-size="9" fill="#94a3b8">#${points[i].roundIndex}</text>`
    );
  }

  // seat polylines
  for (let seat = 0; seat < 4; seat++) {
    const d = points
      .map((p, i) => {
        const x = xScale(i).toFixed(1);
        const y = yScale(p.totals[seat]).toFixed(1);
        return `${i === 0 ? 'M' : 'L'}${x},${y}`;
      })
      .join(' ');
    parts.push(
      `<path d="${d}" stroke="${SEAT_COLORS[seat]}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />`
    );
  }

  // end-of-line dots
  for (let seat = 0; seat < 4; seat++) {
    const last = points[points.length - 1];
    const x = xScale(points.length - 1).toFixed(1);
    const y = yScale(last.totals[seat]).toFixed(1);
    parts.push(`<circle cx="${x}" cy="${y}" r="2.5" fill="${SEAT_COLORS[seat]}" />`);
  }

  parts.push('</svg>');
  const svgStr = parts.join('');
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgStr)}`;
}

export function TrendChart({ points, players }: Props) {
  if (points.length < 2) {
    return (
      <View className={styles.empty}>
        <Text>记录至少 1 把后才有走势图</Text>
      </View>
    );
  }

  const dataUri = buildSvgDataUri(points);
  const seatNames = players ?? SEAT_LABELS;
  const last = points[points.length - 1];

  return (
    <View className={styles.wrapper}>
      <Image className={styles.svg} src={dataUri} mode='widthFix' />

      <View className={styles.legend}>
        {[0, 1, 2, 3].map((seat) => (
          <View key={seat} className={styles.legendItem}>
            <View className={styles.legendDot} style={{ backgroundColor: SEAT_COLORS[seat] }} />
            <Text className={styles.legendText}>
              {seatNames[seat]} {last.totals[seat] >= 0 ? '+' : ''}
              {last.totals[seat]}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
