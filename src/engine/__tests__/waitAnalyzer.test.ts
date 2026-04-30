import { describe, it, expect } from 'vitest';
import { getWaitTypes } from '../waitAnalyzer';
import { parseTiles } from './helpers';
import { tile, tileFromCode, Tiles, type Tile } from '../models/tile';
import { TileSet } from '../models/tileSet';

function ts(s: string): TileSet {
  return parseTiles(s);
}

function w(code: string): Tile {
  return tileFromCode(code)!;
}

describe('WaitAnalyzer - 单钓将 (single wait)', () => {
  it('detects single wait when winning tile is the pair', () => {
    // Complete 14-tile hand: 4 melds done + pair completed by winning tile
    const hand = ts('123m456p789s111m99p');
    const waits = getWaitTypes(hand, w('9p'));
    expect(waits.has('single')).toBe(true);
  });

  it('NOT single wait when winning tile completes a meld', () => {
    // Winning 3m completes 123m sequence; 99p is the pair
    const hand = ts('123m456p789s111m99p');
    const waits = getWaitTypes(hand, w('3m'));
    expect(waits.has('single')).toBe(false);
  });
});

describe('WaitAnalyzer - 边张 (edge wait)', () => {
  it('detects 3 completing 12_ (edge wait at top)', () => {
    // Hand pre-win was 12m + 456p + 789s + 111m + 99p, winning 3m
    const hand = ts('123m456p789s111m99p');
    const waits = getWaitTypes(hand, w('3m'));
    expect(waits.has('edge')).toBe(true);
  });

  it('detects 7 completing 89_ (edge wait at bottom)', () => {
    const hand = ts('789m456p123s111m99p');
    const waits = getWaitTypes(hand, w('7m'));
    expect(waits.has('edge')).toBe(true);
  });

  it('NOT edge wait for 4 completing 234', () => {
    // 4 in middle of 234 is not edge wait
    const hand = ts('234m456p789s111m99p');
    const waits = getWaitTypes(hand, w('4m'));
    expect(waits.has('edge')).toBe(false);
  });

  it('NOT edge wait for 2 in 123 (only 3 in 12_ is edge)', () => {
    const hand = ts('123m456p789s111m99p');
    const waits = getWaitTypes(hand, w('2m'));
    expect(waits.has('edge')).toBe(false);
  });
});

describe('WaitAnalyzer - 坎张 (closed wait)', () => {
  it('detects 5 completing 4_6 (middle of sequence)', () => {
    // Hand has 456m and the 5m completes the closed gap
    // To FORCE closed wait, we need a hand where 5m can ONLY be middle of 456
    // Use a 14-tile hand where 4 and 6 are in hand and 5 completes them
    const hand = ts('456m123p789s111m99p');
    const waits = getWaitTypes(hand, w('5m'));
    expect(waits.has('closed')).toBe(true);
  });

  it('detects 2 completing 1_3', () => {
    const hand = ts('123m456p789s111m99p');
    const waits = getWaitTypes(hand, w('2m'));
    expect(waits.has('closed')).toBe(true);
  });

  it('detects 8 completing 7_9', () => {
    const hand = ts('789m456p123s111m99p');
    const waits = getWaitTypes(hand, w('8m'));
    expect(waits.has('closed')).toBe(true);
  });

  it('NOT closed wait when winning tile is at sequence end', () => {
    // 4 completing 234 — open wait, not closed
    const hand = ts('234m456p789s111m99p');
    const waits = getWaitTypes(hand, w('4m'));
    expect(waits.has('closed')).toBe(false);
  });
});

describe('WaitAnalyzer - intersection across decompositions', () => {
  it('returns single wait when only one decomp exists', () => {
    const hand = ts('123m456m789m234p99p');
    const waits = getWaitTypes(hand, w('9p'));
    expect(waits.has('single')).toBe(true);
  });

  it('handles complete hand without crashing', () => {
    const hand = ts('123m456p789s111m99p');
    const waits = getWaitTypes(hand, w('9p'));
    expect(waits).toBeInstanceOf(Set);
  });
});

describe('WaitAnalyzer - empty/invalid', () => {
  it('returns empty for non-winning hand', () => {
    const hand = ts('11m22p33s44m55p66s78s');
    const waits = getWaitTypes(hand, w('9s'));
    expect(waits.size).toBe(0);
  });
});
