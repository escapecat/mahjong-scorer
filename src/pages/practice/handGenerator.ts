import { TileSet } from '../../engine/models/tileSet';
import { tileFromIndex, type Tile, Tiles } from '../../engine/models/tile';
import { sequence, triplet, type Meld } from '../../engine/models/meld';
import { createGameContext, type GameContext, type EvaluationResult } from '../../engine/models/types';
import { evaluate } from '../../engine/evaluator';
import { isWinningHandWithMelds } from '../../engine/decomposer';
import { ALL_FANS } from '../../engine/fanData';

export interface FanPickQuestion {
  kind: 'fanPick';
  counts: TileSet;       // all tiles (hand + meld)
  handCounts: TileSet;   // concealed hand only (for display)
  lockedMelds: Meld[];   // open melds (for display)
  game: GameContext;
  result: EvaluationResult;
  options: FanOption[];
  correctFanNames: Set<string>;
}

export interface FanCountQuestion {
  kind: 'fanCount';
  counts: TileSet;
  handCounts: TileSet;
  lockedMelds: Meld[];
  game: GameContext;
  result: EvaluationResult;
  choices: number[];
  correctIndex: number;
}

export interface WaitTileQuestion {
  kind: 'waitTile';
  /** 13 tiles total (hand + meld) in tenpai */
  counts: TileSet;
  /** Concealed hand portion (13 - 3*meldCount tiles) */
  handCounts: TileSet;
  lockedMelds: Meld[];
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

/** Fans that shouldn't appear as practice options — they're automatic, not chosen */
const EXCLUDED_FROM_PRACTICE = new Set(['花牌', '无番和']);
const PRACTICE_FANS = ALL_FANS.filter(f => !EXCLUDED_FROM_PRACTICE.has(f.name));

function randInt(max: number): number {
  return Math.floor(Math.random() * max);
}

function pickRandomWind(): Tile {
  return [Tiles.East, Tiles.South, Tiles.West, Tiles.North][randInt(4)];
}

interface GeneratedHand {
  fullCounts: TileSet;        // all 14 tiles (hand + melds)
  handCounts: TileSet;        // concealed hand portion only
  lockedMelds: Meld[];        // open chi/peng melds
  chiCount: number;
  pengCount: number;
}

/**
 * Generate a random valid 14-tile winning hand. Optionally includes open melds
 * (chi/peng) to mimic real game scenarios.
 */
function generateValidHand(): GeneratedHand | null {
  for (let attempt = 0; attempt < 200; attempt++) {
    // 50% concealed, 30% 1 open meld, 15% 2 open melds, 5% 3 open melds
    const r = Math.random();
    const openMeldTarget = r < 0.5 ? 0 : r < 0.8 ? 1 : r < 0.95 ? 2 : 3;

    const counts = new Array(34).fill(0);
    const lockedMelds: Meld[] = [];
    let chiCount = 0;
    let pengCount = 0;

    // Place pair
    const pairIdx = randInt(34);
    counts[pairIdx] = 2;

    let melds = 0;
    let inner = 0;
    while (melds < 4 && inner < 80) {
      inner++;
      const isSequence = Math.random() < 0.6;
      const isOpen = melds < openMeldTarget;

      if (isSequence) {
        const suit = randInt(3);
        const rank = randInt(7);
        const start = suit * 9 + rank;
        if (counts[start] < 4 && counts[start + 1] < 4 && counts[start + 2] < 4) {
          counts[start]++;
          counts[start + 1]++;
          counts[start + 2]++;
          if (isOpen) {
            lockedMelds.push(sequence(tileFromIndex(start), true));
            chiCount++;
          }
          melds++;
        }
      } else {
        const idx = randInt(34);
        if (counts[idx] + 3 <= 4) {
          counts[idx] += 3;
          if (isOpen) {
            lockedMelds.push(triplet(tileFromIndex(idx), true));
            pengCount++;
          }
          melds++;
        }
      }
    }

    if (melds === 4 && counts.reduce((a, b) => a + b, 0) === 14) {
      const fullCounts = TileSet.fromCounts(counts);

      // Build handCounts = fullCounts - lockedMeld tiles
      const handRaw = [...counts];
      for (const m of lockedMelds) {
        if (m.type === 'sequence') {
          handRaw[m.start.suit === 'man' ? m.start.rank
            : m.start.suit === 'pin' ? 9 + m.start.rank
            : 18 + m.start.rank]--;
          const next1 = m.start.suit === 'man' ? m.start.rank + 1
            : m.start.suit === 'pin' ? 10 + m.start.rank
            : 19 + m.start.rank;
          handRaw[next1]--;
          handRaw[next1 + 1]--;
        } else {
          // triplet
          const idx = m.start.suit === 'man' ? m.start.rank
            : m.start.suit === 'pin' ? 9 + m.start.rank
            : m.start.suit === 'sou' ? 18 + m.start.rank
            : m.start.suit === 'wind' ? 27 + m.start.rank
            : 31 + m.start.rank;
          handRaw[idx] -= 3;
        }
      }
      const handCounts = TileSet.fromCounts(handRaw);

      return { fullCounts, handCounts, lockedMelds, chiCount, pengCount };
    }
  }
  return null;
}

function generateGameContext(handCounts: TileSet, chiCount: number, pengCount: number): GameContext {
  // Winning tile must come from concealed hand (it's the tile drawn/ron'd on)
  const tiles: Tile[] = [];
  for (let i = 0; i < 34; i++) {
    for (let j = 0; j < handCounts.getByIndex(i); j++) {
      tiles.push(tileFromIndex(i));
    }
  }
  const winningTile = tiles.length > 0 ? tiles[randInt(tiles.length)] : Tiles.East;

  // If hand has open melds, can't be self-draw + 不求人 always; bias differently
  const hasOpen = chiCount + pengCount > 0;
  return createGameContext({
    isSelfDraw: hasOpen ? Math.random() < 0.5 : Math.random() < 0.6,
    winningTile,
    seatWind: pickRandomWind(),
    roundWind: pickRandomWind(),
    flowerCount: Math.random() < 0.3 ? randInt(4) : 0,
    isLastTile: Math.random() < 0.1,
    isKongDraw: false,
    isRobbingKong: false,
    isWinningTileLast: Math.random() < 0.1,
    chiCount,
    pengCount,
  });
}

/**
 * Pick distractor fans. Biased toward "expected" fans based on game context
 * so the options include fans the user might naturally guess (e.g. 自摸 when
 * self-draw, even if it's suppressed by 不求人).
 */
function pickDistractors(
  correctNames: Set<string>,
  game: GameContext,
  counts: TileSet,
  count: number,
): string[] {
  const expected: string[] = [];

  // Situational fans the user would expect to see based on game context
  if (game.isSelfDraw) expected.push('自摸');
  if (!game.hasOpenMeld) expected.push('门前清');
  if (game.isLastTile) expected.push(game.isSelfDraw ? '妙手回春' : '海底捞月');

  // Tile-property fans the user would expect based on hand
  if (counts.hasNoHonors()) expected.push('无字');
  if (counts.suitsPresent() === 1 && !counts.hasHonors()) expected.push('清一色');
  if (counts.suitsPresent() === 1 && counts.hasHonors()) expected.push('混一色');
  if (counts.isAllSimples()) expected.push('断幺');
  if (counts.suitsPresent() < 3 && counts.suitsPresent() > 0) expected.push('缺一门');

  // Triplet/kong-related fans the user might guess
  const raw = counts.rawCounts();
  let tripletCount = 0;
  let dragonTripletCount = 0;
  let windTripletCount = 0;
  let terminalOrHonorTriplet = false;
  let fourOfKindCount = 0;
  for (let i = 0; i < 34; i++) {
    if (raw[i] === 4) fourOfKindCount++;
    if (raw[i] >= 3) {
      tripletCount++;
      if (i >= 31) dragonTripletCount++;
      if (i >= 27 && i <= 30) windTripletCount++;
      const rank = i % 9;
      if (i >= 27 || rank === 0 || rank === 8) terminalOrHonorTriplet = true;
    }
  }
  if (tripletCount >= 4) expected.push('碰碰和');
  if (dragonTripletCount >= 1) expected.push('箭刻');
  if (dragonTripletCount >= 2) expected.push('双箭刻');
  if (windTripletCount >= 3) expected.push('三风刻');
  if (terminalOrHonorTriplet) expected.push('幺九刻');
  if (fourOfKindCount >= 1) expected.push('四归一');

  // Wind triplet matching seat/round
  const seatIdx = 27 + game.seatWind.rank;
  const roundIdx = 27 + game.roundWind.rank;
  if (raw[seatIdx] >= 3) expected.push('门风刻');
  if (raw[roundIdx] >= 3) expected.push('圈风刻');

  // Wait-type fans
  if (game.winningTile) expected.push('单钓将', '边张', '坎张');

  // Filter expected to those NOT already in correct
  const expectedDistractors = expected.filter(n => !correctNames.has(n));

  const distractors = new Set<string>();
  for (const n of expectedDistractors.sort(() => Math.random() - 0.5)) {
    if (distractors.size >= count) break;
    distractors.add(n);
  }

  // Fill remaining with random fans (excluding 花牌 / 无番和)
  if (distractors.size < count) {
    const remaining = PRACTICE_FANS
      .map(f => f.name)
      .filter(n => !correctNames.has(n) && !distractors.has(n))
      .sort(() => Math.random() - 0.5);
    for (const n of remaining) {
      if (distractors.size >= count) break;
      distractors.add(n);
    }
  }

  return [...distractors];
}

// ── Mode C: Pick fans ──
export function generateFanPickQuestion(): FanPickQuestion | null {
  for (let attempt = 0; attempt < 20; attempt++) {
    const gen = generateValidHand();
    if (!gen) continue;

    const game = generateGameContext(gen.handCounts, gen.chiCount, gen.pengCount);
    const result = evaluate(gen.fullCounts, gen.lockedMelds, game);
    if (result.totalFan === 0) continue;

    const correctFans = result.fans
      .filter(f => !EXCLUDED_FROM_PRACTICE.has(f.name) && !f.name.startsWith('花牌'))
      .filter(f => ALL_FAN_DATA.has(f.name));
    if (correctFans.length === 0) continue;

    const correctFanNames = new Set(correctFans.map(f => f.name));
    const distractors = pickDistractors(correctFanNames, game, gen.fullCounts, 4);
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

    return {
      kind: 'fanPick',
      counts: gen.fullCounts,
      handCounts: gen.handCounts,
      lockedMelds: gen.lockedMelds,
      game,
      result,
      options,
      correctFanNames,
    };
  }
  return null;
}

// ── Mode A: Guess fan count ──
export function generateFanCountQuestion(): FanCountQuestion | null {
  for (let attempt = 0; attempt < 20; attempt++) {
    const gen = generateValidHand();
    if (!gen) continue;

    const game = generateGameContext(gen.handCounts, gen.chiCount, gen.pengCount);
    const result = evaluate(gen.fullCounts, gen.lockedMelds, game);
    if (result.totalFan === 0) continue;

    const correct = result.totalFan;
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

    return {
      kind: 'fanCount',
      counts: gen.fullCounts,
      handCounts: gen.handCounts,
      lockedMelds: gen.lockedMelds,
      game,
      result,
      choices,
      correctIndex,
    };
  }
  return null;
}

// ── Mode B: Guess winning tile ──
export function generateWaitTileQuestion(): WaitTileQuestion | null {
  for (let attempt = 0; attempt < 30; attempt++) {
    const gen = generateValidHand();
    if (!gen) continue;

    // Pick a random tile from CONCEALED hand to remove → 13-tile tenpai
    const handTiles: number[] = [];
    for (let i = 0; i < 34; i++) {
      for (let j = 0; j < gen.handCounts.getByIndex(i); j++) {
        handTiles.push(i);
      }
    }
    if (handTiles.length === 0) continue;
    const removeIdx = handTiles[randInt(handTiles.length)];

    const tenpaiHand = gen.handCounts.clone();
    tenpaiHand.remove(tileFromIndex(removeIdx));

    const tenpaiFull = gen.fullCounts.clone();
    tenpaiFull.remove(tileFromIndex(removeIdx));

    // Find ALL valid winning tiles by trying each tile + checking with locked melds
    const correctTileIndices = new Set<number>();
    const fullRaw = [...tenpaiFull.rawCounts()];
    for (let i = 0; i < 34; i++) {
      if (fullRaw[i] >= 4) continue;
      fullRaw[i]++;
      if (isWinningHandWithMelds(TileSet.fromCounts(fullRaw), gen.lockedMelds)) {
        correctTileIndices.add(i);
      }
      fullRaw[i]--;
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

    const baseGame = generateGameContext(tenpaiHand, gen.chiCount, gen.pengCount);
    const { winningTile, ...game } = baseGame;

    return {
      kind: 'waitTile',
      counts: tenpaiFull,
      handCounts: tenpaiHand,
      lockedMelds: gen.lockedMelds,
      game,
      correctTileIndices,
      candidateTiles,
    };
  }
  return null;
}
