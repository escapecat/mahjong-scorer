import { tile, tileFromCode, Tiles, type Tile } from '../models/tile';
import { TileSet } from '../models/tileSet';
import { type Meld, sequence, triplet, kong } from '../models/meld';
import { createGameContext, type GameContext } from '../models/types';
import { evaluate } from '../evaluator';
import type { EvaluationResult } from '../models/types';

/** Parse a hand string like "111m456p789sEEE" into a TileSet */
export function parseTiles(s: string): TileSet {
  const ts = new TileSet();
  let digits: number[] = [];

  for (const ch of s) {
    if (ch >= '0' && ch <= '9') {
      digits.push(parseInt(ch));
    } else if (ch === 'm' || ch === 'p' || ch === 's') {
      const suit = ch === 'm' ? 'man' : ch === 'p' ? 'pin' : 'sou';
      for (const d of digits) ts.add(tile(suit as any, d - 1));
      digits = [];
    } else if (ch === 'E') { ts.add(Tiles.East); }
    else if (ch === 'S') { ts.add(Tiles.South); }
    else if (ch === 'W') { ts.add(Tiles.West); }
    else if (ch === 'N') { ts.add(Tiles.North); }
    else if (ch === 'C') { ts.add(Tiles.Zhong); }
    else if (ch === 'F') { ts.add(Tiles.Fa); }
    else if (ch === 'P') { ts.add(Tiles.Bai); }
  }
  return ts;
}

/** Quick evaluate with a string-based API */
export function quickEvaluate(opts: {
  hand: string;
  melds?: Meld[];
  winningTile?: string;
  game?: Partial<Parameters<typeof createGameContext>[0]>;
}): EvaluationResult {
  const allCounts = parseTiles(opts.hand);

  // Add meld tiles to allCounts
  if (opts.melds) {
    for (const m of opts.melds) {
      if (m.type === 'sequence') {
        allCounts.add(m.start);
        allCounts.add(tile(m.start.suit, m.start.rank + 1));
        allCounts.add(tile(m.start.suit, m.start.rank + 2));
      } else if (m.type === 'triplet') {
        allCounts.add(m.start, 3);
      } else {
        allCounts.add(m.start, 3); // Kong contributes 3 to evaluation counts
      }
    }
  }

  let winTile: Tile | null = null;
  if (opts.winningTile) {
    winTile = tileFromCode(opts.winningTile);
  }

  const gameOpts = opts.game ?? {};
  const chiCount = opts.melds?.filter(m => m.type === 'sequence' && m.isOpen).length ?? gameOpts.chiCount ?? 0;
  const pengCount = opts.melds?.filter(m => m.type === 'triplet' && m.isOpen).length ?? gameOpts.pengCount ?? 0;
  const mingKongCount = opts.melds?.filter(m => m.type === 'kong' && m.isOpen).length ?? gameOpts.mingKongCount ?? 0;
  const anKongCount = opts.melds?.filter(m => m.type === 'kong' && !m.isOpen).length ?? gameOpts.anKongCount ?? 0;

  const game = createGameContext({
    ...gameOpts,
    winningTile: winTile ?? undefined,
    chiCount,
    pengCount,
    mingKongCount,
    anKongCount,
  });

  return evaluate(allCounts, opts.melds ?? [], game);
}

export function hasFan(result: EvaluationResult, name: string): boolean {
  return result.fans.some(f => f.name === name);
}

export function fanCount(result: EvaluationResult, name: string): number {
  return result.fans.filter(f => f.name === name).length;
}
