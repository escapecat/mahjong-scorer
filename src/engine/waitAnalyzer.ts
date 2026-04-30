import { type Tile, tileIndex, tileFromIndex } from './models/tile';
import { TileSet } from './models/tileSet';
import { isWinningHandWithMelds } from './decomposer';
import type { Meld } from './models/meld';

export type WaitType = 'edge' | 'closed' | 'single';

/**
 * Counts how many distinct tiles complete the pre-draw 13-tile hand.
 * Used to gate the wait fans (单钓将/边张/坎张) which by 国标 only apply
 * when the wait is exactly 1 tile.
 *
 * `handCounts` is the 14-tile final hand (i.e. allCounts minus locked-meld tiles).
 * `winningTile` is the tile actually drawn — we subtract it to recover the 13-tile hand.
 */
export function countWinningTiles(
  handCounts: TileSet,
  lockedMelds: readonly Meld[],
  winningTile: Tile,
): number {
  const pre = handCounts.clone();
  pre.remove(winningTile);
  let count = 0;
  for (let i = 0; i < 34; i++) {
    if (pre.getByIndex(i) >= 4) continue;
    const t = tileFromIndex(i);
    pre.add(t);
    if (isWinningHandWithMelds(pre, lockedMelds)) count++;
    pre.remove(t);
    if (count > 1) return count; // early exit — caller only cares about ==1 vs >1
  }
  return count;
}

/**
 * Determines wait types for the winning tile across ALL valid decompositions.
 * Returns the intersection (AND) — a wait type only counts if it applies in every decomposition.
 */
export function getWaitTypes(handTiles: TileSet, winningTile: Tile): Set<WaitType> {
  const counts = [...handTiles.rawCounts()];
  const winIdx = tileIndex(winningTile);

  let result: Set<WaitType> | null = null;

  for (let i = 0; i < 34; i++) {
    if (counts[i] < 2) continue;

    counts[i] -= 2;
    const usage: Set<WaitType> = new Set();
    if (i === winIdx) usage.add('single');

    const branch = searchWaitTypes(counts, winIdx, usage);
    if (branch !== null) {
      if (result === null) {
        result = branch;
      } else {
        // Intersect
        for (const wt of result) {
          if (!branch.has(wt)) result.delete(wt);
        }
      }
    }
    counts[i] += 2;
  }

  return result ?? new Set();
}

function searchWaitTypes(
  counts: number[],
  winIdx: number,
  usage: Set<WaitType>,
): Set<WaitType> | null {
  let index = -1;
  for (let i = 0; i < 34; i++) {
    if (counts[i] > 0) { index = i; break; }
  }
  if (index === -1) return new Set(usage);

  let result: Set<WaitType> | null = null;

  // Try triplet
  if (counts[index] >= 3) {
    counts[index] -= 3;
    const branch = searchWaitTypes(counts, winIdx, usage);
    if (branch !== null) {
      result = result === null ? branch : intersect(result, branch);
    }
    counts[index] += 3;
  }

  // Try sequence
  if (index < 27 && index % 9 <= 6 && counts[index + 1] > 0 && counts[index + 2] > 0) {
    counts[index]--;
    counts[index + 1]--;
    counts[index + 2]--;

    const nextUsage = new Set(usage);
    if (winIdx === index + 1) {
      nextUsage.add('closed');
    } else if (
      (winIdx === index + 2 && index % 9 === 0) ||
      (winIdx === index && index % 9 === 6)
    ) {
      nextUsage.add('edge');
    }

    const branch = searchWaitTypes(counts, winIdx, nextUsage);
    if (branch !== null) {
      result = result === null ? branch : intersect(result, branch);
    }

    counts[index]++;
    counts[index + 1]++;
    counts[index + 2]++;
  }

  return result;
}

function intersect(a: Set<WaitType>, b: Set<WaitType>): Set<WaitType> {
  const result = new Set<WaitType>();
  for (const wt of a) {
    if (b.has(wt)) result.add(wt);
  }
  return result;
}
