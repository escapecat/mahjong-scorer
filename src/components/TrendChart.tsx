import { View, Text } from '@tarojs/components';
import { SEAT_LABELS } from '../engine/scoring';
import type { RunningPoint } from '../pages/session/aggregation';
import styles from './TrendChart.module.css';

interface Props {
  points: readonly RunningPoint[];
  /** Player display names matching seats 0-3 (defaults to 东南西北). */
  players?: readonly [string, string, string, string];
}

const SEAT_COLORS = ['#2563eb', '#16a34a', '#ea580c', '#9333ea'] as const;

const W = 320;          // viewport-ish width; SVG scales via preserveAspectRatio
const H = 180;
const PAD_L = 36;
const PAD_R = 8;
const PAD_T = 12;
const PAD_B = 24;

export function TrendChart({ points, players }: Props) {
  if (points.length < 2) {
    return (
      <View className={styles.empty}>
        <Text>记录至少 1 把后才有走势图</Text>
      </View>
    );
  }

  // Find y-axis domain — symmetric around 0 for readability.
  let yMax = 1;
  for (const p of points) for (const v of p.totals) yMax = Math.max(yMax, Math.abs(v));
  // Round up to a nice number
  const niceUp = (v: number) => {
    const mag = Math.pow(10, Math.floor(Math.log10(v)));
    const m = v / mag;
    const r = m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10;
    return r * mag;
  };
  yMax = niceUp(yMax);
  const yMin = -yMax;

  const xScale = (i: number) => PAD_L + (i / (points.length - 1)) * (W - PAD_L - PAD_R);
  const yScale = (v: number) => PAD_T + ((yMax - v) / (yMax - yMin)) * (H - PAD_T - PAD_B);

  const seatPaths = [0, 1, 2, 3].map((seat) => {
    const d = points
      .map((p, i) => {
        const x = xScale(i).toFixed(1);
        const y = yScale(p.totals[seat]).toFixed(1);
        return `${i === 0 ? 'M' : 'L'}${x},${y}`;
      })
      .join(' ');
    return d;
  });

  // Y-axis ticks at 0, ±yMax/2, ±yMax
  const yTicks = [yMax, yMax / 2, 0, -yMax / 2, yMin].map((v) => Math.round(v));
  const seatNames = players ?? SEAT_LABELS;

  return (
    <View className={styles.wrapper}>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio='xMidYMid meet'
        xmlns='http://www.w3.org/2000/svg'
      >
        {/* gridlines + y-axis labels */}
        {yTicks.map((v) => {
          const y = yScale(v);
          return (
            <g key={v}>
              <line
                x1={PAD_L}
                x2={W - PAD_R}
                y1={y}
                y2={y}
                stroke={v === 0 ? '#94a3b8' : '#e2e8f0'}
                strokeWidth={v === 0 ? 1 : 0.5}
                strokeDasharray={v === 0 ? '' : '2 2'}
              />
              <text x={PAD_L - 4} y={y + 3} textAnchor='end' fontSize='9' fill='#64748b'>
                {v >= 0 ? `+${v}` : v}
              </text>
            </g>
          );
        })}

        {/* x-axis labels: round counts, sparse */}
        {points.map((p, i) => {
          if (i === 0) return null;
          const tickEvery = Math.max(1, Math.ceil((points.length - 1) / 6));
          if (i !== points.length - 1 && i % tickEvery !== 0) return null;
          return (
            <text
              key={i}
              x={xScale(i)}
              y={H - 8}
              textAnchor='middle'
              fontSize='9'
              fill='#94a3b8'
            >
              #{p.roundIndex}
            </text>
          );
        })}

        {/* seat lines */}
        {seatPaths.map((d, seat) => (
          <path
            key={seat}
            d={d}
            stroke={SEAT_COLORS[seat]}
            strokeWidth={1.5}
            fill='none'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        ))}

        {/* end-of-line dots */}
        {[0, 1, 2, 3].map((seat) => {
          const last = points[points.length - 1];
          return (
            <circle
              key={seat}
              cx={xScale(points.length - 1)}
              cy={yScale(last.totals[seat])}
              r={2.5}
              fill={SEAT_COLORS[seat]}
            />
          );
        })}
      </svg>

      <View className={styles.legend}>
        {[0, 1, 2, 3].map((seat) => (
          <View key={seat} className={styles.legendItem}>
            <View className={styles.legendDot} style={{ backgroundColor: SEAT_COLORS[seat] }} />
            <Text className={styles.legendText}>
              {seatNames[seat]} {points[points.length - 1].totals[seat] >= 0 ? '+' : ''}
              {points[points.length - 1].totals[seat]}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
