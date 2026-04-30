import Taro from '@tarojs/taro';
import { tile, tileFromCode, tileToCode, type Tile, Tiles } from '../../engine/models/tile';
import { sequence, triplet, kong, type Meld } from '../../engine/models/meld';

const STORAGE_KEY = 'mahjong-scorer-state-v2';

interface StoredState {
  handCounts: number[];
  chiMelds: { startCode: string; isOpen: boolean }[];
  pengMelds: { startCode: string; isOpen: boolean }[];
  mingKongMelds: { startCode: string; isOpen: boolean }[];
  anKongMelds: { startCode: string; isOpen: boolean }[];
  isSelfDraw: boolean;
  seatWindCode: string;
  roundWindCode: string;
  flowerCount: number;
  winningTileCode: string | null;
  isLastTile: boolean;
  isKongDraw: boolean;
  isRobbingKong: boolean;
  isWinningTileLast: boolean;
  settingsOpen: boolean;
}

export interface StateSnapshot {
  handCounts: number[];
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
}

function meldToStorable(m: Meld): { startCode: string; isOpen: boolean } {
  return { startCode: tileToCode(m.start), isOpen: m.isOpen };
}

function storableToMeld(s: { startCode: string; isOpen: boolean }, type: 'sequence' | 'triplet' | 'kong'): Meld | null {
  const t = tileFromCode(s.startCode);
  if (!t) return null;
  return type === 'sequence' ? sequence(t, s.isOpen)
    : type === 'triplet' ? triplet(t, s.isOpen)
    : kong(t, s.isOpen);
}

export function saveState(state: StateSnapshot): void {
  try {
    const stored: StoredState = {
      handCounts: state.handCounts,
      chiMelds: state.chiMelds.map(meldToStorable),
      pengMelds: state.pengMelds.map(meldToStorable),
      mingKongMelds: state.mingKongMelds.map(meldToStorable),
      anKongMelds: state.anKongMelds.map(meldToStorable),
      isSelfDraw: state.isSelfDraw,
      seatWindCode: tileToCode(state.seatWind),
      roundWindCode: tileToCode(state.roundWind),
      flowerCount: state.flowerCount,
      winningTileCode: state.winningTile ? tileToCode(state.winningTile) : null,
      isLastTile: state.isLastTile,
      isKongDraw: state.isKongDraw,
      isRobbingKong: state.isRobbingKong,
      isWinningTileLast: state.isWinningTileLast,
      settingsOpen: state.settingsOpen,
    };
    Taro.setStorageSync(STORAGE_KEY, JSON.stringify(stored));
  } catch (e) {
    // Silent fail — storage may be unavailable
  }
}

export function loadState(): Partial<StateSnapshot> | null {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as StoredState;
    if (!stored.handCounts || stored.handCounts.length !== 34) return null;

    const seatWind = tileFromCode(stored.seatWindCode) ?? Tiles.East;
    const roundWind = tileFromCode(stored.roundWindCode) ?? Tiles.East;

    return {
      handCounts: stored.handCounts,
      chiMelds: stored.chiMelds.map(s => storableToMeld(s, 'sequence')).filter((m): m is Meld => m !== null),
      pengMelds: stored.pengMelds.map(s => storableToMeld(s, 'triplet')).filter((m): m is Meld => m !== null),
      mingKongMelds: stored.mingKongMelds.map(s => storableToMeld(s, 'kong')).filter((m): m is Meld => m !== null),
      anKongMelds: stored.anKongMelds.map(s => storableToMeld(s, 'kong')).filter((m): m is Meld => m !== null),
      isSelfDraw: stored.isSelfDraw,
      seatWind,
      roundWind,
      flowerCount: stored.flowerCount,
      winningTile: stored.winningTileCode ? tileFromCode(stored.winningTileCode) : null,
      isLastTile: stored.isLastTile,
      isKongDraw: stored.isKongDraw,
      isRobbingKong: stored.isRobbingKong,
      isWinningTileLast: stored.isWinningTileLast,
      settingsOpen: stored.settingsOpen,
    };
  } catch (e) {
    return null;
  }
}
