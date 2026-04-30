import { Tile, tileIndex, tileFromIndex, isNumberSuit, isHonor, isTerminal, isSimple, isGreenTile, type Suit, NUMBER_SUIT_LIST } from './tile';

export class TileSet {
  private counts: number[];

  constructor(counts?: number[]) {
    this.counts = counts ? [...counts] : new Array(34).fill(0);
  }

  // ── Basic access ──

  get(tile: Tile): number {
    return this.counts[tileIndex(tile)];
  }

  getByIndex(index: number): number {
    return this.counts[index];
  }

  set(tile: Tile, n: number): void {
    this.counts[tileIndex(tile)] = n;
  }

  add(tile: Tile, n = 1): void {
    this.counts[tileIndex(tile)] += n;
  }

  remove(tile: Tile, n = 1): void {
    const idx = tileIndex(tile);
    this.counts[idx] = Math.max(0, this.counts[idx] - n);
  }

  total(): number {
    return this.counts.reduce((a, b) => a + b, 0);
  }

  clone(): TileSet {
    return new TileSet(this.counts);
  }

  // ── Iteration ──

  nonZero(): Array<{ tile: Tile; count: number }> {
    const result: Array<{ tile: Tile; count: number }> = [];
    for (let i = 0; i < 34; i++) {
      if (this.counts[i] > 0) {
        result.push({ tile: tileFromIndex(i), count: this.counts[i] });
      }
    }
    return result;
  }

  distinctTiles(): Tile[] {
    return this.nonZero().map(e => e.tile);
  }

  // ── Queries ──

  /** All tiles are of a single number suit (no honors) */
  isPureSuit(): boolean {
    return !this.hasHonors() && this.suitsPresent() === 1;
  }

  /** One number suit + honors */
  isHalfFlush(): boolean {
    return this.hasHonors() && this.suitsPresent() === 1;
  }

  hasHonors(): boolean {
    for (let i = 27; i < 34; i++) {
      if (this.counts[i] > 0) return true;
    }
    return false;
  }

  /** Number of distinct number suits with tiles */
  suitsPresent(): number {
    let count = 0;
    for (const suit of NUMBER_SUIT_LIST) {
      if (this.hasSuit(suit)) count++;
    }
    return count;
  }

  hasSuit(suit: Suit): boolean {
    const base = suit === 'man' ? 0 : suit === 'pin' ? 9 : 18;
    for (let i = base; i < base + 9; i++) {
      if (this.counts[i] > 0) return true;
    }
    return false;
  }

  /** Which single number suit is present (assumes isPureSuit or suitsPresent === 1) */
  getSingleSuit(): Suit | null {
    for (const suit of NUMBER_SUIT_LIST) {
      if (this.hasSuit(suit)) return suit;
    }
    return null;
  }

  /** All tiles are honors */
  isAllHonors(): boolean {
    for (let i = 0; i < 27; i++) {
      if (this.counts[i] > 0) return false;
    }
    return this.total() > 0;
  }

  /** All number tiles are terminals (1 or 9), no middle tiles */
  isAllTerminalRanks(): boolean {
    for (let i = 0; i < 27; i++) {
      const rank = i % 9;
      if (rank > 0 && rank < 8 && this.counts[i] > 0) return false;
    }
    return true;
  }

  /** All tiles are terminals (1,9 only, no honors) */
  isAllTerminals(): boolean {
    return !this.hasHonors() && this.isAllTerminalRanks() && this.total() > 0;
  }

  /** All tiles are terminals + honors, with at least one honor */
  isAllTerminalsOrHonors(): boolean {
    return this.hasHonors() && this.isAllTerminalRanks() && this.total() > 0;
  }

  /** No honors */
  hasNoHonors(): boolean {
    return !this.hasHonors();
  }

  /** All tiles are simples (2-8, no honors) */
  isAllSimples(): boolean {
    for (let i = 0; i < 34; i++) {
      if (this.counts[i] === 0) continue;
      const t = tileFromIndex(i);
      if (!isSimple(t)) return false;
    }
    return this.total() > 0;
  }

  /** All tiles are green tiles (23468s + 发) */
  isAllGreen(): boolean {
    for (let i = 0; i < 34; i++) {
      if (this.counts[i] === 0) continue;
      if (!isGreenTile(tileFromIndex(i))) return false;
    }
    return this.total() > 0;
  }

  /** Check if all number tile ranks satisfy a predicate */
  isOnlyRanks(predicate: (rank: number) => boolean): boolean {
    let hasTile = false;
    for (let i = 0; i < 27; i++) {
      if (this.counts[i] === 0) continue;
      hasTile = true;
      if (!predicate(i % 9)) return false;
    }
    return hasTile;
  }

  /** All even-ranked number tiles, no honors */
  isAllEvenRanks(): boolean {
    if (this.hasHonors()) return false;
    for (let i = 0; i < 27; i++) {
      if (this.counts[i] === 0) continue;
      if (i % 9 % 2 === 0) return false; // rank 0,2,4,6,8 are odd in 1-indexed (1,3,5,7,9)
    }
    return this.total() > 0;
  }

  /** Count tiles with exactly 4 copies (potential 四归一) */
  countFourOfAKind(): number {
    return this.counts.filter(c => c === 4).length;
  }

  /** Check for 7 pairs pattern */
  isSevenPairs(): boolean {
    const total = this.total();
    if (total !== 14) return false;
    let pairs = 0;
    for (const c of this.counts) {
      pairs += Math.floor(c / 2);
    }
    return pairs * 2 === total;
  }

  /** Has wind triplets count */
  windTripletCount(): number {
    let count = 0;
    for (let i = 27; i <= 30; i++) {
      if (this.counts[i] >= 3) count++;
    }
    return count;
  }

  /** Has all 5 categories: man, pin, sou, wind, dragon */
  hasFiveGates(): boolean {
    return this.hasSuit('man') && this.hasSuit('pin') && this.hasSuit('sou')
      && this.counts.slice(27, 31).some(c => c > 0)
      && this.counts.slice(31, 34).some(c => c > 0);
  }

  // ── Internal ──

  rawCounts(): readonly number[] {
    return this.counts;
  }

  /** Create from raw counts array */
  static fromCounts(counts: number[]): TileSet {
    return new TileSet(counts);
  }
}
