# SA Leave Planner

A free South African leave planner. Tell it how many leave days you have and how you like your breaks, and it works out when to take them so you get the most days off in a row for the least leave.

**Live:** https://cade-hub.github.io/ReactLeavePlanner/

- Plans around every South African public holiday, including the Sunday-to-Monday rule and once-off declared days such as election days.
- Picks the best set of breaks for your whole leave budget, not just the single best one.
- Three styles: lots of long weekends, a good mix, or a few long breaks.
- Tap any weekday to mark it as already off (a company shutdown) or as a day you can't take leave.
- Six-day work week option.
- Export your breaks to Google, Outlook or Apple calendar (.ics), and share a plan with a link.
- Dark and light mode. Runs entirely in your browser, with no server and no tracking.

## Running it

```bash
npm install
npm run dev      # http://localhost:5210/ReactLeavePlanner/
npm test         # holiday rules and planner tests
npm run build
npm run deploy   # tests, builds and publishes dist/ to the gh-pages branch
```

## How it works

Holidays come from the Public Holidays Act 36 of 1994 (`src/lib/holidays.ts`): ten fixed dates, Good Friday and Family Day (from Easter), and the Sunday rule. Once-off holidays declared by the President are listed in `SPECIAL_HOLIDAYS`. **When a new one is announced, add a line there.**

The planner (`src/lib/planner.ts`) lists every way to spend 1 to N consecutive working days of leave, stretched over the weekends and holidays either side. It then picks the non-overlapping set that scores best within your budget, using a knapsack over weighted intervals. Longer breaks can be weighted more heavily, so "a few long breaks" prefers one 10-day trip over two 5-day ones.

## History

v1 used a hand-maintained `calendar.json` for 2024 and an Express API on Render. v2 replaces both with a rules-based holiday engine that runs in the browser for any year.
