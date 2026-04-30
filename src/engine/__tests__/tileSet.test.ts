import { describe, it, expect } from 'vitest';
import { TileSet } from '../models/tileSet';
import { tile, Tiles } from '../models/tile';

describe('TileSet', () => {
  it('add and get', () => {
    const ts = new TileSet();
    ts.add(tile('man', 0), 3);
    ts.add(Tiles.East, 2);

    expect(ts.get(tile('man', 0))).toBe(3);
    expect(ts.get(Tiles.East)).toBe(2);
    expect(ts.get(tile('pin', 0))).toBe(0);
    expect(ts.total()).toBe(5);
  });

  it('remove caps at 0', () => {
    const ts = new TileSet();
    ts.add(tile('man', 0), 2);
    ts.remove(tile('man', 0), 5);
    expect(ts.get(tile('man', 0))).toBe(0);
  });

  it('clone is independent', () => {
    const ts = new TileSet();
    ts.add(tile('man', 0), 3);
    const clone = ts.clone();
    clone.add(tile('man', 0), 1);
    expect(ts.get(tile('man', 0))).toBe(3);
    expect(clone.get(tile('man', 0))).toBe(4);
  });

  it('nonZero and distinctTiles', () => {
    const ts = new TileSet();
    ts.add(tile('man', 0), 3);
    ts.add(tile('pin', 4), 1);

    const nz = ts.nonZero();
    expect(nz).toHaveLength(2);
    expect(nz[0].count).toBe(3);
    expect(nz[1].count).toBe(1);

    expect(ts.distinctTiles()).toHaveLength(2);
  });

  it('isPureSuit', () => {
    const ts = new TileSet();
    ts.add(tile('man', 0), 3);
    ts.add(tile('man', 4), 3);
    expect(ts.isPureSuit()).toBe(true);

    ts.add(Tiles.East, 1);
    expect(ts.isPureSuit()).toBe(false);
  });

  it('isHalfFlush', () => {
    const ts = new TileSet();
    ts.add(tile('man', 0), 3);
    ts.add(Tiles.East, 3);
    expect(ts.isHalfFlush()).toBe(true);

    ts.add(tile('pin', 0), 1);
    expect(ts.isHalfFlush()).toBe(false);
  });

  it('isAllHonors', () => {
    const ts = new TileSet();
    ts.add(Tiles.East, 3);
    ts.add(Tiles.South, 3);
    ts.add(Tiles.Zhong, 2);
    expect(ts.isAllHonors()).toBe(true);

    ts.add(tile('man', 0), 1);
    expect(ts.isAllHonors()).toBe(false);
  });

  it('isAllTerminals', () => {
    const ts = new TileSet();
    ts.add(tile('man', 0), 3);
    ts.add(tile('man', 8), 3);
    ts.add(tile('pin', 0), 3);
    ts.add(tile('pin', 8), 3);
    ts.add(tile('sou', 0), 2);
    expect(ts.isAllTerminals()).toBe(true);
  });

  it('isAllSimples', () => {
    const ts = new TileSet();
    ts.add(tile('man', 1), 3); // 2m
    ts.add(tile('man', 3), 3); // 4m
    ts.add(tile('pin', 5), 3); // 6p
    expect(ts.isAllSimples()).toBe(true);

    ts.add(tile('man', 0), 1); // 1m = terminal
    expect(ts.isAllSimples()).toBe(false);
  });

  it('isAllGreen', () => {
    const ts = new TileSet();
    ts.add(tile('sou', 1), 3); // 2s
    ts.add(tile('sou', 2), 3); // 3s
    ts.add(tile('sou', 5), 3); // 6s
    ts.add(tile('sou', 7), 3); // 8s
    ts.add(Tiles.Fa, 2);
    expect(ts.isAllGreen()).toBe(true);
  });

  it('isSevenPairs', () => {
    const ts = new TileSet();
    for (let i = 0; i < 7; i++) {
      ts.add(tile('man', i), 2);
    }
    expect(ts.isSevenPairs()).toBe(true);
    expect(ts.total()).toBe(14);
  });

  it('hasFiveGates', () => {
    const ts = new TileSet();
    ts.add(tile('man', 0), 1);
    ts.add(tile('pin', 0), 1);
    ts.add(tile('sou', 0), 1);
    ts.add(Tiles.East, 1);
    ts.add(Tiles.Zhong, 1);
    expect(ts.hasFiveGates()).toBe(true);
  });
});
