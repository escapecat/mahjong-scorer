import { describe, it, expect } from 'vitest';
import { parseHandString, serializeHand, type HandStringData } from '../handString';
import { tile, tileEquals, type Tile } from '../models/tile';
import { sequence, triplet, kong, type Meld } from '../models/meld';

function meldEquals(a: Meld, b: Meld): boolean {
  return a.type === b.type && tileEquals(a.start, b.start);
}

function tilesEqual(a: Tile[], b: Tile[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((t, i) => tileEquals(t, b[i]));
}

describe('handString', () => {
  describe('parseHandString', () => {
    it('parses a simple numeric hand', () => {
      const r = parseHandString('123m456p789s11pE');
      expect(r).not.toBeNull();
      expect(r!.hand.length).toBe(12);
    });

    it('parses honors and digits mixed in any order', () => {
      const r = parseHandString('EE 123m');
      expect(r).not.toBeNull();
      expect(r!.hand.map(t => `${t.suit}${t.rank}`)).toEqual([
        'wind0', 'wind0', 'man0', 'man1', 'man2',
      ]);
    });

    it('parses chi/peng/kong melds', () => {
      const r = parseHandString('11p | c1m | p3p | mk9s | akE');
      expect(r).not.toBeNull();
      expect(r!.chiMelds.length).toBe(1);
      expect(r!.pengMelds.length).toBe(1);
      expect(r!.mingKongMelds.length).toBe(1);
      expect(r!.anKongMelds.length).toBe(1);
      expect(meldEquals(r!.chiMelds[0], sequence(tile('man', 0), true))).toBe(true);
      expect(meldEquals(r!.pengMelds[0], triplet(tile('pin', 2), true))).toBe(true);
    });

    it('parses winning tile marker', () => {
      const r = parseHandString('1133m456p99s | *7p');
      expect(r).not.toBeNull();
      expect(r!.winningTile).toEqual(tile('pin', 6));
    });

    it('accepts Chinese aliases', () => {
      const r = parseHandString('11万 22筒 33条 中中中 吃1m 胡1万');
      expect(r).not.toBeNull();
      expect(r!.hand.length).toBe(9);
      expect(r!.chiMelds.length).toBe(1);
      expect(r!.winningTile).toEqual(tile('man', 0));
    });

    it('returns null on garbage input', () => {
      expect(parseHandString('blah blah')).toBeNull();
      expect(parseHandString('123x')).toBeNull();
      expect(parseHandString('mp')).toBeNull();
    });

    it('returns null on empty input', () => {
      expect(parseHandString('')).toBeNull();
    });
  });

  describe('serializeHand', () => {
    it('emits canonical compact form', () => {
      const d: HandStringData = {
        hand: [
          tile('man', 0), tile('man', 0),
          tile('pin', 2), tile('pin', 5),
          tile('sou', 8),
          tile('dragon', 0),
        ],
        chiMelds: [sequence(tile('man', 0), true)],
        pengMelds: [triplet(tile('pin', 2), true)],
        mingKongMelds: [kong(tile('sou', 8), true)],
        anKongMelds: [kong(tile('wind', 0), false)],
        winningTile: tile('pin', 6),
      };
      expect(serializeHand(d)).toBe('11m36p9sC | c1m | p3p | mk9s | akE | *7p');
    });

    it('handles empty melds', () => {
      const d: HandStringData = {
        hand: [tile('man', 0), tile('man', 0)],
        chiMelds: [], pengMelds: [], mingKongMelds: [], anKongMelds: [],
        winningTile: null,
      };
      expect(serializeHand(d)).toBe('11m');
    });
  });

  describe('round-trip', () => {
    it('parse(serialize(d)) preserves all fields', () => {
      const original: HandStringData = {
        hand: [
          tile('man', 0), tile('man', 0),
          tile('pin', 2), tile('pin', 5),
          tile('sou', 8),
          tile('dragon', 0), tile('dragon', 0),
        ],
        chiMelds: [sequence(tile('man', 0), true)],
        pengMelds: [triplet(tile('pin', 2), true)],
        mingKongMelds: [kong(tile('sou', 8), true)],
        anKongMelds: [kong(tile('wind', 0), false)],
        winningTile: tile('pin', 6),
      };
      const s = serializeHand(original);
      const parsed = parseHandString(s);
      expect(parsed).not.toBeNull();
      expect(tilesEqual(parsed!.hand, original.hand)).toBe(true);
      expect(parsed!.chiMelds.length).toBe(1);
      expect(parsed!.pengMelds.length).toBe(1);
      expect(parsed!.mingKongMelds.length).toBe(1);
      expect(parsed!.anKongMelds.length).toBe(1);
      expect(parsed!.winningTile).toEqual(original.winningTile);
    });
  });
});
