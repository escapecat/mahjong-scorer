# 国标麻将算番器

A Chinese National Standard Mahjong (国标麻将) scoring calculator.

Built with **Taro + React + TypeScript**. Compiles to both H5 web and WeChat Mini Program.

## Features

- 81 fan rules covering the complete Chinese National Standard
- Tenpai (听牌) detection with score preview for each waiting tile
- Win-tile highlighting in the decomposition view
- Fan reference table (番表) with examples for all 81 fans
- State persistence across page reloads
- Pure client-side, works offline

## Development

```bash
npm install
npm run dev:h5         # H5 dev build
npm run build:h5       # H5 production build
npm run build:weapp    # WeChat Mini Program build
npm test               # Run engine tests
```

## Architecture

- `src/engine/` — Pure TypeScript scoring engine (no framework dependency)
  - `models/` — Tile, Meld, TileSet types
  - `rules/` — Fan rule definitions (~73 standard + 5 special hands)
  - `decomposer.ts` — Hand decomposition + win detection
  - `evaluator.ts` — Orchestrator: decompose → match rules → exclusions → score
  - `waitAnalyzer.ts` — Wait type detection (边张/坎张/单钓将)
  - `shantenCalculator.ts` — Shanten number calculation
- `src/components/` — Taro React components
- `src/pages/` — Pages (calculator, fan table)

## Tests

270 tests across 12 files covering tiles, decomposition, fan recognition,
exclusion cascades, boundary conditions, edge cases, wait analysis, and shanten.
