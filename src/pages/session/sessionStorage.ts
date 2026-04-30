import Taro from '@tarojs/taro';
import type { Round } from '../../engine/scoring';

export interface Session {
  id: string;
  startTime: number;
  endTime?: number;            // undefined while active
  players: [string, string, string, string];
  rounds: Round[];
}

export interface SessionStore {
  activeSessionId: string | null;
  sessions: Session[];
}

const STORAGE_KEY = 'mahjong_sessions_v1';
const MAX_SESSIONS = 50; // keep at most 50 sessions to bound storage

const EMPTY_STORE: SessionStore = { activeSessionId: null, sessions: [] };

export function loadSessions(): SessionStore {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEY);
    if (!raw) return EMPTY_STORE;
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!parsed || typeof parsed !== 'object') return EMPTY_STORE;
    if (!Array.isArray(parsed.sessions)) return EMPTY_STORE;
    // Defensive: drop any session that doesn't have a sane shape, so a single
    // corrupt entry can't tank the whole page mount.
    const validSessions = parsed.sessions.filter((s: any) =>
      s && typeof s.id === 'string' && Array.isArray(s.players) && s.players.length === 4 && Array.isArray(s.rounds)
    );
    return {
      activeSessionId: typeof parsed.activeSessionId === 'string' ? parsed.activeSessionId : null,
      sessions: validSessions,
    };
  } catch {
    return EMPTY_STORE;
  }
}

/** Manual escape hatch: nuke all session data. Useful from the console
 *  when storage gets into a weird state. Not wired to UI. */
export function clearAllSessions(): void {
  try {
    Taro.removeStorageSync(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function saveSessions(store: SessionStore): void {
  try {
    // Cap stored history to prevent unbounded growth
    const trimmed: SessionStore = {
      activeSessionId: store.activeSessionId,
      sessions: store.sessions.slice(-MAX_SESSIONS),
    };
    Taro.setStorageSync(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Failed to save sessions:', e);
  }
}

export function makeId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createSession(players: [string, string, string, string]): Session {
  return {
    id: makeId(),
    startTime: Date.now(),
    players,
    rounds: [],
  };
}
