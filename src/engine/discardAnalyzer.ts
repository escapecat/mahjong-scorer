import { TileSet } from './models/tileSet';
import { tileFromIndex, type Tile } from './models/tile';
import type { Meld } from './models/meld';
import type { GameContext, EvaluationResult } from './models/types';
import { isWinningHandWithMelds, subtractMelds } from './decomposer';
import { evaluate } from './evaluator';

export interface WinningTileInfo {
  tile: Tile;
  /** Copies theoretically remaining (4 minus your own copies; ignores table discards) */
  remaining: number;
  /** Score if you win on this tile */
  score: number;
}

export interface DiscardOption {
  discardTile: Tile;
  winningTiles: WinningTileInfo[];
  /** Sum of `remaining` across all winning tiles */
  totalRemaining: number;
  /** Number of distinct winning tile types */
  uniqueWaitCount: number;
  /** Highest possible score among winning tiles */
  maxScore: number;
}

/**
 * Analyze all possible discards from a 14-tile hand and rank by tenpai quality.
 *
 * @param allCounts - All 14 tiles (hand + meld tiles)
 * @param lockedMelds - Open melds (chi/peng/kong)
 * @param game - Game context (for scoring)
 */
export function analyzeDiscards(
  allCounts: TileSet,
  lockedMelds: readonly Meld[] | undefined | null,
  game: GameContext,
): DiscardOption[] {
  const safeMelds = lockedMelds ?? [];
  const handCounts = subtractMelds(allCounts, safeMelds);
  const results: DiscardOption[] = [];

  for (let i = 0; i < 34; i++) {
    if (handCounts.getByIndex(i) === 0) continue;
    const discardTile = tileFromIndex(i);

    const afterAll = allCounts.clone();
    afterAll.remove(discardTile);

    const winningTiles: WinningTileInfo[] = [];
    for (let j = 0; j < 34; j++) {
      const ownCopies = afterAll.getByIndex(j);
      if (ownCopies >= 4) continue;

      const test = afterAll.clone();
      test.add(tileFromIndex(j));
      if (!isWinningHandWithMelds(test, safeMelds)) continue;

      const winTile = tileFromIndex(j);
      let result: EvaluationResult;
      try {
        result = evaluate(test, safeMelds, { ...game, winningTile: winTile });
      } catch (e) {
        // Skip this winning-tile if evaluation throws (defensive — shouldn't happen)
        continue;
      }

      // Theoretical max remaining = 4 minus your own copies
      const remaining = Math.max(0, 4 - ownCopies);

      winningTiles.push({ tile: winTile, remaining, score: result.totalFan });
    }

    const totalRemaining = winningTiles.reduce((s, w) => s + w.remaining, 0);
    const maxScore = winningTiles.length > 0
      ? Math.max(...winningTiles.map(w => w.score))
      : 0;

    results.push({
      discardTile,
      winningTiles,
      totalRemaining,
      uniqueWaitCount: winningTiles.length,
      maxScore,
    });
  }

  results.sort((a, b) => {
    if (b.totalRemaining !== a.totalRemaining) return b.totalRemaining - a.totalRemaining;
    if (b.uniqueWaitCount !== a.uniqueWaitCount) return b.uniqueWaitCount - a.uniqueWaitCount;
    return b.maxScore - a.maxScore;
  });

  return results;
}
