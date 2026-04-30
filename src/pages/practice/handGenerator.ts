import { TileSet } from '../../engine/models/tileSet';
import { tileFromIndex, type Tile, Tiles } from '../../engine/models/tile';
import { createGameContext, type GameContext, type EvaluationResult } from '../../engine/models/types';
import { evaluate } from '../../engine/evaluator';
import { isWinningHand } from '../../engine/decomposer';
import { ALL_FANS } from '../../engine/fanData';

export interface FanPickQuestion {
  kind: 'fanPick';
  counts: TileSet;
  game: GameContext;
  result: EvaluationResult;
  options: FanOption[];
  correctFanNames: Set<string>;
}

export interface FanCountQuestion {
  kind: 'fanCount';
  counts: TileSet;
  game: GameContext;
  result: EvaluationResult;
  choices: number[];
  correctIndex: number;
}

export interface WaitTileQuestion {
  kind: 'waitTile';
  /** 13 tiles in tenpai */
  counts: TileSet;
  game: Omit<GameContext, 'winningTile'>;
  /** All valid winning tile indices */
  correctTileIndices: Set<number>;
  /** Candidate tiles (correct + distractors) shown to user */
  candidateTiles: Tile[];
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
 * Generate a random valid 14-tile winning hand by build-backwards approach.
 */
function generateValidHand(): TileSet | null {
  for (let attempt = 0; attempt < 200; attempt++) {
    const counts = new Array(34).fill(0);
    const pairIdx = randInt(34);
    counts[pairIdx] = 2;

    let melds = 0;
    let inner = 0;
    while (melds < 4 && inner < 50) {
      inner++;
      const isSequence = Math.random() < 0.6;

      if (isSequence) {
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

function generateGameContext(counts: TileSet): GameContext {
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

function pickDistractors(correctNames: Set<string>, count: number): string[] {
  const names = ALL_FANS.map(f => f.name).filter(n => !correctNames.has(n));
  const shuffled = [...names].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ── Mode C: Pick fans ──
export function generateFanPickQuestion(): FanPickQuestion | null {
  for (let attempt = 0; attempt < 20; attempt++) {
    const counts = generateValidHand();
    if (!counts) continue;

    const game = generateGameContext(counts);
    const result = evaluate(counts, [], game);
    if (result.totalFan === 0) continue;

    const correctFans = result.fans
      .filter(f => !f.name.startsWith('花牌'))
      .filter(f => ALL_FAN_DATA.has(f.name));
    if (correctFans.length === 0) continue;

    const correctFanNames = new Set(correctFans.map(f => f.name));
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

    return { kind: 'fanPick', counts, game, result, options, correctFanNames };
  }
  return null;
}

// ── Mode A: Guess fan count ──
export function generateFanCountQuestion(): FanCountQuestion | null {
  for (let attempt = 0; attempt < 20; attempt++) {
    const counts = generateValidHand();
    if (!counts) continue;

    const game = generateGameContext(counts);
    const result = evaluate(counts, [], game);
    if (result.totalFan === 0) continue;

    const correct = result.totalFan;
    // Generate 3 plausible distractors: off by ±2~10
    const distractors = new Set<number>();
    while (distractors.size < 3) {
      const offset = (randInt(8) + 2) * (Math.random() < 0.5 ? -1 : 1);
      const v = correct + offset;
      if (v > 0 && v !== correct && !distractors.has(v)) {
        distractors.add(v);
      }
    }
    const choices = [...distractors, correct].sort(() => Math.random() - 0.5);
    const correctIndex = choices.indexOf(correct);

    return { kind: 'fanCount', counts, game, result, choices, correctIndex };
  }
  return null;
}

// ── Mode B: Guess winning tile ──
export function generateWaitTileQuestion(): WaitTileQuestion | null {
  for (let attempt = 0; attempt < 30; attempt++) {
    const fullCounts = generateValidHand();
    if (!fullCounts) continue;

    // Pick a random tile to remove → 13-tile tenpai
    const tilesInHand: number[] = [];
    for (let i = 0; i < 34; i++) {
      for (let j = 0; j < fullCounts.getByIndex(i); j++) {
        tilesInHand.push(i);
      }
    }
    const removeIdx = tilesInHand[randInt(tilesInHand.length)];

    const tenpaiCounts = fullCounts.clone();
    tenpaiCounts.remove(tileFromIndex(removeIdx));

    // Find ALL valid winning tiles
    const correctTileIndices = new Set<number>();
    const raw = [...tenpaiCounts.rawCounts()];
    for (let i = 0; i < 34; i++) {
      if (raw[i] >= 4) continue;
      raw[i]++;
      if (isWinningHand(TileSet.fromCounts(raw))) {
        correctTileIndices.add(i);
      }
      raw[i]--;
    }

    if (correctTileIndices.size === 0) continue;

    // Pick distractors: tiles that are NOT valid waits
    const distractors: number[] = [];
    const tries = new Set<number>();
    while (distractors.length < 4 && tries.size < 34) {
      const idx = randInt(34);
      if (tries.has(idx)) continue;
      tries.add(idx);
      if (correctTileIndices.has(idx)) continue;
      distractors.push(idx);
    }

    const candidateIndices = [...correctTileIndices, ...distractors].sort(() => Math.random() - 0.5);
    const candidateTiles = candidateIndices.map(i => tileFromIndex(i));

    const game: Omit<GameContext, 'winningTile'> = {
      isSelfDraw: Math.random() < 0.6,
      seatWind: pickRandomWind(),
      roundWind: pickRandomWind(),
      flowerCount: 0,
      isLastTile: false,
      isKongDraw: false,
      isRobbingKong: false,
      isWinningTileLast: false,
      mingKongCount: 0,
      anKongCount: 0,
      chiCount: 0,
      pengCount: 0,
      kongCount: 0,
      hasOpenMeld: false,
      totalMeldCount: 0,
      totalOpenMeldCount: 0,
    };

    return { kind: 'waitTile', counts: tenpaiCounts, game, correctTileIndices, candidateTiles };
  }
  return null;
}
