# CLAUDE.md: SA Leave Planner

A free, client-side South African leave planner. Vite, React 18 and TypeScript, with no backend. Deployed to GitHub Pages at `/ReactLeavePlanner/`.

## Commands
- `npm run dev`: dev server on http://localhost:5210/ReactLeavePlanner/ (strict port; the base path matters)
- `npm test`: vitest, covering holiday rules and the optimiser (including a brute-force check)
- `npm run build`: `tsc --noEmit`, then the Vite build to `dist/`
- `npm run deploy`: test, build, then `gh-pages -d dist`. This publishes live, so only run it when the owner asks.

## Layout
- `src/lib/dates.ts`: days are **integers** (days since 1970-01-01 UTC). Do all date maths on these. Never use local `Date` arithmetic, because of time-zone and DST drift. All formatting goes through `Intl` with `timeZone: "UTC"`, `en-GB`.
- `src/lib/holidays.ts`: Public Holidays Act rules, Easter, the Sunday rule, and `SPECIAL_HOLIDAYS`.
- `src/lib/planner.ts`: `classify` (each day's kind), `plan` (knapsack over interval candidates), `quickWins`, `freeLongWeekends`.
- `src/lib/state.ts`: app state, break styles (`STYLES`: maxPerBreak and power), period options, URL encode/decode.
- `src/lib/ics.ts`: calendar export.
- `src/components/*`: one component per section. `App.tsx` owns the state and keeps it in the URL query string.
- `src/styles.css`: a single stylesheet with design tokens on `:root` and `[data-theme="dark"]`. The theme is set before paint by the inline script in `index.html` (localStorage key `lp-theme`).

## Keeping holidays current
When the President declares a once-off holiday (elections and so on), add it to `SPECIAL_HOLIDAYS` in `src/lib/holidays.ts`, bump `HOLIDAYS_LAST_CHECKED`, and add a test if it's notable. If 25 Dec falls on a Sunday, the Act adds nothing extra, because Monday 26 Dec is already a holiday. The Tuesday has always come from a separate declaration, so add it as a special when it's announced. Don't auto-add it.

## Planner rules worth knowing
- A candidate break is a run of 1..maxPerBreak working days of leave, stretched over the off days either side. Because the stretch is maximal, non-overlapping breaks always have a working day between them.
- Score = sum(length^power) * 1000 − leave, so a power above 1 favours days off in a row, and leave is the tie-breaker.
- Days outside the chosen range are `blocked` (no leave there), but breaks may run into ±14 padding days over weekends and holidays.
- Changing the objective or styles? Keep the brute-force test in `planner.test.ts` passing (it uses power 1).

## Style
- The product voice is plain, friendly and short. No hype. The UI is one editable sentence, then the answer.
- Palette: warm neutrals with green (`--accent`, leave) and amber (`--sun`, public holidays). Typography is Instrument Sans for the UI and Instrument Serif italic for the big numbers.
- Respect `prefers-reduced-motion`. Keep it working on 360px-wide phones with no horizontal scroll.
