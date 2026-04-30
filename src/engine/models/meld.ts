import { Tile, tileEquals, tile, isNumberSuit } from './tile';

export type MeldType = 'sequence' | 'triplet' | 'kong';

export interface Meld {
  readonly type: MeldType;
  readonly start: Tile;   // first tile (lowest rank). For triplet/kong, all tiles are the same.
  readonly isOpen: boolean;
}

export interface HandDecomposition {
  readonly pair: Tile;
  readonly melds: readonly Meld[];
}

// ── Meld factories ──

export function sequence(start: Tile, isOpen = false): Meld {
  return { type: 'sequence', start, isOpen };
}

export function triplet(start: Tile, isOpen = false): Meld {
  return { type: 'triplet', start, isOpen };
}

export function kong(start: Tile, isOpen = false): Meld {
  return { type: 'kong', start, isOpen };
}

// ── Meld queries ──

export function meldTiles(m: Meld): Tile[] {
  switch (m.type) {
    case 'sequence':
      return [m.start, tile(m.start.suit, m.start.rank + 1), tile(m.start.suit, m.start.rank + 2)];
    case 'triplet':
      return [m.start, m.start, m.start];
    case 'kong':
      return [m.start, m.start, m.start, m.start];
  }
}

export function isTripletOrKong(m: Meld): boolean {
  return m.type === 'triplet' || m.type === 'kong';
}

export function meldContains(m: Meld, t: Tile): boolean {
  return meldTiles(m).some(mt => tileEquals(mt, t));
}

export function isWindMeld(m: Meld): boolean {
  return m.start.suit === 'wind';
}

export function isDragonMeld(m: Meld): boolean {
  return m.start.suit === 'dragon';
}

export function isSuitMeld(m: Meld): boolean {
  return isNumberSuit(m.start);
}
