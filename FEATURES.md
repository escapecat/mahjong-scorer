# Feature Roadmap

Possible features to add, ranked by effort vs value.

---

## 🟢 Quick wins (a few hours each)

| # | Feature | Why useful |
|---|---|---|
| 1 | **Paste text → load hand** — input `123m456p789sEEE99p` to fill the calculator | Faster than tapping 14 tiles; copy hands from chats |
| 2 | **Copy result as text** — "我和了 28番: 清一色 + 一色三同顺 + ..." | Share to WeChat / save as note |
| 3 | **Hand history** — last 10 calculated hands, click to restore | Recover from accidental clear; compare hands |
| 4 | **Sort hand tiles** — 万 then 筒 then 条 then 字 (currently random order) | Easier to read |
| 5 | **Better empty state** — show example hands when calculator is empty | Helps new users |

---

## 🟡 Medium effort, high value (1–2 days each)

| # | Feature | Why useful |
|---|---|---|
| 7 | **Practice mode (quiz)** — random hand → user guesses score → engine verifies | Biggest learning tool; differentiates from a plain calculator |
| 8 | **Discard suggestions** — given 14 tiles, rank which to discard for best tenpai | Useful during play |
| 9 | **Hand strength meter** — "Currently 23番. Discarding X gets you closer to 大四喜" | Gamifies improvement |
| 10 | **Share as image** — render decomp + score to a PNG | Better than text for chat sharing |
| 11 | **Tile shorthand input** — type `中中中` instead of clicking 3 dragon tiles | Faster honor input |
| 12 | **Wait tile filter** — "show only winning tiles ≥ 8 番" | Focus on winnable hands |

---

## 🟠 Bigger features (multiple days)

| # | Feature | Why useful |
|---|---|---|
| 13 | **English / bilingual mode** — translate UI + 81 fan names | International audience |
| 14 | **Tutorial / interactive guide** — "tap here to build 清龙 step by step" | Onboarding for beginners |
| 15 | **Statistics dashboard** — "you've calculated 500 hands, average 12.3 番, highest 88 番" | Engagement |
| 16 | **Game session tracking** — track multiple games' wins/losses across friends | For tournaments |
| 17 | **Save / load named hands** — "my best hand", "tricky case from last week" | Reference library |

---

## 🔵 Polish (small but pleasant)

| # | Feature | Why useful |
|---|---|---|
| 18 | **Sound effects** — soft tile click + win celebration | Tactile feel |
| 19 | **Dark mode toggle** | Personal preference |
| 20 | **Larger tile mode** (accessibility) | Older users / poor vision |
| 21 | **Keyboard shortcuts** — `M`/`P`/`S` + digits, Enter to calc | Power users |

---

## ❌ Considered but skipped

| Feature | Why skipped |
|---|---|
| **Tile photo OCR** | Needs ~10MB ML model (kills bundle size advantage) or paid OCR API. Real-world accuracy is poor without controlled lighting. |
| **Cloud sync across devices** | Requires backend, accounts, login. Massive scope creep for a personal tool. |
| **Multiplayer / online play** | Whole different app. |
| **AI opponent** | Whole different app, requires game engine + AI. |
| **Live game tracking (companion app)** | Niche use case, complex UI. |
| **Tile counter (remaining in wall)** | App only sees your hand, not other players' discards. Without manually inputting discards, the count is misleading. The 4-tile cap is already enforced via disabled buttons. |

---

## Recommended order for next iteration

1. **#1, #2, #3** (text input + copy result + hand history) — half a day total, dramatically improves usability
2. **#7 (practice mode)** — the standout feature that makes this app a learning tool, not just a calculator
3. Everything else only when users ask for it
