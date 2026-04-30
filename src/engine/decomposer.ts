import { tileFromIndex } from './models/tile';
import { sequence, triplet, kong, type Meld, type HandDecomposition } from './models/meld';
import { TileSet } from './models/tileSet';

/**
 * Enumerate all valid pair + melds decompositions.
 * handTiles = hand tiles only (locked meld tiles already subtracted).
 * lockedMelds = fixed melds (chi/peng/kong).
 */
export function decomposeHand(
  handTiles: TileSet,
  lockedMelds: readonly Meld[] = [],
): HandDecomposition[] {
  const results: HandDecomposition[] = [];
  const counts = [...handTiles.rawCounts()];
  const remaining = counts.reduce((a, b) => a + b, 0);

  if (remaining < 2) return results;

  for (let i = 0; i < 34; i++) {
    if (counts[i] < 2) continue;

    counts[i] -= 2;
    const handMelds: Meld[] = [];
    decomposeRecursive(counts, handMelds, results, lockedMelds, tileFromIndex(i));
    counts[i] += 2;
  }

  return results;
}

function decomposeRecursive(
  counts: number[],
  currentMelds: Meld[],
  results: HandDecomposition[],
  lockedMelds: readonly Meld[],
  pair: import('./models/tile').Tile,
): void {
  // Find first tile with count > 0
  let index = -1;
  for (let i = 0; i < 34; i++) {
    if (counts[i] > 0) { index = i; break; }
  }

  if (index === -1) {
    // All tiles consumed — valid decomposition
    results.push({
      pair,
      melds: [...lockedMelds, ...currentMelds],
    });
    return;
  }

  const tile = tileFromIndex(index);

  // Try triplet
  if (counts[index] >= 3) {
    counts[index] -= 3;
    currentMelds.push(triplet(tile));
    decomposeRecursive(counts, currentMelds, results, lockedMelds, pair);
    currentMelds.pop();
    counts[index] += 3;
  }

  // Try kong (4 of a kind not declared as kong — rare but possible for 四归一)
  if (counts[index] >= 4) {
    counts[index] -= 4;
    currentMelds.push(kong(tile));
    decomposeRecursive(counts, currentMelds, results, lockedMelds, pair);
    currentMelds.pop();
    counts[index] += 4;
  }

  // Try sequence (number suits only, same suit)
  if (index < 27 && index % 9 <= 6) {
    if (counts[index + 1] > 0 && counts[index + 2] > 0) {
      counts[index]--;
      counts[index + 1]--;
      counts[index + 2]--;
      currentMelds.push(sequence(tile));
      decomposeRecursive(counts, currentMelds, results, lockedMelds, pair);
      currentMelds.pop();
      counts[index]++;
      counts[index + 1]++;
      counts[index + 2]++;
    }
  }
}

/**
 * Check if a set of tiles can be decomposed into melds (no pair needed).
 * Used for win detection after removing a pair.
 */
export function canFormSets(counts: number[]): boolean {
  let index = -1;
  for (let i = 0; i < 34; i++) {
    if (counts[i] > 0) { index = i; break; }
  }
  if (index === -1) return true;

  // Try triplet
  if (counts[index] >= 3) {
    counts[index] -= 3;
    if (canFormSets(counts)) { counts[index] += 3; return true; }
    counts[index] += 3;
  }

  // Try quad
  if (counts[index] >= 4) {
    counts[index] -= 4;
    if (canFormSets(counts)) { counts[index] += 4; return true; }
    counts[index] += 4;
  }

  // Try sequence
  if (index < 27 && index % 9 <= 6 && counts[index + 1] > 0 && counts[index + 2] > 0) {
    counts[index]--;
    counts[index + 1]--;
    counts[index + 2]--;
    if (canFormSets(counts)) {
      counts[index]++;
      counts[index + 1]++;
      counts[index + 2]++;
      return true;
    }
    counts[index]++;
    counts[index + 1]++;
    counts[index + 2]++;
  }

  return false;
}

/**
 * Check if the given tile counts form a winning hand.
 * Supports standard form, seven pairs, and special hands.
 */
export function isWinningHand(counts: TileSet): boolean {
  const raw = [...counts.rawCounts()];
  const total = raw.reduce((a, b) => a + b, 0);
  if (total === 0) return false;

  // Seven pairs
  if (counts.isSevenPairs()) return true;

  // Thirteen orphans
  if (isThirteenOrphans(raw)) return true;

  // Seven star not connected / all not connected
  if (isSevenStarNotConnected(raw) || isAllNotConnected(raw)) return true;

  // Standard form: try each pair, check if remaining forms sets
  for (let i = 0; i < 34; i++) {
    if (raw[i] < 2) continue;
    raw[i] -= 2;
    if (canFormSets(raw)) { raw[i] += 2; return true; }
    raw[i] += 2;
  }

  return false;
}

/**
 * Check if hand is winning with locked melds.
 * Subtracts meld tiles from counts, then checks remaining tiles.
 */
export function isWinningHandWithMelds(
  allCounts: TileSet,
  melds: readonly Meld[],
): boolean {
  if (melds.length === 0) return isWinningHand(allCounts);

  const handCounts = subtractMelds(allCounts, melds);
  const remaining = handCounts.total();
  if (remaining < 2) return false;

  if (remaining === 2) {
    // Only pair remains
    const raw = handCounts.rawCounts();
    return raw.some(c => c === 2);
  }

  const raw = [...handCounts.rawCounts()];
  for (let i = 0; i < 34; i++) {
    if (raw[i] < 2) continue;
    raw[i] -= 2;
    if (canFormSets(raw)) { raw[i] += 2; return true; }
    raw[i] += 2;
  }

  return false;
}

/** Subtract locked meld tiles from counts (cap at 3 per meld for kongs) */
export function subtractMelds(counts: TileSet, melds: readonly Meld[]): TileSet {
  const result = counts.clone();
  for (const meld of melds) {
    const { type, start } = meld;
    if (type === 'sequence') {
      result.remove(start);
      result.remove({ suit: start.suit, rank: start.rank + 1 });
      result.remove({ suit: start.suit, rank: start.rank + 2 });
    } else {
      // Triplet or kong: subtract 3 (evaluation counts cap kongs at 3)
      result.remove(start, 3);
    }
  }
  return result;
}

// ── Special hand detection ──

const THIRTEEN_ORPHAN_INDICES = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];

function isThirteenOrphans(counts: number[]): boolean {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total !== 14) return false;

  let pairFound = false;
  for (let i = 0; i < 34; i++) {
    if (THIRTEEN_ORPHAN_INDICES.includes(i)) {
      if (counts[i] === 0) return false;
      if (counts[i] >= 2) {
        if (pairFound) return false;
        pairFound = true;
      }
      if (counts[i] > 2) return false;
    } else if (counts[i] > 0) {
      return false;
    }
  }
  return pairFound;
}

const UNRELATED_GROUPS = [[0, 3, 6], [1, 4, 7], [2, 5, 8]];

function isUnrelatedHand(counts: number[], requireAllGroups: boolean): boolean {
  let honorCount = 0;
  for (let i = 27; i < 34; i++) {
    if (counts[i] > 1) return false;
    if (counts[i] === 1) honorCount++;
  }

  if (requireAllGroups && honorCount !== 7) return false;
  if (!requireAllGroups && honorCount < 5) return false;

  let totalNumbers = 0;
  for (let i = 0; i < 27; i++) totalNumbers += counts[i];
  if (totalNumbers + honorCount !== 14) return false;

  const groupsPresent = new Set<number>();
  for (let suit = 0; suit < 3; suit++) {
    const base = suit * 9;
    const ranks: number[] = [];
    for (let i = 0; i < 9; i++) {
      if (counts[base + i] > 1) return false;
      if (counts[base + i] === 1) ranks.push(i);
    }
    if (ranks.length === 0) continue;

    const groupIdx = UNRELATED_GROUPS.findIndex(g => ranks.every(r => g.includes(r)));
    if (groupIdx < 0) return false;
    groupsPresent.add(groupIdx);
  }

  return !requireAllGroups || groupsPresent.size === 3;
}

function isSevenStarNotConnected(counts: number[]): boolean {
  return isUnrelatedHand(counts, true);
}

function isAllNotConnected(counts: number[]): boolean {
  return isUnrelatedHand(counts, false);
}

export { isThirteenOrphans, isSevenStarNotConnected, isAllNotConnected };
