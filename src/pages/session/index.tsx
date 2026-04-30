import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro, { useShareAppMessage, useShareTimeline } from '@tarojs/taro';
import { BottomNav } from '../../components/BottomNav';
import { RoundEntryModal } from '../../components/RoundEntryModal';
import {
  computeRoundDeltas,
  sumRoundDeltas,
  SEAT_LABELS,
  type Round,
} from '../../engine/scoring';
import {
  loadSessions,
  saveSessions,
  createSession,
  type Session,
  type SessionStore,
} from './sessionStorage';
import { aggregateByPlayer, buildRunningTotals, type TimeRange } from './aggregation';
import { TrendChart } from '../../components/TrendChart';
import { SessionShareButton } from '../../components/SessionShareButton';
import styles from './index.module.css';

const RANK_MEDAL = ['🥇', '🥈', '🥉', '🏅'];

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function describeRound(r: Round, players: readonly string[]): string {
  if (r.type === 'draw') return '黄庄';
  const winner = `${SEAT_LABELS[r.winnerSeat ?? 0]}${players[r.winnerSeat ?? 0] ? `(${players[r.winnerSeat ?? 0]})` : ''}`;
  if (r.type === 'selfDraw') return `${winner} 自摸 ${r.fan}番`;
  const dis = SEAT_LABELS[r.discarderSeat ?? 0];
  return `${winner} 点炮(${dis}打) ${r.fan}番`;
}

const BASE_PRESETS = [
  { value: 0, label: '0' },
  { value: 1, label: '1' },
  { value: 5, label: '5' },
  { value: 8, label: '8 (国标)' },
  { value: 10, label: '10' },
];

export default function SessionPage() {
  const [store, setStore] = useState<SessionStore>(() => loadSessions());
  const [showSetup, setShowSetup] = useState(false);
  const [setupNames, setSetupNames] = useState<[string, string, string, string]>(['', '', '', '']);
  const [setupBase, setSetupBase] = useState<number>(8);
  const [showEntry, setShowEntry] = useState(false);
  const [editingRound, setEditingRound] = useState<Round | null>(null);
  const [aggRange, setAggRange] = useState<TimeRange>('week');
  const [showAllArchived, setShowAllArchived] = useState(false);

  useShareAppMessage(() => ({
    title: '国标麻将对局计分 · 自动算分,生成战报',
    path: '/pages/session/index',
  }));
  useShareTimeline(() => ({ title: '国标麻将对局计分', query: '' }));

  // persist on every store change
  useEffect(() => {
    saveSessions(store);
  }, [store]);

  const active = useMemo(
    () => store.sessions.find((s) => s.id === store.activeSessionId) ?? null,
    [store]
  );
  const totals = useMemo(
    () => (active ? sumRoundDeltas(active.rounds) : ([0, 0, 0, 0] as const)),
    [active]
  );
  const ranks = useMemo(() => {
    const idx = [0, 1, 2, 3].sort((a, b) => totals[b] - totals[a]);
    const rank: number[] = [0, 0, 0, 0];
    idx.forEach((seat, r) => (rank[seat] = r));
    return rank;
  }, [totals]);

  const archivedSessions = useMemo(
    () => store.sessions.filter((s) => s.id !== store.activeSessionId).sort((a, b) => b.startTime - a.startTime),
    [store]
  );

  const startSession = useCallback(() => {
    const players: [string, string, string, string] = [
      setupNames[0].trim() || '东',
      setupNames[1].trim() || '南',
      setupNames[2].trim() || '西',
      setupNames[3].trim() || '北',
    ];
    const session = createSession(players, setupBase);
    setStore((prev) => ({
      activeSessionId: session.id,
      sessions: [...prev.sessions, session],
    }));
    setShowSetup(false);
    setSetupNames(['', '', '', '']);
    setSetupBase(8);
  }, [setupNames, setupBase]);

  const addRound = useCallback(
    (round: Round) => {
      if (!active) return;
      setStore((prev) => ({
        ...prev,
        sessions: prev.sessions.map((s) =>
          s.id === active.id ? { ...s, rounds: [...s.rounds, round] } : s
        ),
      }));
      setShowEntry(false);
      setEditingRound(null);
    },
    [active]
  );

  const updateRound = useCallback(
    (round: Round) => {
      if (!active) return;
      setStore((prev) => ({
        ...prev,
        sessions: prev.sessions.map((s) =>
          s.id === active.id ? { ...s, rounds: s.rounds.map((r) => (r.id === round.id ? round : r)) } : s
        ),
      }));
      setShowEntry(false);
      setEditingRound(null);
    },
    [active]
  );

  const deleteRound = useCallback(
    (roundId: string) => {
      if (!active) return;
      Taro.showModal({
        title: '删除这一把?',
        content: '后续累计会重新计算',
        confirmText: '删除',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            setStore((prev) => ({
              ...prev,
              sessions: prev.sessions.map((s) =>
                s.id === active.id ? { ...s, rounds: s.rounds.filter((r) => r.id !== roundId) } : s
              ),
            }));
          }
        },
      });
    },
    [active]
  );

  const deleteSession = useCallback((sessionId: string) => {
    Taro.showModal({
      title: '删除这局历史?',
      content: '此操作不可撤销。',
      confirmText: '删除',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          setStore((prev) => ({
            ...prev,
            sessions: prev.sessions.filter((s) => s.id !== sessionId),
          }));
        }
      },
    });
  }, []);

  const archiveCurrent = useCallback(() => {
    if (!active) return;
    Taro.showModal({
      title: '结束本局?',
      content: '本局会归档到历史。可以新开一局重新开始。',
      confirmText: '结束',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          setStore((prev) => ({
            activeSessionId: null,
            sessions: prev.sessions.map((s) =>
              s.id === active.id ? { ...s, endTime: Date.now() } : s
            ),
          }));
        }
      },
    });
  }, [active]);

  const copySession = useCallback(() => {
    if (!active) return;
    const lines: string[] = [];
    lines.push(`🎲 国标麻将对局 (${formatTime(active.startTime)} 起)`);
    lines.push(`玩家: ${active.players.map((n, i) => `${SEAT_LABELS[i]}=${n}`).join(' / ')}`);
    lines.push('');
    active.rounds.forEach((r, i) => {
      const d = computeRoundDeltas(r);
      const deltaStr = d.map((v, j) => `${SEAT_LABELS[j]}${v >= 0 ? '+' : ''}${v}`).join(' ');
      lines.push(`#${i + 1} ${describeRound(r, active.players)}  ${deltaStr}`);
    });
    lines.push('');
    lines.push(`总计: ${totals.map((v, i) => `${SEAT_LABELS[i]}${v >= 0 ? '+' : ''}${v}`).join(' / ')}`);
    const text = lines.join('\n');
    Taro.setClipboardData({ data: text });
    Taro.showToast({ title: '已复制', icon: 'success', duration: 1200 });
  }, [active, totals]);

  const playerAgg = useMemo(() => aggregateByPlayer(store.sessions, aggRange), [store, aggRange]);
  const runningPoints = useMemo(() => active ? buildRunningTotals(active) : [], [active]);

  const backupAll = useCallback(() => {
    if (store.sessions.length === 0) {
      Taro.showToast({ title: '没有数据可备份', icon: 'none', duration: 1500 });
      return;
    }
    const data = {
      version: 1,
      exportedAt: Date.now(),
      activeSessionId: store.activeSessionId,
      sessions: store.sessions,
    };
    Taro.setClipboardData({ data: JSON.stringify(data) });
    Taro.showToast({
      title: `已复制 ${store.sessions.length} 局备份`,
      icon: 'success',
      duration: 1800,
    });
  }, [store]);

  const restoreAll = useCallback(async () => {
    let text: string | null = null;
    if (typeof window !== 'undefined' && typeof window.prompt === 'function') {
      text = window.prompt('粘贴备份 JSON 来恢复全部数据(会覆盖当前所有局):');
    } else {
      try {
        const r = await Taro.getClipboardData();
        text = r.data || null;
      } catch (e) { /* ignore */ }
    }
    if (!text) return;
    try {
      const parsed = JSON.parse(text.trim());
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.sessions)) {
        Taro.showToast({ title: '不是有效的备份 JSON', icon: 'none', duration: 1800 });
        return;
      }
      // Validate each session minimally
      const validSessions = parsed.sessions.filter((s: any) =>
        s && typeof s.id === 'string' && Array.isArray(s.players) && s.players.length === 4 && Array.isArray(s.rounds)
      ).map((s: any) => ({ ...s, baseScore: typeof s.baseScore === 'number' ? s.baseScore : 8 }));
      if (validSessions.length === 0) {
        Taro.showToast({ title: '备份里没有合法 session', icon: 'none', duration: 1800 });
        return;
      }
      Taro.showModal({
        title: `恢复 ${validSessions.length} 局?`,
        content: `当前 ${store.sessions.length} 局会被覆盖。建议先点"备份"备一份。`,
        confirmText: '覆盖',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            const validIds = new Set(validSessions.map((s: any) => s.id));
            setStore({
              activeSessionId:
                typeof parsed.activeSessionId === 'string' && validIds.has(parsed.activeSessionId)
                  ? parsed.activeSessionId
                  : null,
              sessions: validSessions,
            });
            Taro.showToast({ title: '已恢复', icon: 'success', duration: 1200 });
          }
        },
      });
    } catch (e) {
      Taro.showToast({ title: 'JSON 解析失败', icon: 'none', duration: 1800 });
    }
  }, [store]);

  const todayTotal = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todaySessions = store.sessions.filter((s) => s.startTime >= todayStart.getTime());
    if (todaySessions.length === 0) return null;
    const totalRounds = todaySessions.reduce((sum, s) => sum + s.rounds.length, 0);
    return { sessionCount: todaySessions.length, roundCount: totalRounds };
  }, [store]);

  const containerStyle = process.env.TARO_ENV !== 'h5' ? { maxWidth: 'none' } : undefined;

  return (
    <View className={styles.container} style={containerStyle}>
      <View className={styles.content}>
        <View className={styles.header}>
          <View className={styles.title}>
            <Text className={styles.titleIcon}>🎲</Text>
            <Text className={styles.titleText}>对局计分</Text>
          </View>
          {active && (
            <View className={styles.endBtn} onClick={archiveCurrent}>
              <Text>结束本局</Text>
            </View>
          )}
        </View>

        {todayTotal && (
          <View className={styles.todayBar}>
            <Text className={styles.todayText}>📅 今天已进行 {todayTotal.sessionCount} 局, 共 {todayTotal.roundCount} 把</Text>
          </View>
        )}

        {!active && !showSetup && (
          <View className={styles.emptyState}>
            <Text className={styles.emptyHint}>当前没有进行中的对局</Text>
            <View className={styles.startBtn} onClick={() => setShowSetup(true)}>
              <Text>🎲 新开一局</Text>
            </View>
            {store.sessions.length === 0 && (
              <View className={styles.importBtn} onClick={restoreAll}>
                <Text>📥 从 JSON 恢复(换手机迁移)</Text>
              </View>
            )}
          </View>
        )}

        {!active && showSetup && (
          <View className={styles.setupCard}>
            <Text className={styles.setupTitle}>玩家(留空用东/南/西/北)</Text>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} className={styles.setupRow}>
                <Text className={styles.setupSeat}>{SEAT_LABELS[i]}</Text>
                <Input
                  className={styles.setupInput}
                  type='text'
                  value={setupNames[i]}
                  placeholder={SEAT_LABELS[i]}
                  maxlength={10}
                  onInput={(e) => {
                    const next = [...setupNames] as [string, string, string, string];
                    next[i] = e.detail.value;
                    setSetupNames(next);
                  }}
                />
              </View>
            ))}
            <Text className={styles.setupTitle}>底分(起和番)</Text>
            <View className={styles.basePresetRow}>
              {BASE_PRESETS.map((p) => (
                <View
                  key={p.value}
                  className={`${styles.basePreset} ${setupBase === p.value ? styles.basePresetActive : ''}`}
                  onClick={() => setSetupBase(p.value)}
                >
                  <Text>{p.label}</Text>
                </View>
              ))}
            </View>
            <Text className={styles.setupHint}>
              当前公式:自摸 +({setupBase}+番)×3,点炮 +({setupBase}+番)+{setupBase * 2}
            </Text>
            <View className={styles.setupActions}>
              <View className={styles.setupCancel} onClick={() => { setShowSetup(false); setSetupNames(['', '', '', '']); setSetupBase(8); }}>
                <Text>取消</Text>
              </View>
              <View className={styles.setupConfirm} onClick={startSession}>
                <Text>开始</Text>
              </View>
            </View>
          </View>
        )}

        {active && (
          <>
            <View className={styles.scoreboard}>
              {[0, 1, 2, 3].map((seat) => (
                <View key={seat} className={`${styles.scoreCell} ${ranks[seat] === 0 ? styles.scoreCellLeader : ''}`}>
                  <Text className={styles.scoreMedal}>{RANK_MEDAL[ranks[seat]]}</Text>
                  <Text className={styles.scoreSeat}>{SEAT_LABELS[seat]}</Text>
                  <Text className={styles.scoreName}>{active.players[seat]}</Text>
                  <Text className={totals[seat] > 0 ? styles.scorePos : totals[seat] < 0 ? styles.scoreNeg : styles.scoreZero}>
                    {totals[seat] > 0 ? `+${totals[seat]}` : totals[seat]}
                  </Text>
                </View>
              ))}
            </View>
            <Text className={styles.baseHint}>底分: {active.baseScore} {active.baseScore === 8 ? '(国标)' : ''}</Text>

            {active.rounds.length >= 1 && (
              <View className={styles.chartSection}>
                <Text className={styles.chartTitle}>📈 走势</Text>
                <TrendChart points={runningPoints} players={active.players} />
              </View>
            )}

            <View className={styles.addBtn} onClick={() => { setEditingRound(null); setShowEntry(true); }}>
              <Text>➕ 录入这一把</Text>
            </View>

            <View className={styles.historySection}>
              <View className={styles.historyHeader}>
                <Text className={styles.historyTitle}>📜 流水 ({active.rounds.length} 把)</Text>
                {active.rounds.length > 0 && (
                  <View className={styles.headerActions}>
                    <View className={styles.copyBtn} onClick={copySession}>
                      <Text>📋 复制</Text>
                    </View>
                    <SessionShareButton session={active} />
                  </View>
                )}
              </View>
              {active.rounds.length === 0 && (
                <Text className={styles.emptyHint}>还没有记录,点上方按钮录入第一把</Text>
              )}
              {active.rounds.map((r, i) => {
                const d = computeRoundDeltas(r);
                return (
                  <View key={r.id} className={styles.roundRow}>
                    <View className={styles.roundInfo}>
                      <Text className={styles.roundIdx}>#{i + 1}</Text>
                      <View className={styles.roundDetail}>
                        <Text className={styles.roundDesc}>{describeRound(r, active.players)}</Text>
                        <View className={styles.roundDeltas}>
                          {d.map((v, j) => (
                            <Text
                              key={j}
                              className={v > 0 ? styles.deltaPos : v < 0 ? styles.deltaNeg : styles.deltaZero}
                            >
                              {SEAT_LABELS[j]}{v >= 0 ? '+' : ''}{v}
                            </Text>
                          ))}
                        </View>
                      </View>
                    </View>
                    <View className={styles.roundActions}>
                      <View className={styles.roundEdit} onClick={() => { setEditingRound(r); setShowEntry(true); }}>
                        <Text>✎</Text>
                      </View>
                      <View className={styles.roundDelete} onClick={() => deleteRound(r.id)}>
                        <Text>🗑</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {store.sessions.length > 0 && playerAgg.length > 0 && (
          <View className={styles.aggregateSection}>
            <View className={styles.aggregateHeader}>
              <Text className={styles.archiveTitle}>📊 玩家累计</Text>
              <View className={styles.rangeRow}>
                {(['today', 'week', 'month', 'all'] as const).map((r) => (
                  <View
                    key={r}
                    className={`${styles.rangeChip} ${aggRange === r ? styles.rangeChipActive : ''}`}
                    onClick={() => setAggRange(r)}
                  >
                    <Text>{ {today: '今天', week: '本周', month: '本月', all: '全部'}[r] }</Text>
                  </View>
                ))}
              </View>
            </View>
            {playerAgg.map((p, i) => (
              <View key={p.name} className={styles.aggregateRow}>
                <Text className={styles.aggregateRank}>{['🥇','🥈','🥉','🏅'][Math.min(i, 3)]}</Text>
                <Text className={styles.aggregateName}>{p.name}</Text>
                <Text className={p.total > 0 ? styles.deltaPos : p.total < 0 ? styles.deltaNeg : styles.deltaZero}>
                  {p.total >= 0 ? '+' : ''}{p.total}
                </Text>
                <Text className={styles.aggregateMeta}>
                  {p.sessionCount} 局 / {p.roundCount} 把
                </Text>
              </View>
            ))}
            <View className={styles.dataActions}>
              <View className={styles.dataBtn} onClick={backupAll}>
                <Text>📦 备份全部数据</Text>
              </View>
              <View className={styles.dataBtn} onClick={restoreAll}>
                <Text>📥 恢复</Text>
              </View>
            </View>
          </View>
        )}

        {archivedSessions.length > 0 && (
          <View className={styles.archiveSection}>
            <Text className={styles.archiveTitle}>📚 历史 ({archivedSessions.length} 局)</Text>
            {(showAllArchived ? archivedSessions : archivedSessions.slice(0, 10)).map((s) => {
              const sumD = sumRoundDeltas(s.rounds);
              return (
                <View key={s.id} className={styles.archiveRow}>
                  <View className={styles.archiveTop}>
                    <Text className={styles.archiveTime}>⏰ {formatTime(s.startTime)}</Text>
                    <View className={styles.archiveTopRight}>
                      <Text className={styles.archiveCount}>{s.rounds.length} 把</Text>
                      <View className={styles.archiveDelete} onClick={() => deleteSession(s.id)}>
                        <Text>🗑</Text>
                      </View>
                    </View>
                  </View>
                  <View className={styles.archiveScores}>
                    {sumD.map((v, j) => (
                      <Text key={j} className={v > 0 ? styles.deltaPos : v < 0 ? styles.deltaNeg : styles.deltaZero}>
                        {s.players[j]}{v >= 0 ? '+' : ''}{v}
                      </Text>
                    ))}
                  </View>
                </View>
              );
            })}
            {archivedSessions.length > 10 && (
              <View className={styles.showMoreBtn} onClick={() => setShowAllArchived((v) => !v)}>
                <Text>
                  {showAllArchived ? '▲ 收起' : `▼ 显示更多 (${archivedSessions.length - 10} 局)`}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {showEntry && active && (
        <RoundEntryModal
          players={active.players}
          baseScore={active.baseScore}
          initial={editingRound ?? undefined}
          onSave={editingRound ? updateRound : addRound}
          onCancel={() => { setShowEntry(false); setEditingRound(null); }}
        />
      )}

      <BottomNav active='session' />
    </View>
  );
}
