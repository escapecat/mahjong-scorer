import { type Tile, tile, tileToCode } from './models/tile';
import { sequence, triplet, kong, type Meld } from './models/meld';

/**
 * Compact, round-trippable hand string format.
 *
 *   <handTiles>[ | <meld>][ | <meld>]…[ | *<winningTile>]
 *
 * - handTiles: digit-runs ending in m/p/s, or single honor letters E/S/W/N/C/F/P.
 *   e.g. "1133m456p99s" or "EE 1m"
 * - meld prefixes:
 *     c<tile>  chi (sequence starting from <tile>),    e.g. "c1m" → 1-2-3m
 *     p<tile>  peng (triplet),                          e.g. "p3p"
 *     mk<tile> mingKong (open kong),                    e.g. "mk9s"
 *     ak<tile> anKong (concealed kong),                 e.g. "akE"
 *   Chinese aliases also accepted on import: 吃 / 碰 / 明杠 / 暗杠 / 胡.
 * - winningTile: prefix "*" or "=" or "胡". Must be a tile that exists in
 *   the hand (it's just a marker, not an extra tile).
 *
 * Example:
 *   "1133m456p99s | c1m | p3p | mk9s | akE | *7p"
 */

export interface HandStringData {
  hand: Tile[];
  chiMelds: Meld[];
  pengMelds: Meld[];
  mingKongMelds: Meld[];
  anKongMelds: Meld[];
  winningTile: Tile | null;
}

const HONOR_TILE: Record<string, Tile> = {
  E: tile('wind', 0),
  S: tile('wind', 1),
  W: tile('wind', 2),
  N: tile('wind', 3),
  C: tile('dragon', 0),
  F: tile('dragon', 1),
  P: tile('dragon', 2),
};

const CN_HONOR: Record<string, string> = {
  '东': 'E', '南': 'S', '西': 'W', '北': 'N',
  '中': 'C', '发': 'F', '白': 'P',
};

const CN_SUIT: Record<string, string> = {
  '万': 'm', '筒': 'p', '饼': 'p', '条': 's', '索': 's',
};

function normalizeChinese(s: string): string {
  let out = s;
  out = out.replace(/吃/g, '|c').replace(/碰/g, '|p').replace(/明杠/g, '|mk').replace(/暗杠/g, '|ak').replace(/胡/g, '|*');
  for (const [zh, ascii] of Object.entries(CN_HONOR)) out = out.replace(new RegExp(zh, 'g'), ascii);
  for (const [zh, ascii] of Object.entries(CN_SUIT)) out = out.replace(new RegExp(zh, 'g'), ascii);
  return out;
}

/** Parse a contiguous run like "1133m456p99sEEC" into tiles (no melds, no winning). */
function parseTileRun(s: string): Tile[] | null {
  const tiles: Tile[] = [];
  let digits = '';
  for (const ch of s) {
    if (ch >= '0' && ch <= '9') {
      digits += ch;
      continue;
    }
    if (ch === 'm' || ch === 'p' || ch === 's') {
      if (!digits) return null;
      const suit = ch === 'm' ? 'man' : ch === 'p' ? 'pin' : 'sou';
      for (const d of digits) {
        const r = parseInt(d) - 1;
        if (r < 0 || r > 8) return null;
        tiles.push(tile(suit, r));
      }
      digits = '';
      continue;
    }
    if (HONOR_TILE[ch]) {
      if (digits) return null;
      tiles.push(HONOR_TILE[ch]);
      continue;
    }
    if (ch === ' ' || ch === '\t') continue;
    return null;
  }
  if (digits) return null;
  return tiles;
}

/** Parse a single tile like "1m", "9s", or "E". Whitespace ignored. */
function parseTile(s: string): Tile | null {
  const trimmed = s.replace(/\s+/g, '');
  const r = parseTileRun(trimmed);
  return r && r.length === 1 ? r[0] : null;
}

export function parseHandString(input: string): HandStringData | null {
  if (!input) return null;
  const normalized = normalizeChinese(input);
  // Split on |, ,, newline (any combination, with surrounding whitespace).
  const segments = normalized.split(/\s*[|,\n]+\s*/).map((s) => s.trim()).filter(Boolean);
  if (segments.length === 0) return null;

  const result: HandStringData = {
    hand: [],
    chiMelds: [],
    pengMelds: [],
    mingKongMelds: [],
    anKongMelds: [],
    winningTile: null,
  };

  // First segment: hand tiles (no prefix expected).
  const handTiles = parseTileRun(segments[0]);
  if (!handTiles) return null;
  result.hand = handTiles;

  // Remaining segments: melds + winning tile.
  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i];
    if (seg.startsWith('mk')) {
      const t = parseTile(seg.slice(2));
      if (!t) return null;
      result.mingKongMelds.push(kong(t, true));
    } else if (seg.startsWith('ak')) {
      const t = parseTile(seg.slice(2));
      if (!t) return null;
      result.anKongMelds.push(kong(t, false));
    } else if (seg.startsWith('c')) {
      const t = parseTile(seg.slice(1));
      if (!t) return null;
      if (t.suit !== 'man' && t.suit !== 'pin' && t.suit !== 'sou') return null;
      if (t.rank > 6) return null;
      result.chiMelds.push(sequence(t, true));
    } else if (seg.startsWith('p')) {
      const t = parseTile(seg.slice(1));
      if (!t) return null;
      result.pengMelds.push(triplet(t, true));
    } else if (seg.startsWith('*') || seg.startsWith('=')) {
      const t = parseTile(seg.slice(1));
      if (!t) return null;
      result.winningTile = t;
    } else {
      // Treat as additional hand tiles, for forgiving inputs.
      const extra = parseTileRun(seg);
      if (!extra) return null;
      result.hand.push(...extra);
    }
  }

  return result;
}

/** Serialize a contiguous tile group (sorted) into the canonical run form. */
function serializeTileRun(tiles: Tile[]): string {
  // Group by suit; within each numeric suit, sort by rank and concatenate digits.
  const byMan: number[] = [];
  const byPin: number[] = [];
  const bySou: number[] = [];
  const honors: string[] = [];
  for (const t of [...tiles].sort((a, b) => {
    const order = ['man', 'pin', 'sou', 'wind', 'dragon'];
    const so = order.indexOf(a.suit) - order.indexOf(b.suit);
    return so !== 0 ? so : a.rank - b.rank;
  })) {
    if (t.suit === 'man') byMan.push(t.rank + 1);
    else if (t.suit === 'pin') byPin.push(t.rank + 1);
    else if (t.suit === 'sou') bySou.push(t.rank + 1);
    else honors.push(tileToCode(t));
  }
  const parts: string[] = [];
  if (byMan.length) parts.push(byMan.join('') + 'm');
  if (byPin.length) parts.push(byPin.join('') + 'p');
  if (bySou.length) parts.push(bySou.join('') + 's');
  if (honors.length) parts.push(honors.join(''));
  return parts.join('');
}

export function serializeHand(d: HandStringData): string {
  const parts: string[] = [];
  parts.push(serializeTileRun(d.hand) || '(空)');
  for (const m of d.chiMelds) parts.push('c' + tileToCode(m.start));
  for (const m of d.pengMelds) parts.push('p' + tileToCode(m.start));
  for (const m of d.mingKongMelds) parts.push('mk' + tileToCode(m.start));
  for (const m of d.anKongMelds) parts.push('ak' + tileToCode(m.start));
  if (d.winningTile) parts.push('*' + tileToCode(d.winningTile));
  return parts.join(' | ');
}
