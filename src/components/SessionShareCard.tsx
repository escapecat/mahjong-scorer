import { forwardRef } from 'react';
import { View, Text, Image } from '@tarojs/components';
import { sumRoundDeltas, SEAT_LABELS } from '../engine/scoring';
import { buildRunningTotals } from '../pages/session/aggregation';
import type { Session } from '../pages/session/sessionStorage';
import styles from './SessionShareCard.module.css';

interface Props {
  session: Session;
}

const RANK_MEDAL = ['🥇', '🥈', '🥉', '🏅'];
const SEAT_COLORS = ['#2563eb', '#16a34a', '#ea580c', '#9333ea'] as const;

function formatTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const W = 440;
const H = 200;
const PAD_L = 40;
const PAD_R = 12;
const PAD_T = 16;
const PAD_B = 28;

function niceUp(v: number): number {
  if (v <= 1) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const m = v / mag;
  const r = m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10;
  return r * mag;
}

function buildTrendUri(session: Session): string {
  const points = buildRunningTotals(session);
  if (points.length < 2) return '';

  let yMax = 1;
  for (const p of points) for (const v of p.totals) yMax = Math.max(yMax, Math.abs(v));
  yMax = niceUp(yMax);
  const yMin = -yMax;

  const xScale = (i: number) => PAD_L + (i / (points.length - 1)) * (W - PAD_L - PAD_R);
  const yScale = (v: number) => PAD_T + ((yMax - v) / (yMax - yMin)) * (H - PAD_T - PAD_B);
  const yTicks = [yMax, yMax / 2, 0, -yMax / 2, yMin].map((v) => Math.round(v));

  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">`);

  for (const v of yTicks) {
    const y = yScale(v).toFixed(1);
    const isZero = v === 0;
    parts.push(
      `<line x1="${PAD_L}" x2="${W - PAD_R}" y1="${y}" y2="${y}" stroke="${isZero ? '#94a3b8' : '#e2e8f0'}" stroke-width="${isZero ? 1 : 0.5}"${isZero ? '' : ' stroke-dasharray="2 2"'} />`
    );
    parts.push(
      `<text x="${PAD_L - 4}" y="${(yScale(v) + 3).toFixed(1)}" text-anchor="end" font-size="10" fill="#64748b">${v >= 0 ? '+' + v : v}</text>`
    );
  }

  const tickEvery = Math.max(1, Math.ceil((points.length - 1) / 6));
  for (let i = 1; i < points.length; i++) {
    if (i !== points.length - 1 && i % tickEvery !== 0) continue;
    parts.push(
      `<text x="${xScale(i).toFixed(1)}" y="${H - 8}" text-anchor="middle" font-size="10" fill="#94a3b8">#${points[i].roundIndex}</text>`
    );
  }

  for (let seat = 0; seat < 4; seat++) {
    const d = points
      .map((p, i) => {
        const x = xScale(i).toFixed(1);
        const y = yScale(p.totals[seat]).toFixed(1);
        return `${i === 0 ? 'M' : 'L'}${x},${y}`;
      })
      .join(' ');
    parts.push(
      `<path d="${d}" stroke="${SEAT_COLORS[seat]}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />`
    );
  }

  for (let seat = 0; seat < 4; seat++) {
    const last = points[points.length - 1];
    const x = xScale(points.length - 1).toFixed(1);
    const y = yScale(last.totals[seat]).toFixed(1);
    parts.push(`<circle cx="${x}" cy="${y}" r="3" fill="${SEAT_COLORS[seat]}" />`);
  }

  parts.push('</svg>');
  return `data:image/svg+xml;utf8,${encodeURIComponent(parts.join(''))}`;
}

export const SessionShareCard = forwardRef<HTMLDivElement, Props>(({ session }, ref) => {
  const totals = sumRoundDeltas(session.rounds);
  const order = [0, 1, 2, 3].sort((a, b) => totals[b] - totals[a]);
  const trendUri = buildTrendUri(session);
  const endTime = session.endTime ?? Date.now();

  return (
    <View id='session-share-card' className={styles.card} ref={ref as any}>
      <View className={styles.brand}>
        <Text className={styles.brandTitle}>🎲 国标麻将 · 战报</Text>
      </View>

      <View className={styles.timeRow}>
        <Text className={styles.timeText}>
          {formatTime(session.startTime)} - {formatTime(endTime)} · {session.rounds.length} 把 · 底分 {session.baseScore}
        </Text>
      </View>

      <View className={styles.scoreList}>
        {order.map((seat, rank) => (
          <View key={seat} className={`${styles.scoreRow} ${rank === 0 ? styles.scoreRowLeader : ''}`}>
            <Text className={styles.scoreMedal}>{RANK_MEDAL[rank]}</Text>
            <Text className={styles.scoreSeat}>{SEAT_LABELS[seat]}</Text>
            <Text className={styles.scoreName}>{session.players[seat]}</Text>
            <Text className={totals[seat] > 0 ? styles.scorePos : totals[seat] < 0 ? styles.scoreNeg : styles.scoreZero}>
              {totals[seat] > 0 ? `+${totals[seat]}` : totals[seat]}
            </Text>
          </View>
        ))}
      </View>

      {trendUri && (
        <View className={styles.trendBox}>
          <Image className={styles.trendImg} src={trendUri} mode='widthFix' />
        </View>
      )}

      <View className={styles.footer}>
        <Text className={styles.footerText}>国标麻将算番器</Text>
      </View>
    </View>
  );
});
