import { TileSet } from './models/tileSet';
import { tileFromIndex, type Tile } from './models/tile';
import type { Meld } from './models/meld';
import type { GameContext, EvaluationResult } from './models/types';
import { isWinningHandWithMelds, subtractMelds } from './decomposer';
import { evaluate } from './evaluator';

export interface WinningTileInfo {
  tile: Tile;
  /** Copies still potentially available (4 - your copies - known discards) */
  remaining: number;
  /** Score if you win on this tile */
  score: number;
}

export interface DiscardOption {
  discardTile: Tile;
  winningTiles: WinningTileInfo[];
  /** Sum of `remaining` across all winning tiles — actual playable wait count */
  totalRemaining: number;
  /** Number of distinct winning tile types — theoretical wait variety */
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
 * @param knownDiscards - Optional: tiles already seen on the table
 *                       (so 'remaining' reflects actually-available tiles)
 */
export function analyzeDiscards(
  allCounts: TileSet,
  lockedMelds: readonly Meld[],
  game: GameContext,
  knownDiscards?: TileSet,
): DiscardOption[] {
  const handCounts = subtractMelds(allCounts, lockedMelds);
  const results: DiscardOption[] = [];

  for (let i = 0; i < 34; i++) {
    if (handCounts.getByIndex(i) === 0) continue;
    const discardTile = tileFromIndex(i);

    // Simulate discarding this tile
    const afterAll = allCounts.clone();
    afterAll.remove(discardTile);

    // Find all potential winning tiles
    const winningTiles: WinningTileInfo[] = [];
    for (let j = 0; j < 34; j++) {
      const ownCopies = afterAll.getByIndex(j);
      if (ownCopies >= 4) continue;

      // Try adding tile j as the winning tile
      const test = afterAll.clone();
      test.add(tileFromIndex(j));
      if (!isWinningHandWithMelds(test, [...lockedMelds])) continue;

      // Compute score with this winning tile
      const winTile = tileFromIndex(j);
      const result: EvaluationResult = evaluate(
        test,
        [...lockedMelds],
        { ...game, winningTile: winTile },
      );

      // Calculate "remaining" = 4 - own copies - known discards
      const knownCount = knownDiscards?.getByIndex(j) ?? 0;
      const remaining = Math.max(0, 4 - ownCopies - knownCount);

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

  // Sort: first by total remaining desc (more live tiles = better),
  // then by unique wait count, then by max score
  results.sort((a, b) => {
    if (b.totalRemaining !== a.totalRemaining) return b.totalRemaining - a.totalRemaining;
    if (b.uniqueWaitCount !== a.uniqueWaitCount) return b.uniqueWaitCount - a.uniqueWaitCount;
    return b.maxScore - a.maxScore;
  });

  return results;
}
