import type { Tile } from './tile';
import type { Meld, HandDecomposition } from './meld';
import type { TileSet } from './tileSet';

// ── Fan Rule interfaces ──

export interface FanRule {
  readonly name: string;
  readonly points: number;
  readonly description: string;
  readonly excludes: readonly string[];

  /** 0 = no match, 1+ = number of times the fan applies */
  match(ctx: FanContext): number;
}

export interface FanContext {
  readonly allCounts: TileSet;
  readonly handCounts: TileSet;
  readonly decomposition: HandDecomposition;
  readonly game: GameContext;
}

export interface GameContext {
  readonly isSelfDraw: boolean;
  readonly winningTile: Tile | null;
  readonly seatWind: Tile;
  readonly roundWind: Tile;
  readonly flowerCount: number;
  readonly isLastTile: boolean;
  readonly isKongDraw: boolean;
  readonly isRobbingKong: boolean;
  readonly isWinningTileLast: boolean;
  readonly mingKongCount: number;
  readonly anKongCount: number;
  readonly chiCount: number;
  readonly pengCount: number;

  // Derived
  readonly kongCount: number;
  readonly hasOpenMeld: boolean;
  readonly totalMeldCount: number;
  readonly totalOpenMeldCount: number;
}

export function createGameContext(opts: {
  isSelfDraw?: boolean;
  winningTile?: Tile | null;
  seatWind?: Tile;
  roundWind?: Tile;
  flowerCount?: number;
  isLastTile?: boolean;
  isKongDraw?: boolean;
  isRobbingKong?: boolean;
  isWinningTileLast?: boolean;
  mingKongCount?: number;
  anKongCount?: number;
  chiCount?: number;
  pengCount?: number;
}): GameContext {
  const chiCount = opts.chiCount ?? 0;
  const pengCount = opts.pengCount ?? 0;
  const mingKongCount = opts.mingKongCount ?? 0;
  const anKongCount = opts.anKongCount ?? 0;

  return {
    isSelfDraw: opts.isSelfDraw ?? true,
    winningTile: opts.winningTile ?? null,
    seatWind: opts.seatWind ?? { suit: 'wind', rank: 0 },
    roundWind: opts.roundWind ?? { suit: 'wind', rank: 0 },
    flowerCount: opts.flowerCount ?? 0,
    isLastTile: opts.isLastTile ?? false,
    isKongDraw: opts.isKongDraw ?? false,
    isRobbingKong: opts.isRobbingKong ?? false,
    isWinningTileLast: opts.isWinningTileLast ?? false,
    mingKongCount,
    anKongCount,
    chiCount,
    pengCount,
    kongCount: mingKongCount + anKongCount,
    hasOpenMeld: chiCount > 0 || pengCount > 0 || mingKongCount > 0,
    totalMeldCount: chiCount + pengCount + mingKongCount + anKongCount,
    totalOpenMeldCount: chiCount + pengCount + mingKongCount,
  };
}

// ── Special Hand Rule ──

export interface SpecialHandRule {
  readonly name: string;

  isMatch(counts: TileSet, game: GameContext): boolean;

  evaluate(counts: TileSet, game: GameContext): SpecialHandResult | null;
}

export interface SpecialHandResult {
  readonly fans: Array<{ name: string; points: number; description: string }>;
  readonly tileGroups: Tile[][];
  readonly description: string;
  /** Which standard fan rules to also check (e.g., tile property fans for 七对) */
  readonly additionalRuleFilter?: (rule: FanRule) => boolean;
}

// ── Evaluation Result ──

export interface EvaluationResult {
  totalFan: number;
  fans: Array<{ name: string; points: number; description: string }>;
  decompositionDescription: string;
  tileGroups: Tile[][];
  winningTileGroupIndex: number;
}
