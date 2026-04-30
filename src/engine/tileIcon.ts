import { type Tile, tileToCode } from './models/tile';

// Base path: empty string for dev (resolves relative to /), or '/mahjong-scorer'
// for Gitee Pages subpath deploy. Set via build-time env var.
const BASE = (typeof process !== 'undefined' && process.env && process.env.TARO_APP_BASE_URL) || '';

const CODE_TO_FILE: Record<string, string> = {
  E: `${BASE}/tiles/F1.png`, S: `${BASE}/tiles/F2.png`, W: `${BASE}/tiles/F3.png`, N: `${BASE}/tiles/F4.png`,
  C: `${BASE}/tiles/J1.png`, F: `${BASE}/tiles/J2.png`, P: `${BASE}/tiles/J3.png`,
  '1m': `${BASE}/tiles/W1.png`, '2m': `${BASE}/tiles/W2.png`, '3m': `${BASE}/tiles/W3.png`,
  '4m': `${BASE}/tiles/W4.png`, '5m': `${BASE}/tiles/W5.png`, '6m': `${BASE}/tiles/W6.png`,
  '7m': `${BASE}/tiles/W7.png`, '8m': `${BASE}/tiles/W8.png`, '9m': `${BASE}/tiles/W9.png`,
  '1s': `${BASE}/tiles/T1.png`, '2s': `${BASE}/tiles/T2.png`, '3s': `${BASE}/tiles/T3.png`,
  '4s': `${BASE}/tiles/T4.png`, '5s': `${BASE}/tiles/T5.png`, '6s': `${BASE}/tiles/T6.png`,
  '7s': `${BASE}/tiles/T7.png`, '8s': `${BASE}/tiles/T8.png`, '9s': `${BASE}/tiles/T9.png`,
  '1p': `${BASE}/tiles/B1.png`, '2p': `${BASE}/tiles/B2.png`, '3p': `${BASE}/tiles/B3.png`,
  '4p': `${BASE}/tiles/B4.png`, '5p': `${BASE}/tiles/B5.png`, '6p': `${BASE}/tiles/B6.png`,
  '7p': `${BASE}/tiles/B7.png`, '8p': `${BASE}/tiles/B8.png`, '9p': `${BASE}/tiles/B9.png`,
};

export function tileIconPath(t: Tile): string {
  return CODE_TO_FILE[tileToCode(t)] ?? '';
}

export function tileIconPathByCode(code: string): string {
  return CODE_TO_FILE[code] ?? '';
}
