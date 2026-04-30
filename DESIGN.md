# MahjongScorer2 Design Document

## Overview

Chinese National Standard Mahjong (国标麻将) scoring calculator.
Built with **Taro + React + TypeScript**. Compiles to both H5 web and WeChat Mini Program.

Core principle: **decompose first, evaluate second**.
All fan detectors work on resolved meld lists — no re-parsing, no patch arrays.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Taro 4 + React 18 |
| Language | TypeScript (strict) |
| Styling | CSS Modules (rpx units for cross-platform) |
| State | React Context + useReducer |
| Testing | Vitest |
| Build | Taro CLI → H5 / WeChat Mini Program |
| Deploy (Phase 1) | Gitee Pages (H5) |
| Deploy (Phase 2) | WeChat Mini Program |

---

## 1. Tile Model

### 1.1 Suit

```typescript
type Suit = 'man' | 'pin' | 'sou' | 'wind' | 'dragon';
```

- `man` (万), `pin` (筒/饼), `sou` (条) — rank 0-8 (display 1-9)
- `wind` — rank 0-3 (East/South/West/North)
- `dragon` — rank 0-2 (Zhong/Fa/Bai)

### 1.2 Tile

```typescript
interface Tile {
  suit: Suit;
  rank: number;
}

// Pre-built tile constants for convenience
const Tiles = {
  man: (r: number): Tile => ({ suit: 'man', rank: r }),
  pin: (r: number): Tile => ({ suit: 'pin', rank: r }),
  sou: (r: number): Tile => ({ suit: 'sou', rank: r }),
  wind: (r: number): Tile => ({ suit: 'wind', rank: r }),
  dragon: (r: number): Tile => ({ suit: 'dragon', rank: r }),
  East: { suit: 'wind', rank: 0 },
  South: { suit: 'wind', rank: 1 },
  West: { suit: 'wind', rank: 2 },
  North: { suit: 'wind', rank: 3 },
  Zhong: { suit: 'dragon', rank: 0 },
  Fa: { suit: 'dragon', rank: 1 },
  Bai: { suit: 'dragon', rank: 2 },
} as const;

// Tile utility functions
function tileIndex(t: Tile): number;          // 0-33
function tileFromIndex(i: number): Tile;
function tileEquals(a: Tile, b: Tile): boolean;
function isNumberSuit(t: Tile): boolean;
function isTerminal(t: Tile): boolean;
function isHonor(t: Tile): boolean;
function isSimple(t: Tile): boolean;
function tileToCode(t: Tile): string;         // "1m", "E", "C"
function tileToDisplay(t: Tile): string;      // "1万", "东", "中"
```

### 1.3 TileSet (replaces int[34])

```typescript
class TileSet {
  private counts: number[] = new Array(34).fill(0);

  get(tile: Tile): number;
  set(tile: Tile, n: number): void;
  add(tile: Tile, n?: number): void;
  remove(tile: Tile, n?: number): void;
  total(): number;
  clone(): TileSet;

  // Iteration
  nonZero(): Array<{ tile: Tile; count: number }>;
  distinctTiles(): Tile[];

  // Queries
  hasOnlySuit(suit: Suit): boolean;
  suitsPresent(): number;
  hasHonors(): boolean;
  // etc.

  // Internal access for algorithms
  rawCounts(): readonly number[];
}
```

---

## 2. Meld Model

### 2.1 MeldType

```typescript
type MeldType = 'sequence' | 'triplet' | 'kong';
```

### 2.2 Meld

```typescript
interface Meld {
  type: MeldType;
  start: Tile;    // first tile (lowest). For triplet/kong, all tiles are the same.
  isOpen: boolean;
}

function meldTiles(m: Meld): Tile[];
function isTripletOrKong(m: Meld): boolean;
function meldContains(m: Meld, t: Tile): boolean;
```

### 2.3 HandDecomposition

```typescript
interface HandDecomposition {
  pair: Tile;
  melds: Meld[];  // locked melds first, then hand-derived melds
}
```

---

## 3. Hand Decomposer

```typescript
function decomposeHand(
  handTiles: TileSet,      // hand tiles only (melds already subtracted)
  lockedMelds: Meld[]
): HandDecomposition[];
```

Key: caller passes hand-only tiles. Meld subtraction done once at top level.

---

## 4. Fan Rule System

### 4.1 Interface

```typescript
interface FanRule {
  name: string;          // "清龙"
  points: number;        // 16
  description: string;
  excludes: string[];    // fan names this rule suppresses

  /** 0 = no match, 1+ = number of times it applies */
  match(ctx: FanContext): number;
}
```

### 4.2 FanContext

```typescript
interface FanContext {
  allCounts: TileSet;                  // all tiles (hand + melds)
  handCounts: TileSet;                 // hand tiles only
  decomposition: HandDecomposition;
  game: GameContext;
}

interface GameContext {
  isSelfDraw: boolean;
  winningTile: Tile | null;
  seatWind: Tile;
  roundWind: Tile;
  flowerCount: number;
  isLastTile: boolean;
  isKongDraw: boolean;
  isRobbingKong: boolean;
  isWinningTileLast: boolean;
  mingKongCount: number;
  anKongCount: number;
  chiCount: number;
  pengCount: number;
}
```

### 4.3 Special Hands

```typescript
interface SpecialHandRule {
  name: string;
  points: number;

  isMatch(counts: TileSet, game: GameContext): boolean;

  evaluate(counts: TileSet, game: GameContext): {
    fans: Array<{ name: string; points: number; description: string }>;
    tileGroups: Tile[][];   // for UI rendering
  };
}
```

Special hands (十三幺, 七对, 七星不靠, 全不靠, 组合龙) bypass standard decomposition.
They produce their own fans + tile groups, then additionally check applicable standard rules
(e.g., 七对 still checks tile-property fans like 清一色).

### 4.4 Rule Registry

```typescript
const allFanRules: FanRule[] = [
  // 88番
  daSiXi, daSanYuan, lvYiSe, jiuLianBaoDeng, siGang, lianQiDui, shiSanYao,
  // 64番
  qingYaoJiu, xiaoSiXi, xiaoSanYuan, ziYiSe, siAnKe, yiSeShuangLongHui,
  // ...all 60+ rules
];

const specialHandRules: SpecialHandRule[] = [
  shiSanYaoRule, qiXingBuKaoRule, quanBuKaoRule,
  qiDuiRule, lianQiDuiRule, zuHeLongRule,
];
```

Rules ordered by priority (highest points first).

---

## 5. Fan Evaluator (Orchestrator)

```
Input: TileSet allCounts, Meld[] lockedMelds, GameContext game
                    |
    +---------------+---------------+
    |   Check special hands          |
    |   Each produces a candidate    |
    +---------------+---------------+
                    |
    +---------------+---------------+
    |   Subtract locked melds        |
    |   HandDecomposer.decompose()   |
    |   Each decomp is a candidate   |
    +---------------+---------------+
                    |
    +---------------+---------------+
    |   For each candidate:          |
    |   1. Run all FanRule.match()   |
    |   2. Apply exclusions          |
    |   3. Handle 无番和 (8 pts)     |
    |   4. Compute total             |
    +---------------+---------------+
                    |
            Pick highest total
```

### 5.1 Exclusion Engine

```typescript
function applyExclusions(
  matched: Array<{ rule: FanRule; count: number }>
): Array<{ rule: FanRule; count: number }>;
```

Iterate in priority order. Each rule's `excludes` suppresses downstream rules.
A suppressed rule does NOT suppress others.

### 5.2 Result

```typescript
interface EvaluationResult {
  totalFan: number;
  fans: Array<{ name: string; points: number; description: string }>;
  decompositionDescription: string;
  tileGroups: Tile[][];
  winningTileGroupIndex: number;
}
```

---

## 6. Wait Analyzer & Shanten Calculator

```typescript
type WaitType = 'edge' | 'closed' | 'single';

function getWaitTypes(handTiles: TileSet, winningTile: Tile): Set<WaitType>;
function calculateShanten(handTiles: TileSet, meldCount: number): number;
```

Same algorithms as v1, using TileSet instead of raw arrays.

---

## 7. UI Layer

### 7.1 Component Structure

```
<App>
  <ScoreBar />              // total fan, status
  <SettingsPanel />         // 自摸/点炮, winds, flower, specials
  <HandDisplay />           // current hand tiles + melds
  <ResultDisplay />         // decomposition view + fan chips
  <WaitSuggestions />       // tenpai suggestions
  <TileKeyboard />          // tile input keyboard
```

### 7.2 Taro Cross-Platform

- Use `<View>`, `<Text>`, `<Image>` instead of HTML tags
- CSS uses `rpx` for responsive sizing (750rpx = screen width)
- Taro APIs for storage (`Taro.setStorageSync`) — works in both H5 and WeChat

### 7.3 State Management

```typescript
interface AppState {
  handCounts: TileSet;
  chiMelds: Meld[];
  pengMelds: Meld[];
  mingKongMelds: Meld[];
  anKongMelds: Meld[];
  isSelfDraw: boolean;
  seatWind: Tile;
  roundWind: Tile;
  flowerCount: number;
  winningTile: Tile | null;
  isLastTile: boolean;
  isKongDraw: boolean;
  isRobbingKong: boolean;
  isWinningTileLast: boolean;
  settingsOpen: boolean;
}

type Action =
  | { type: 'ADD_TILE'; tile: Tile }
  | { type: 'REMOVE_TILE'; tile: Tile }
  | { type: 'ADD_MELD'; meldType: 'chi' | 'peng' | 'mingKong' | 'anKong'; tile: Tile }
  | { type: 'REMOVE_MELD'; index: number; meldType: string }
  | { type: 'SET_SELF_DRAW'; value: boolean }
  | { type: 'SET_SEAT_WIND'; wind: Tile }
  | { type: 'SET_ROUND_WIND'; wind: Tile }
  | { type: 'CLEAR_ALL' }
  | /* ... */;
```

useReducer for predictable state transitions. Derived values (evaluation result,
win suggestions) computed via useMemo.

---

## 8. File Structure

```
MahjongScorer2/
├── src/
│   ├── engine/                    # Pure TypeScript, no framework dependency
│   │   ├── models/
│   │   │   ├── tile.ts
│   │   │   ├── meld.ts
│   │   │   ├── tileSet.ts
│   │   │   └── types.ts          # FanContext, GameContext, EvaluationResult
│   │   ├── decomposer.ts
│   │   ├── evaluator.ts
│   │   ├── exclusions.ts
│   │   ├── waitAnalyzer.ts
│   │   ├── shantenCalculator.ts
│   │   ├── rules/
│   │   │   ├── index.ts           # registry
│   │   │   ├── highFans.ts        # 88/64番
│   │   │   ├── meldPatterns.ts    # 碰碰和, 平和, 全带五, etc.
│   │   │   ├── sequencePatterns.ts
│   │   │   ├── tripletPatterns.ts
│   │   │   ├── tileProperties.ts  # 清一色, 断幺, etc.
│   │   │   ├── windDragon.ts
│   │   │   ├── kongs.ts
│   │   │   ├── concealed.ts       # 暗刻 fans
│   │   │   ├── situational.ts
│   │   │   └── specialHands.ts
│   │   └── __tests__/             # Engine tests (pure logic, no Taro)
│   │       ├── tile.test.ts
│   │       ├── tileSet.test.ts
│   │       ├── decomposer.test.ts
│   │       ├── waitAnalyzer.test.ts
│   │       ├── shanten.test.ts
│   │       ├── rules/
│   │       │   ├── highFans.test.ts
│   │       │   ├── meldPatterns.test.ts
│   │       │   ├── sequencePatterns.test.ts
│   │       │   ├── tileProperties.test.ts
│   │       │   ├── windDragon.test.ts
│   │       │   ├── situational.test.ts
│   │       │   └── specialHands.test.ts
│   │       ├── evaluator.test.ts
│   │       ├── exclusions.test.ts
│   │       └── helpers.ts          # Test builder utilities
│   ├── components/                # Taro React components
│   │   ├── ScoreBar.tsx
│   │   ├── SettingsPanel.tsx
│   │   ├── HandDisplay.tsx
│   │   ├── ResultDisplay.tsx
│   │   ├── WaitSuggestions.tsx
│   │   └── TileKeyboard.tsx
│   ├── pages/
│   │   └── index/
│   │       ├── index.tsx          # Home page
│   │       ├── index.module.css
│   │       └── useCalculator.ts   # State hook (useReducer + derived)
│   ├── assets/
│   │   └── tiles/                 # Tile images (copy from v1)
│   ├── app.ts
│   ├── app.config.ts
│   └── app.css
├── config/                        # Taro build config
│   ├── index.ts
│   ├── dev.ts
│   └── prod.ts
├── project.config.json            # WeChat Mini Program config
├── vitest.config.ts
├── tsconfig.json
├── package.json
└── DESIGN.md
```

### Key Separation

The `src/engine/` directory is **pure TypeScript** — no Taro, no React, no DOM.
It can be tested with Vitest directly, extracted as an npm package, or reused in any JS runtime.

The `src/components/` and `src/pages/` directories are the Taro/React UI layer.

---

## 9. Build Order

Phase 1 — Engine (no UI):
1. models: Tile, Meld, TileSet
2. decomposer
3. waitAnalyzer, shantenCalculator
4. fan rules (all 60+)
5. exclusion engine
6. evaluator orchestrator
7. full test suite

Phase 2 — UI:
8. Taro project scaffold
9. components (ScoreBar, TileKeyboard, etc.)
10. state management (useCalculator hook)
11. integration + manual testing

Phase 3 — Deploy:
12. H5 build → Gitee Pages
13. WeChat Mini Program build → submit for review
