import type { FanRule } from './models/types';
import { FN } from './rules/fanNames';

export interface MatchedFan {
  name: string;
  points: number;
  description: string;
  count: number;
}

/** Exclusions for special-hand fans (which aren't in allFanRules) */
const SPECIAL_HAND_EXCLUDES: Record<string, string[]> = {
  [FN.LianQiDui]: [FN.QingYiSe, FN.QiDui, FN.DanDiaoJiang, FN.MenQianQing],
  [FN.ShiSanYao]: [FN.WuMenQi, FN.QuanDaiYao, FN.DanDiaoJiang, FN.MenQianQing, FN.HunYaoJiu],
  [FN.QiXingBuKao]: [FN.WuMenQi, FN.BuQiuRen, FN.DanDiaoJiang, FN.MenQianQing, FN.QuanBuKao, FN.ZiMo],
  [FN.QuanBuKao]: [FN.WuMenQi, FN.BuQiuRen, FN.DanDiaoJiang, FN.MenQianQing, FN.ZiMo],
  [FN.QiDui]: [FN.MenQianQing, FN.BuQiuRen, FN.DanDiaoJiang, FN.ZiMo],
};

/**
 * Apply exclusion rules: iterate in priority order (highest points first).
 * A fan that has been suppressed does NOT suppress others.
 */
export function applyExclusions(
  matched: MatchedFan[],
  rules: readonly FanRule[],
): MatchedFan[] {
  const suppressed = new Set<string>();

  // Build a lookup: name → excludes list
  const excludesMap = new Map<string, readonly string[]>();
  for (const r of rules) excludesMap.set(r.name, r.excludes);
  for (const [name, excludes] of Object.entries(SPECIAL_HAND_EXCLUDES)) {
    excludesMap.set(name, excludes);
  }

  // Process in order of the matched list (highest points first)
  const sorted = [...matched].sort((a, b) => b.points - a.points);

  for (const fan of sorted) {
    if (suppressed.has(fan.name)) continue;
    const excludes = excludesMap.get(fan.name);
    if (excludes) {
      for (const excluded of excludes) {
        suppressed.add(excluded);
      }
    }
  }

  return matched.filter(f => !suppressed.has(f.name));
}

/**
 * Handle 无番和: if the only fans (excluding flowers) are from {自摸, 边张, 坎张, 单钓将},
 * replace them with 无番和 8番.
 */
export function handleWuFanHe(fans: MatchedFan[]): MatchedFan[] {
  const wufanSet = new Set(['自摸', '边张', '坎张', '单钓将']);
  const nonFlower = fans.filter(f => !f.name.startsWith('花牌'));
  const hasOnlyWufan = nonFlower.length === 0 || nonFlower.every(f => wufanSet.has(f.name));

  if (!hasOnlyWufan) return fans;

  const result = fans.filter(f => !wufanSet.has(f.name));
  result.push({ name: '无番和', points: 8, description: '和牌但无其他番种，计8番', count: 1 });
  return result;
}
