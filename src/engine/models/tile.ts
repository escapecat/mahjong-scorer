export type Suit = 'man' | 'pin' | 'sou' | 'wind' | 'dragon';

export interface Tile {
  readonly suit: Suit;
  readonly rank: number;
}

const NUMBER_SUITS: ReadonlySet<Suit> = new Set(['man', 'pin', 'sou']);

// ── Tile index mapping ──

export function tileIndex(t: Tile): number {
  switch (t.suit) {
    case 'man': return t.rank;
    case 'pin': return 9 + t.rank;
    case 'sou': return 18 + t.rank;
    case 'wind': return 27 + t.rank;
    case 'dragon': return 31 + t.rank;
  }
}

export function tileFromIndex(i: number): Tile {
  if (i < 9) return { suit: 'man', rank: i };
  if (i < 18) return { suit: 'pin', rank: i - 9 };
  if (i < 27) return { suit: 'sou', rank: i - 18 };
  if (i < 31) return { suit: 'wind', rank: i - 27 };
  return { suit: 'dragon', rank: i - 31 };
}

// ── Tile properties ──

export function isNumberSuit(t: Tile): boolean {
  return NUMBER_SUITS.has(t.suit);
}

export function isTerminal(t: Tile): boolean {
  return isNumberSuit(t) && (t.rank === 0 || t.rank === 8);
}

export function isHonor(t: Tile): boolean {
  return t.suit === 'wind' || t.suit === 'dragon';
}

export function isTerminalOrHonor(t: Tile): boolean {
  return isTerminal(t) || isHonor(t);
}

export function isSimple(t: Tile): boolean {
  return isNumberSuit(t) && t.rank > 0 && t.rank < 8;
}

export function isGreenTile(t: Tile): boolean {
  if (t.suit === 'dragon' && t.rank === 1) return true; // 发
  if (t.suit === 'sou') return [1, 2, 3, 5, 7].includes(t.rank); // 23468s (rank 1-based: 0-indexed)
  return false;
}

// ── Tile equality & comparison ──

export function tileEquals(a: Tile, b: Tile): boolean {
  return a.suit === b.suit && a.rank === b.rank;
}

export function tileCompare(a: Tile, b: Tile): number {
  return tileIndex(a) - tileIndex(b);
}

// ── Tile display ──

const SUIT_DISPLAY: Record<string, string> = {
  man: '万', pin: '筒', sou: '条',
};

const WIND_DISPLAY = ['东', '南', '西', '北'];
const DRAGON_DISPLAY = ['中', '发', '白'];

const WIND_CODES = ['E', 'S', 'W', 'N'];
const DRAGON_CODES = ['C', 'F', 'P'];

export function tileToCode(t: Tile): string {
  if (t.suit === 'wind') return WIND_CODES[t.rank];
  if (t.suit === 'dragon') return DRAGON_CODES[t.rank];
  return `${t.rank + 1}${t.suit[0]}`;
}

export function tileFromCode(code: string): Tile | null {
  if (code.length === 1) {
    const wi = WIND_CODES.indexOf(code);
    if (wi >= 0) return tile('wind', wi);
    const di = DRAGON_CODES.indexOf(code);
    if (di >= 0) return tile('dragon', di);
    return null;
  }
  if (code.length === 2) {
    const rank = parseInt(code[0]) - 1;
    if (rank < 0 || rank > 8) return null;
    const suitChar = code[1];
    if (suitChar === 'm') return tile('man', rank);
    if (suitChar === 'p') return tile('pin', rank);
    if (suitChar === 's') return tile('sou', rank);
  }
  return null;
}

export function tileToDisplay(t: Tile): string {
  if (t.suit === 'wind') return WIND_DISPLAY[t.rank];
  if (t.suit === 'dragon') return DRAGON_DISPLAY[t.rank];
  return `${t.rank + 1}${SUIT_DISPLAY[t.suit]}`;
}

export function suitToDisplay(suit: Suit): string {
  return SUIT_DISPLAY[suit] ?? suit;
}

// ── Tile factory ──

export function tile(suit: Suit, rank: number): Tile {
  return { suit, rank };
}

// ── Pre-built constants ──

export const Tiles = {
  man: (r: number) => tile('man', r),
  pin: (r: number) => tile('pin', r),
  sou: (r: number) => tile('sou', r),
  wind: (r: number) => tile('wind', r),
  dragon: (r: number) => tile('dragon', r),
  East: tile('wind', 0),
  South: tile('wind', 1),
  West: tile('wind', 2),
  North: tile('wind', 3),
  Zhong: tile('dragon', 0),
  Fa: tile('dragon', 1),
  Bai: tile('dragon', 2),
} as const;

/** All 13 terminal/honor tiles */
export const TERMINAL_HONOR_TILES: readonly Tile[] = [
  tile('man', 0), tile('man', 8),
  tile('pin', 0), tile('pin', 8),
  tile('sou', 0), tile('sou', 8),
  Tiles.East, Tiles.South, Tiles.West, Tiles.North,
  Tiles.Zhong, Tiles.Fa, Tiles.Bai,
];

/** Suit permutations for cross-suit pattern matching */
export const SUIT_PERMUTATIONS: readonly [Suit, Suit, Suit][] = [
  ['man', 'pin', 'sou'], ['man', 'sou', 'pin'],
  ['pin', 'man', 'sou'], ['pin', 'sou', 'man'],
  ['sou', 'man', 'pin'], ['sou', 'pin', 'man'],
];

export const NUMBER_SUIT_LIST: readonly Suit[] = ['man', 'pin', 'sou'];
