import type { FanRule } from '../models/types';
import { highFans } from './highFans';
import { tilePropertyFans } from './tileProperties';
import { meldPatternFans } from './meldPatterns';
import { sequencePatternFans } from './sequencePatterns';
import { tripletPatternFans } from './tripletPatterns';
import { windDragonFans } from './windDragon';
import { kongFans } from './kongs';
import { concealedFans } from './concealed';
import { situationalFans } from './situational';

export { FN } from './fanNames';

/** All fan rules ordered by points descending (for exclusion processing) */
export const allFanRules: FanRule[] = [
  ...highFans,
  ...tilePropertyFans,
  ...meldPatternFans,
  ...sequencePatternFans,
  ...tripletPatternFans,
  ...windDragonFans,
  ...kongFans,
  ...concealedFans,
  ...situationalFans,
].sort((a, b) => b.points - a.points);
