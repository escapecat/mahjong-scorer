import { TileSet } from './models/tileSet';

/**
 * Calculate the minimum shanten number across all hand forms.
 * -1 = complete, 0 = tenpai, 1 = iishanten, etc.
 * counts = free hand tiles only (meld tiles subtracted), meldCount = locked melds.
 */
export function calculateShanten(handTiles: TileSet, meldCount: number): number {
  const counts = [...handTiles.rawCounts()];

  let best = calculateStandard(counts, meldCount);

  if (meldCount === 0) {
    best = Math.min(best, calculateSevenPairs(counts));
    best = Math.min(best, calculateThirteenOrphans(counts));
  }

  return best;
}

function calculateStandard(counts: number[], meldCount: number): number {
  const work = [...counts];
  const neededMelds = 4 - meldCount;
  const ref = { best: 8 };

  searchStandard(work, 0, neededMelds, 0, 0, false, ref);

  return ref.best;

  function searchStandard(
    c: number[], startIndex: number,
    needed: number, mentsu: number, taatsu: number, hasPair: boolean,
    ref: { best: number },
  ): void {
    const current = (needed - mentsu) * 2 - taatsu - (hasPair ? 1 : 0);
    ref.best = Math.min(ref.best, current);

    if (ref.best <= -1) return;

    for (let i = startIndex; i < 34; i++) {
      if (c[i] === 0) continue;

      // Try pair
      if (!hasPair && c[i] >= 2) {
        c[i] -= 2;
        searchStandard(c, i, needed, mentsu, taatsu, true, ref);
        c[i] += 2;
      }

      // Try triplet
      if (c[i] >= 3) {
        c[i] -= 3;
        searchStandard(c, i, needed, mentsu + 1, taatsu, hasPair, ref);
        c[i] += 3;
      }

      // Try sequence
      if (i < 27 && i % 9 <= 6 && c[i + 1] > 0 && c[i + 2] > 0) {
        c[i]--; c[i + 1]--; c[i + 2]--;
        searchStandard(c, i, needed, mentsu + 1, taatsu, hasPair, ref);
        c[i]++; c[i + 1]++; c[i + 2]++;
      }

      // Try partial groups
      if (mentsu + taatsu < needed + (hasPair ? 0 : 1)) {
        // Pair as taatsu
        if (hasPair && c[i] >= 2) {
          c[i] -= 2;
          searchStandard(c, i + 1, needed, mentsu, taatsu + 1, hasPair, ref);
          c[i] += 2;
        }

        // Adjacent pair (e.g., 23)
        if (i < 27 && i % 9 <= 7 && c[i + 1] > 0) {
          c[i]--; c[i + 1]--;
          searchStandard(c, i, needed, mentsu, taatsu + 1, hasPair, ref);
          c[i]++; c[i + 1]++;
        }

        // Gap pair (e.g., 24)
        if (i < 27 && i % 9 <= 6 && c[i + 2] > 0) {
          c[i]--; c[i + 2]--;
          searchStandard(c, i, needed, mentsu, taatsu + 1, hasPair, ref);
          c[i]++; c[i + 2]++;
        }
      }

      // Skip this tile (treat as isolated/unused) and explore later tiles
      searchStandard(c, i + 1, needed, mentsu, taatsu, hasPair, ref);

      break;
    }
  }
}

function calculateSevenPairs(counts: number[]): number {
  let pairs = 0;
  let kinds = 0;
  for (let i = 0; i < 34; i++) {
    if (counts[i] >= 2) pairs++;
    if (counts[i] > 0) kinds++;
  }

  let shanten = 6 - pairs;
  if (kinds < 7) shanten += 7 - kinds;
  return shanten;
}

const ORPHAN_INDICES = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];

function calculateThirteenOrphans(counts: number[]): number {
  let uniqueCount = 0;
  let hasPair = false;
  for (const idx of ORPHAN_INDICES) {
    if (counts[idx] > 0) {
      uniqueCount++;
      if (counts[idx] >= 2) hasPair = true;
    }
  }

  return 13 - uniqueCount - (hasPair ? 1 : 0);
}
