import type { FanContext, GameContext, EvaluationResult, FanRule } from './models/types';
import type { Meld, HandDecomposition } from './models/meld';
import type { Tile } from './models/tile';
import { tileToDisplay, tileToCode, tileEquals } from './models/tile';
import { meldTiles, isTripletOrKong } from './models/meld';
import { TileSet } from './models/tileSet';
import { decomposeHand, subtractMelds } from './decomposer';
import { allFanRules } from './rules/index';
import { allSpecialHandRules } from './rules/specialHands';
import { applyExclusions, handleWuFanHe, type MatchedFan } from './exclusions';
import { getWaitTypes } from './waitAnalyzer';

export function evaluate(
  allCounts: TileSet,
  lockedMelds: readonly Meld[],
  game: GameContext,
): EvaluationResult {
  const handCounts = subtractMelds(allCounts, lockedMelds);
  const candidates: EvaluationResult[] = [];

  // ── Special hands ──
  for (const rule of allSpecialHandRules) {
    if (!rule.isMatch(allCounts, game)) continue;

    const specialResult = rule.evaluate(allCounts, game);
    if (!specialResult) continue;

    // Start with the special hand's own fans
    let fans: MatchedFan[] = specialResult.fans.map(f => ({ ...f, count: 1 }));

    // Run additional standard rules if the special hand allows it
    if (specialResult.additionalRuleFilter) {
      const additionalRules = allFanRules.filter(specialResult.additionalRuleFilter);
      const dummyDecomp: HandDecomposition = { pair: { suit: 'man', rank: 0 }, melds: [] };
      const ctx: FanContext = { allCounts, handCounts, lockedMelds, decomposition: dummyDecomp, game };

      for (const rule of additionalRules) {
        const count = rule.match(ctx);
        if (count > 0) {
          fans.push({ name: rule.name, points: rule.points, description: rule.description, count });
        }
      }
    }

    // Add situational fans
    fans.push(...getSituationalFans(allCounts, handCounts, lockedMelds, game));

    // Apply exclusions using all rules (special + standard) for the excludes lookup
    fans = applyExclusions(fans, allFanRules);
    fans = handleWuFanHe(fans);
    fans = addFlowerFan(fans, game);

    const expanded = expandFans(fans);
    expanded.sort((a, b) => b.points - a.points);

    candidates.push({
      totalFan: expanded.reduce((sum, f) => sum + f.points, 0),
      fans: expanded,
      decompositionDescription: specialResult.description,
      tileGroups: specialResult.tileGroups,
      winningTileGroupIndex: findWinningGroupSpecial(specialResult.tileGroups, game.winningTile),
    });
  }

  // ── Standard decompositions ──
  const decompositions = decomposeHand(handCounts, lockedMelds);

  for (const decomp of decompositions) {
    const ctx: FanContext = { allCounts, handCounts, lockedMelds, decomposition: decomp, game };

    let fans: MatchedFan[] = [];
    for (const rule of allFanRules) {
      const count = rule.match(ctx);
      if (count > 0) {
        fans.push({ name: rule.name, points: rule.points, description: rule.description, count });
      }
    }

    fans = applyExclusions(fans, allFanRules);
    fans = handleWuFanHe(fans);
    fans = addFlowerFan(fans, game);

    const expanded = expandFans(fans);
    expanded.sort((a, b) => b.points - a.points);

    const tileGroups = buildDecompTileGroups(decomp);
    const lockedCount = lockedMelds.length;

    candidates.push({
      totalFan: expanded.reduce((sum, f) => sum + f.points, 0),
      fans: expanded,
      decompositionDescription: buildDecompDescription(decomp),
      tileGroups,
      winningTileGroupIndex: findWinningGroupDecomp(decomp, game.winningTile, lockedCount),
    });
  }

  if (candidates.length === 0) {
    return { totalFan: 0, fans: [], decompositionDescription: '', tileGroups: [], winningTileGroupIndex: -1 };
  }

  // Sort by totalFan desc. Stable sort preserves engine order (special hands first, then standard).
  const sorted = [...candidates].sort((a, b) => b.totalFan - a.totalFan);
  return { ...sorted[0], allCandidates: sorted };
}

// ── Helpers ──

function getSituationalFans(allCounts: TileSet, handCounts: TileSet, lockedMelds: readonly Meld[], game: GameContext): MatchedFan[] {
  // Situational fans are already in allFanRules and matched in the main loop.
  // This is only for special hands that skip the main rule loop.
  const situationalNames = new Set([
    '不求人', '门前清', '和绝张', '杠上开花', '抢杠和',
    '妙手回春', '海底捞月', '边张', '坎张', '单钓将',
    '全求人', '自摸',
  ]);

  const dummyDecomp: HandDecomposition = { pair: { suit: 'man', rank: 0 }, melds: [] };
  const ctx: FanContext = { allCounts, handCounts, lockedMelds, decomposition: dummyDecomp, game };

  const fans: MatchedFan[] = [];
  for (const rule of allFanRules) {
    if (!situationalNames.has(rule.name)) continue;
    const count = rule.match(ctx);
    if (count > 0) {
      fans.push({ name: rule.name, points: rule.points, description: rule.description, count });
    }
  }
  return fans;
}

function addFlowerFan(fans: MatchedFan[], game: GameContext): MatchedFan[] {
  if (game.flowerCount > 0) {
    return [...fans, { name: '花牌', points: game.flowerCount, description: `有${game.flowerCount}张花牌`, count: 1 }];
  }
  return fans;
}

/** Expand fans where count > 1 into repeated entries */
function expandFans(fans: MatchedFan[]): Array<{ name: string; points: number; description: string }> {
  const result: Array<{ name: string; points: number; description: string }> = [];
  for (const f of fans) {
    for (let i = 0; i < f.count; i++) {
      result.push({ name: f.name, points: f.points, description: f.description });
    }
  }
  return result;
}

function buildDecompTileGroups(decomp: HandDecomposition): Tile[][] {
  const groups: Tile[][] = [];
  for (const m of decomp.melds) {
    groups.push(meldTiles(m));
  }
  groups.push([decomp.pair, decomp.pair]);
  return groups;
}

function buildDecompDescription(decomp: HandDecomposition): string {
  const parts: string[] = [];
  for (const m of decomp.melds) {
    if (m.type === 'sequence') {
      const tiles = meldTiles(m);
      parts.push(tiles.map(t => tileToDisplay(t)).join(''));
    } else if (m.type === 'triplet') {
      parts.push(`${tileToDisplay(m.start)}×3`);
    } else {
      parts.push(`${tileToDisplay(m.start)}×4`);
    }
  }
  parts.push(`${tileToDisplay(decomp.pair)}×2`);
  return parts.join(' ');
}

function findWinningGroupSpecial(tileGroups: Tile[][], winningTile: Tile | null): number {
  if (!winningTile) return -1;
  for (let i = tileGroups.length - 1; i >= 0; i--) {
    if (tileGroups[i].some(t => tileEquals(t, winningTile))) return i;
  }
  return -1;
}

function findWinningGroupDecomp(decomp: HandDecomposition, winningTile: Tile | null, lockedCount: number): number {
  if (!winningTile) return -1;

  // Pair is last group
  if (tileEquals(decomp.pair, winningTile)) {
    return decomp.melds.length; // pair index
  }

  // Search hand-derived melds (after locked melds)
  for (let i = decomp.melds.length - 1; i >= lockedCount; i--) {
    if (meldTiles(decomp.melds[i]).some(t => tileEquals(t, winningTile))) return i;
  }

  // Fallback
  for (let i = decomp.melds.length - 1; i >= 0; i--) {
    if (meldTiles(decomp.melds[i]).some(t => tileEquals(t, winningTile))) return i;
  }

  return -1;
}
