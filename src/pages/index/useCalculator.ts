import { useReducer, useMemo, useCallback, useEffect } from 'react';
import { tile, tileFromIndex, tileIndex, tileToCode, tileEquals, Tiles, type Tile, type Suit } from '../../engine/models/tile';
import { TileSet } from '../../engine/models/tileSet';
import { sequence, triplet, kong, type Meld, meldTiles } from '../../engine/models/meld';
import { createGameContext, type EvaluationResult } from '../../engine/models/types';
import { evaluate } from '../../engine/evaluator';
import { isWinningHandWithMelds } from '../../engine/decomposer';
import { calculateShanten } from '../../engine/shantenCalculator';
import { saveState, loadState } from './stateStorage';

// ── Types ──

type AddTarget = 'hand' | 'chi' | 'peng' | 'mingKong' | 'anKong';

interface State {
  handCounts: number[];       // int[34]
  chiMelds: Meld[];
  pengMelds: Meld[];
  mingKongMelds: Meld[];
  anKongMelds: Meld[];
  isSelfDraw: boolean;
  seatWind: Tile;
  roundWind: Tile;
  flowerCount: number;
  winningTile: Tile | null;
  isLastTile: boolean;
  isKongDraw: boolean;
  isRobbingKong: boolean;
  isWinningTileLast: boolean;
  settingsOpen: boolean;
  addTarget: AddTarget;
  expandedWaitTile: string | null;
  expandedFanName: string | null;
}

type Action =
  | { type: 'ADD_HAND_TILE'; tile: Tile }
  | { type: 'REMOVE_HAND_TILE'; tile: Tile }
  | { type: 'ADD_CHI'; tile: Tile }
  | { type: 'ADD_PENG'; tile: Tile }
  | { type: 'ADD_MING_KONG'; tile: Tile }
  | { type: 'ADD_AN_KONG'; tile: Tile }
  | { type: 'REMOVE_MELD'; meldType: 'chi' | 'peng' | 'mingKong' | 'anKong'; index: number }
  | { type: 'SET_ADD_TARGET'; target: AddTarget }
  | { type: 'SET_SELF_DRAW'; value: boolean }
  | { type: 'SET_SEAT_WIND'; wind: Tile }
  | { type: 'SET_ROUND_WIND'; wind: Tile }
  | { type: 'SET_FLOWER'; count: number }
  | { type: 'TOGGLE_LAST_TILE' }
  | { type: 'TOGGLE_KONG_DRAW' }
  | { type: 'TOGGLE_ROBBING_KONG' }
  | { type: 'TOGGLE_WINNING_TILE_LAST' }
  | { type: 'TOGGLE_SETTINGS' }
  | { type: 'ADD_WINNING_TILE'; tile: Tile }
  | { type: 'EXPAND_WAIT'; code: string | null }
  | { type: 'EXPAND_FAN'; name: string | null }
  | { type: 'CLEAR_ALL' };

export interface WinSuggestion {
  tile: Tile;
  tileCode: string;
  result: EvaluationResult;
}

// ── Initial state ──

const initialState: State = {
  handCounts: new Array(34).fill(0),
  chiMelds: [],
  pengMelds: [],
  mingKongMelds: [],
  anKongMelds: [],
  isSelfDraw: true,
  seatWind: Tiles.East,
  roundWind: Tiles.East,
  flowerCount: 0,
  winningTile: null,
  isLastTile: false,
  isKongDraw: false,
  isRobbingKong: false,
  isWinningTileLast: false,
  settingsOpen: true,
  addTarget: 'hand',
  expandedWaitTile: null,
  expandedFanName: null,
};

// ── Helpers ──

function totalTileCount(state: State): number {
  const hand = state.handCounts.reduce((a, b) => a + b, 0);
  const meldTiles = [...state.chiMelds, ...state.pengMelds].reduce((s, m) => s + 3, 0)
    + [...state.mingKongMelds, ...state.anKongMelds].reduce((s, m) => s + 4, 0);
  return hand + meldTiles;
}

function kongCount(state: State): number {
  return state.mingKongMelds.length + state.anKongMelds.length;
}

function expectedTileCount(state: State): number {
  return 14 + kongCount(state);
}

function effectiveTileCount(state: State): number {
  return totalTileCount(state) - kongCount(state);
}

function getTotalForTile(state: State, t: Tile): number {
  const idx = tileIndex(t);
  let count = state.handCounts[idx];
  for (const m of [...state.chiMelds, ...state.pengMelds, ...state.mingKongMelds, ...state.anKongMelds]) {
    for (const mt of meldTiles(m)) {
      if (tileEquals(mt, t)) count++;
    }
  }
  return count;
}

function buildAllCounts(state: State): TileSet {
  const ts = TileSet.fromCounts([...state.handCounts]);
  for (const m of [...state.chiMelds, ...state.pengMelds]) {
    for (const mt of meldTiles(m)) ts.add(mt);
  }
  // Kongs: add 3 to evaluation counts (same as v1)
  for (const m of [...state.mingKongMelds, ...state.anKongMelds]) {
    ts.add(m.start, 3);
  }
  return ts;
}

function buildLockedMelds(state: State): Meld[] {
  return [...state.chiMelds, ...state.pengMelds, ...state.mingKongMelds, ...state.anKongMelds];
}

function buildChiTiles(t: Tile): Tile[] | null {
  if (t.suit !== 'man' && t.suit !== 'pin' && t.suit !== 'sou') return null;
  if (t.rank > 6) return null;
  return [t, tile(t.suit, t.rank + 1), tile(t.suit, t.rank + 2)];
}

// ── Reducer ──

function reducer(state: State, action: Action): State {
  const total = totalTileCount(state);
  const expected = expectedTileCount(state);

  switch (action.type) {
    case 'ADD_HAND_TILE': {
      if (total >= expected) return state;
      if (getTotalForTile(state, action.tile) >= 4) return state;
      const counts = [...state.handCounts];
      counts[tileIndex(action.tile)]++;
      return { ...state, handCounts: counts, winningTile: action.tile, expandedWaitTile: null, expandedFanName: null };
    }
    case 'REMOVE_HAND_TILE': {
      const idx = tileIndex(action.tile);
      if (state.handCounts[idx] <= 0) return state;
      const counts = [...state.handCounts];
      const wasLast = counts[idx] === 1;
      counts[idx]--;
      const wt = wasLast && state.winningTile && tileEquals(state.winningTile, action.tile)
        ? null : state.winningTile;
      return { ...state, handCounts: counts, winningTile: wt, expandedWaitTile: null, expandedFanName: null };
    }
    case 'ADD_CHI': {
      const tiles = buildChiTiles(action.tile);
      if (!tiles) return state;
      if (total + 3 > expected) return state;
      // Check all tiles have room
      for (const t of tiles) {
        if (getTotalForTile(state, t) >= 4) return state;
      }
      return { ...state, chiMelds: [...state.chiMelds, sequence(action.tile, true)], expandedWaitTile: null, expandedFanName: null };
    }
    case 'ADD_PENG': {
      if (total + 3 > expected) return state;
      if (getTotalForTile(state, action.tile) + 3 > 4) return state;
      return { ...state, pengMelds: [...state.pengMelds, triplet(action.tile, true)], expandedWaitTile: null, expandedFanName: null };
    }
    case 'ADD_MING_KONG': {
      if (total + 4 > expected + 1) return state; // kong adds 1 extra
      if (getTotalForTile(state, action.tile) + 4 > 4) return state;
      return { ...state, mingKongMelds: [...state.mingKongMelds, kong(action.tile, true)], expandedWaitTile: null, expandedFanName: null };
    }
    case 'ADD_AN_KONG': {
      if (total + 4 > expected + 1) return state;
      if (getTotalForTile(state, action.tile) + 4 > 4) return state;
      return { ...state, anKongMelds: [...state.anKongMelds, kong(action.tile, false)], expandedWaitTile: null, expandedFanName: null };
    }
    case 'REMOVE_MELD': {
      const key = action.meldType === 'chi' ? 'chiMelds'
        : action.meldType === 'peng' ? 'pengMelds'
        : action.meldType === 'mingKong' ? 'mingKongMelds'
        : 'anKongMelds';
      const list = [...state[key]];
      list.splice(action.index, 1);
      return { ...state, [key]: list, expandedWaitTile: null, expandedFanName: null };
    }
    case 'SET_ADD_TARGET':
      return { ...state, addTarget: action.target };
    case 'SET_SELF_DRAW':
      return { ...state, isSelfDraw: action.value, expandedWaitTile: null, expandedFanName: null };
    case 'SET_SEAT_WIND':
      return { ...state, seatWind: action.wind, expandedWaitTile: null, expandedFanName: null };
    case 'SET_ROUND_WIND':
      return { ...state, roundWind: action.wind, expandedWaitTile: null, expandedFanName: null };
    case 'SET_FLOWER':
      return { ...state, flowerCount: Math.max(0, Math.min(8, action.count)), expandedWaitTile: null, expandedFanName: null };
    case 'TOGGLE_LAST_TILE':
      return { ...state, isLastTile: !state.isLastTile, expandedWaitTile: null, expandedFanName: null };
    case 'TOGGLE_KONG_DRAW':
      return { ...state, isKongDraw: !state.isKongDraw, expandedWaitTile: null, expandedFanName: null };
    case 'TOGGLE_ROBBING_KONG':
      return { ...state, isRobbingKong: !state.isRobbingKong, expandedWaitTile: null, expandedFanName: null };
    case 'TOGGLE_WINNING_TILE_LAST':
      return { ...state, isWinningTileLast: !state.isWinningTileLast, expandedWaitTile: null, expandedFanName: null };
    case 'TOGGLE_SETTINGS':
      return { ...state, settingsOpen: !state.settingsOpen };
    case 'ADD_WINNING_TILE': {
      if (total >= expected) return state;
      if (getTotalForTile(state, action.tile) >= 4) return state;
      const counts = [...state.handCounts];
      counts[tileIndex(action.tile)]++;
      return { ...state, handCounts: counts, winningTile: action.tile, addTarget: 'hand', expandedWaitTile: null, expandedFanName: null };
    }
    case 'EXPAND_WAIT':
      return { ...state, expandedWaitTile: state.expandedWaitTile === action.code ? null : action.code };
    case 'EXPAND_FAN':
      return { ...state, expandedFanName: state.expandedFanName === action.name ? null : action.name };
    case 'CLEAR_ALL':
      return { ...initialState, settingsOpen: state.settingsOpen };
    default:
      return state;
  }
}

// ── Hook ──

function lazyInit(): State {
  const loaded = loadState();
  if (!loaded) return initialState;
  return {
    ...initialState,
    ...loaded,
  } as State;
}

export function useCalculator() {
  const [state, dispatch] = useReducer(reducer, undefined, lazyInit);

  // Persist on every state change
  useEffect(() => {
    saveState({
      handCounts: state.handCounts,
      chiMelds: state.chiMelds,
      pengMelds: state.pengMelds,
      mingKongMelds: state.mingKongMelds,
      anKongMelds: state.anKongMelds,
      isSelfDraw: state.isSelfDraw,
      seatWind: state.seatWind,
      roundWind: state.roundWind,
      flowerCount: state.flowerCount,
      winningTile: state.winningTile,
      isLastTile: state.isLastTile,
      isKongDraw: state.isKongDraw,
      isRobbingKong: state.isRobbingKong,
      isWinningTileLast: state.isWinningTileLast,
      settingsOpen: state.settingsOpen,
    });
  }, [state]);

  const total = totalTileCount(state);
  const expected = expectedTileCount(state);
  const effective = effectiveTileCount(state);
  const isAtLimit = total >= expected;

  // ── Evaluate current hand ──
  const currentResult = useMemo((): EvaluationResult | null => {
    if (total !== expected || effective !== 14) return null;
    const allCounts = buildAllCounts(state);
    if (allCounts.total() % 3 !== 2) return null;
    const melds = buildLockedMelds(state);
    if (!isWinningHandWithMelds(allCounts, melds)) return null;

    const game = createGameContext({
      isSelfDraw: state.isSelfDraw,
      winningTile: state.winningTile ?? undefined,
      seatWind: state.seatWind,
      roundWind: state.roundWind,
      flowerCount: state.flowerCount,
      isLastTile: state.isLastTile,
      isKongDraw: state.isKongDraw,
      isRobbingKong: state.isRobbingKong,
      isWinningTileLast: state.isWinningTileLast,
      chiCount: state.chiMelds.length,
      pengCount: state.pengMelds.length,
      mingKongCount: state.mingKongMelds.length,
      anKongCount: state.anKongMelds.length,
    });

    return evaluate(allCounts, melds, game);
  }, [state]);

  // ── Win suggestions (tenpai) ──
  const winSuggestions = useMemo((): WinSuggestion[] => {
    const listenExpected = expected - 1;
    if (total !== listenExpected || effective !== 13) return [];
    const allCounts = buildAllCounts(state);
    if (allCounts.total() % 3 !== 1) return [];
    const melds = buildLockedMelds(state);
    const results: WinSuggestion[] = [];

    const raw = [...allCounts.rawCounts()];
    for (let i = 0; i < 34; i++) {
      if (raw[i] >= 4) continue;
      const t = tileFromIndex(i);
      allCounts.add(t);

      if (isWinningHandWithMelds(allCounts, melds)) {
        const game = createGameContext({
          isSelfDraw: state.isSelfDraw,
          winningTile: t,
          seatWind: state.seatWind,
          roundWind: state.roundWind,
          flowerCount: state.flowerCount,
          isLastTile: state.isLastTile,
          isKongDraw: state.isKongDraw,
          isRobbingKong: state.isRobbingKong,
          isWinningTileLast: state.isWinningTileLast,
          chiCount: state.chiMelds.length,
          pengCount: state.pengMelds.length,
          mingKongCount: state.mingKongMelds.length,
          anKongCount: state.anKongMelds.length,
        });
        results.push({
          tile: t,
          tileCode: tileToCode(t),
          result: evaluate(allCounts, melds, game),
        });
      }

      allCounts.remove(t);
    }

    return results;
  }, [state]);

  // ── Discard analysis inputs (when at 14 tiles) ──
  const discardAnalysisInputs = useMemo(() => {
    if (total !== expected || effective !== 14) return null;
    const allCounts = buildAllCounts(state);
    const melds = buildLockedMelds(state);
    const game = createGameContext({
      isSelfDraw: state.isSelfDraw,
      winningTile: state.winningTile ?? undefined,
      seatWind: state.seatWind,
      roundWind: state.roundWind,
      flowerCount: state.flowerCount,
      isLastTile: state.isLastTile,
      isKongDraw: state.isKongDraw,
      isRobbingKong: state.isRobbingKong,
      isWinningTileLast: state.isWinningTileLast,
      chiCount: state.chiMelds.length,
      pengCount: state.pengMelds.length,
      mingKongCount: state.mingKongMelds.length,
      anKongCount: state.anKongMelds.length,
    });
    return { allCounts, melds, game };
  }, [state]);

  // ── Fan potential inputs (when at 13 or 14 tiles) ──
  const fanPotentialInputs = useMemo(() => {
    if (total < expected - 1 || effective < 13) return null;
    const allCounts = buildAllCounts(state);
    const melds = buildLockedMelds(state);
    const game = createGameContext({
      isSelfDraw: state.isSelfDraw,
      winningTile: state.winningTile ?? undefined,
      seatWind: state.seatWind,
      roundWind: state.roundWind,
      flowerCount: state.flowerCount,
      isLastTile: state.isLastTile,
      isKongDraw: state.isKongDraw,
      isRobbingKong: state.isRobbingKong,
      isWinningTileLast: state.isWinningTileLast,
      chiCount: state.chiMelds.length,
      pengCount: state.pengMelds.length,
      mingKongCount: state.mingKongMelds.length,
      anKongCount: state.anKongMelds.length,
    });
    return { allCounts, melds, game, totalCount: total, expectedCount: expected };
  }, [state, total, expected]);

  // ── Dispatch helpers ──
  const addTileToTarget = useCallback((t: Tile) => {
    switch (state.addTarget) {
      case 'hand': dispatch({ type: 'ADD_HAND_TILE', tile: t }); break;
      case 'chi': dispatch({ type: 'ADD_CHI', tile: t }); break;
      case 'peng': dispatch({ type: 'ADD_PENG', tile: t }); break;
      case 'mingKong': dispatch({ type: 'ADD_MING_KONG', tile: t }); break;
      case 'anKong': dispatch({ type: 'ADD_AN_KONG', tile: t }); break;
    }
  }, [state.addTarget]);

  const isTileDisabled = useCallback((t: Tile) => {
    return isAtLimit || getTotalForTile(state, t) >= 4;
  }, [state, isAtLimit]);

  return {
    state,
    dispatch,
    total,
    expected,
    isAtLimit,
    discardAnalysisInputs,
    fanPotentialInputs,
    currentResult,
    winSuggestions,
    addTileToTarget,
    isTileDisabled,
  };
}
