import { describe, it, expect } from 'vitest';
import {
  tile, tileIndex, tileFromIndex, tileEquals, tileToCode, tileFromCode,
  tileToDisplay, isNumberSuit, isTerminal, isHonor, isSimple, isGreenTile,
  Tiles,
} from '../models/tile';

describe('Tile', () => {
  it('tileIndex maps correctly', () => {
    expect(tileIndex(tile('man', 0))).toBe(0);   // 1m
    expect(tileIndex(tile('man', 8))).toBe(8);   // 9m
    expect(tileIndex(tile('pin', 0))).toBe(9);   // 1p
    expect(tileIndex(tile('sou', 8))).toBe(26);  // 9s
    expect(tileIndex(Tiles.East)).toBe(27);
    expect(tileIndex(Tiles.North)).toBe(30);
    expect(tileIndex(Tiles.Zhong)).toBe(31);
    expect(tileIndex(Tiles.Bai)).toBe(33);
  });

  it('tileFromIndex round-trips', () => {
    for (let i = 0; i < 34; i++) {
      expect(tileIndex(tileFromIndex(i))).toBe(i);
    }
  });

  it('tileEquals works', () => {
    expect(tileEquals(tile('man', 0), tile('man', 0))).toBe(true);
    expect(tileEquals(tile('man', 0), tile('man', 1))).toBe(false);
    expect(tileEquals(tile('man', 0), tile('pin', 0))).toBe(false);
    expect(tileEquals(Tiles.East, Tiles.East)).toBe(true);
  });

  it('tile properties', () => {
    expect(isNumberSuit(tile('man', 4))).toBe(true);
    expect(isNumberSuit(Tiles.East)).toBe(false);

    expect(isTerminal(tile('man', 0))).toBe(true);
    expect(isTerminal(tile('man', 8))).toBe(true);
    expect(isTerminal(tile('man', 4))).toBe(false);
    expect(isTerminal(Tiles.East)).toBe(false);

    expect(isHonor(Tiles.East)).toBe(true);
    expect(isHonor(Tiles.Zhong)).toBe(true);
    expect(isHonor(tile('man', 0))).toBe(false);

    expect(isSimple(tile('man', 4))).toBe(true);
    expect(isSimple(tile('man', 0))).toBe(false);
    expect(isSimple(Tiles.East)).toBe(false);
  });

  it('green tiles', () => {
    expect(isGreenTile(tile('sou', 1))).toBe(true);  // 2s
    expect(isGreenTile(tile('sou', 2))).toBe(true);  // 3s
    expect(isGreenTile(tile('sou', 3))).toBe(true);  // 4s
    expect(isGreenTile(tile('sou', 5))).toBe(true);  // 6s
    expect(isGreenTile(tile('sou', 7))).toBe(true);  // 8s
    expect(isGreenTile(Tiles.Fa)).toBe(true);
    expect(isGreenTile(tile('sou', 0))).toBe(false);  // 1s
    expect(isGreenTile(tile('man', 1))).toBe(false);
  });

  it('tileToCode / tileFromCode', () => {
    expect(tileToCode(tile('man', 0))).toBe('1m');
    expect(tileToCode(tile('pin', 4))).toBe('5p');
    expect(tileToCode(Tiles.East)).toBe('E');
    expect(tileToCode(Tiles.Zhong)).toBe('C');

    expect(tileEquals(tileFromCode('1m')!, tile('man', 0))).toBe(true);
    expect(tileEquals(tileFromCode('E')!, Tiles.East)).toBe(true);
    expect(tileEquals(tileFromCode('C')!, Tiles.Zhong)).toBe(true);
    expect(tileFromCode('X')).toBeNull();
  });

  it('tileToDisplay', () => {
    expect(tileToDisplay(tile('man', 0))).toBe('1万');
    expect(tileToDisplay(tile('pin', 4))).toBe('5筒');
    expect(tileToDisplay(Tiles.East)).toBe('东');
    expect(tileToDisplay(Tiles.Zhong)).toBe('中');
    expect(tileToDisplay(Tiles.Bai)).toBe('白');
  });
});
