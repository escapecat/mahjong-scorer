import { TileSet } from '../../engine/models/tileSet';
import { tileFromIndex, type Tile, Tiles } from '../../engine/models/tile';
import { createGameContext, type GameContext, type EvaluationResult } from '../../engine/models/types';
import { evaluate } from '../../engine/evaluator';
import { ALL_FANS } from '../../engine/fanData';

export interface PracticeQuestion {
  counts: TileSet;            // 14 tiles forming a winning hand
  game: GameContext;
  result: EvaluationResult;
  options: FanOption[];        // Multiple choice options
  correctFanNames: Set<string>;
}

export interface FanOption {
  name: string;
  points: number;
  isCorrect: boolean;
}

const ALL_FAN_DATA = new Map(ALL_FANS.map(f => [f.name, f]));

function randInt(max: number): number {
  return Math.floor(Math.random() * max);
}

function pickRandomWind(): Tile {
  return [Tiles.East, Tiles.South, Tiles.West, Tiles.North][randInt(4)];
}

/**
 * Generate a random valid 14-tile winning hand by building backwards:
 * pick a pair, then 4 melds (random sequences/triplets), respecting tile-count limits.
 */
function generateValidHand(): TileSet | null {
  for (let attempt = 0; attempt < 200; attempt++) {
    const counts = new Array(34).fill(0);

    // Pick a pair
    const pairIdx = randInt(34);
    counts[pairIdx] = 2;

    // Build 4 melds
    let melds = 0;
    let inner = 0;
    while (melds < 4 && inner < 50) {
      inner++;
      const isSequence = Math.random() < 0.6;

      if (isSequence) {
        // Random suit (0-2) + rank (0-6) for valid sequence
        const suit = randInt(3);
        const rank = randInt(7);
        const start = suit * 9 + rank;
        if (counts[start] < 4 && counts[start + 1] < 4 && counts[start + 2] < 4) {
          counts[start]++;
          counts[start + 1]++;
          counts[start + 2]++;
          melds++;
        }
      } else {
        // Triplet — any of 34 tiles
        const idx = randInt(34);
        if (counts[idx] + 3 <= 4) {
          counts[idx] += 3;
          melds++;
        }
      }
    }

    if (melds === 4 && counts.reduce((a, b) => a + b, 0) === 14) {
      return TileSet.fromCounts(counts);
    }
  }
  return null;
}

/** Generate a random game context */
function generateGameContext(counts: TileSet): GameContext {
  // Pick a random tile from the hand as the winning tile
  const tiles: Tile[] = [];
  for (let i = 0; i < 34; i++) {
    for (let j = 0; j < counts.getByIndex(i); j++) {
      tiles.push(tileFromIndex(i));
    }
  }
  const winningTile = tiles[randInt(tiles.length)];

  return createGameContext({
    isSelfDraw: Math.random() < 0.6,
    winningTile,
    seatWind: pickRandomWind(),
    roundWind: pickRandomWind(),
    flowerCount: Math.random() < 0.3 ? randInt(4) : 0,
    isLastTile: Math.random() < 0.1,
    isKongDraw: false,
    isRobbingKong: false,
    isWinningTileLast: Math.random() < 0.1,
  });
}

/** Pick distractor fans — plausible-looking but wrong answers */
function pickDistractors(correctFanNames: Set<string>, count: number): string[] {
  const allNames = ALL_FANS.map(f => f.name).filter(n => !correctFanNames.has(n));
  const shuffled = [...allNames].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/** Generate a complete practice question */
export function generateQuestion(): PracticeQuestion | null {
  for (let attempt = 0; attempt < 20; attempt++) {
    const counts = generateValidHand();
    if (!counts) continue;

    const game = generateGameContext(counts);
    const result = evaluate(counts, [], game);
    if (result.totalFan === 0) continue;

    // Filter fans: only include named fans (not 花牌 which has dynamic name)
    const correctFans = result.fans
      .filter(f => !f.name.startsWith('花牌'))
      .filter(f => ALL_FAN_DATA.has(f.name));

    if (correctFans.length === 0) continue;

    // Deduplicate (e.g., 幺九刻 might appear multiple times)
    const correctFanNames = new Set(correctFans.map(f => f.name));

    // Build options: correct fans + 4 distractors
    const distractors = pickDistractors(correctFanNames, 4);
    const optionNames = [...correctFanNames, ...distractors];

    const options: FanOption[] = optionNames
      .map(name => {
        const data = ALL_FAN_DATA.get(name);
        return {
          name,
          points: data?.points ?? 0,
          isCorrect: correctFanNames.has(name),
        };
      })
      .sort(() => Math.random() - 0.5);

    return { counts, game, result, options, correctFanNames };
  }
  return null;
}
