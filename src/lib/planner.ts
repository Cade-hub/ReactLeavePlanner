import { type Day, weekday } from "./dates";
import { type Holiday, holidayMap } from "./holidays";

export type Kind = "work" | "weekend" | "holiday" | "off" | "blocked";

export interface Settings {
  start: Day;
  end: Day;
  /** Leave days available to spend. */
  budget: number;
  /** Most leave days to spend on a single break. */
  maxPerBreak: number;
  /** Saturday is a working day (common in retail and some trades). */
  sixDayWeek: boolean;
  /** Weekdays you're already off (company shutdown, a bridging day). */
  customOff: Set<Day>;
  /** Weekdays you can't take leave (deadlines, exams, cover). */
  blocked: Set<Day>;
  /**
   * How much longer breaks are favoured. 1 maximises total days off; above 1
   * rewards days off in a row (a 10-day break beats two 5-day ones).
   */
  power?: number;
}

export interface DayInfo {
  day: Day;
  kind: Kind;
  holiday?: Holiday;
  inRange: boolean;
}

export interface Break {
  start: Day;
  end: Day;
  leaveDays: Day[];
  /** Days off in a row, including weekends and holidays. */
  length: number;
  leave: number;
  holidays: Holiday[];
  /** Days off per leave day. */
  ratio: number;
}

export interface Plan {
  breaks: Break[];
  leaveUsed: number;
  daysOff: number;
  ratio: number;
}

/* Breaks may run past the edge of the range over off days, so a range that
   starts on a Monday still counts the weekend before it. */
const PAD = 14;

export const isOffKind = (k: Kind) => k === "weekend" || k === "holiday" || k === "off";

export function classify(s: Settings): DayInfo[] {
  const from = s.start - PAD, to = s.end + PAD;
  const hols = holidayMap(from, to);
  const days: DayInfo[] = [];
  for (let day = from; day <= to; day++) {
    const wd = weekday(day);
    const inRange = day >= s.start && day <= s.end;
    const holiday = hols.get(day);
    let kind: Kind = "work";
    if (holiday) kind = "holiday";
    else if (wd === 0 || (wd === 6 && !s.sixDayWeek)) kind = "weekend";
    else if (s.customOff.has(day)) kind = "off";
    else if (s.blocked.has(day) || !inRange) kind = "blocked"; // can't take leave outside the range
    days.push({ day, kind, holiday, inRange });
  }
  return days;
}

interface Candidate { lo: number; hi: number; i: number; j: number; leave: number; length: number }

/** Every way to spend 1..maxPerBreak consecutive working days, stretched over the off days on either side. */
function candidates(days: DayInfo[], maxPerBreak: number): Candidate[] {
  const out: Candidate[] = [];
  const n = days.length;
  for (let i = 0; i < n; i++) {
    if (days[i].kind !== "work") continue;
    let leave = 0;
    for (let j = i; j < n; j++) {
      const k = days[j].kind;
      if (k === "blocked") break;
      if (k !== "work") continue;
      if (++leave > maxPerBreak) break;
      let lo = i, hi = j;
      while (lo > 0 && isOffKind(days[lo - 1].kind)) lo--;
      while (hi < n - 1 && isOffKind(days[hi + 1].kind)) hi++;
      out.push({ lo, hi, i, j, leave, length: hi - lo + 1 });
    }
  }
  return out;
}

function toBreak(days: DayInfo[], c: Candidate): Break {
  const leaveDays: Day[] = [];
  const holidays: Holiday[] = [];
  for (let x = c.lo; x <= c.hi; x++) {
    if (x >= c.i && x <= c.j && days[x].kind === "work") leaveDays.push(days[x].day);
    if (days[x].holiday) holidays.push(days[x].holiday!);
  }
  return { start: days[c.lo].day, end: days[c.hi].day, leaveDays, length: c.length, leave: c.leave, holidays, ratio: c.length / c.leave };
}

/**
 * The best plan for a leave budget: non-overlapping breaks that maximise
 * sum(length ^ power), using the fewest leave days among equally good plans.
 *
 * A 0/1 knapsack over weighted intervals. Candidates are sorted by end, and
 * best[j][b] is the best score using the first j candidates and at most b
 * leave days. Each leave day costs a tiny penalty, so ties go to the cheaper plan.
 */
export function plan(s: Settings): Plan {
  const days = classify(s);
  const budget = Math.max(0, Math.floor(s.budget));
  const cands = candidates(days, Math.max(1, s.maxPerBreak)).sort((a, b) => a.hi - b.hi || a.lo - b.lo);
  const m = cands.length, W = budget + 1, power = s.power ?? 1;
  if (!m || !budget) return { breaks: [], leaveUsed: 0, daysOff: 0, ratio: 0 };

  // prev[j] = how many candidates end strictly before candidate j starts.
  // Maximal stretching means non-overlapping breaks always have a working day between them.
  const ends = cands.map((c) => c.hi);
  const prev = new Int32Array(m);
  for (let j = 0; j < m; j++) {
    let lo = 0, hi = j;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (ends[mid] < cands[j].lo) lo = mid + 1; else hi = mid; }
    prev[j] = lo;
  }

  const best = new Float64Array((m + 1) * W);
  const took = new Uint8Array((m + 1) * W);
  for (let j = 1; j <= m; j++) {
    const c = cands[j - 1], row = j * W, back = prev[j - 1] * W, gain = Math.pow(c.length, power) * 1000 - c.leave;
    for (let b = 0; b < W; b++) {
      const skip = best[row - W + b];
      const take = b >= c.leave ? best[back + b - c.leave] + gain : -Infinity;
      if (take > skip) { best[row + b] = take; took[row + b] = 1; } else best[row + b] = skip;
    }
  }

  const chosen: Candidate[] = [];
  for (let j = m, b = budget; j > 0; ) {
    if (took[j * W + b]) { const c = cands[j - 1]; chosen.push(c); b -= c.leave; j = prev[j - 1]; }
    else j--;
  }
  const breaks = chosen.reverse().map((c) => toBreak(days, c));
  const leaveUsed = breaks.reduce((n, b) => n + b.leave, 0);
  const daysOff = breaks.reduce((n, b) => n + b.length, 0);
  return { breaks, leaveUsed, daysOff, ratio: leaveUsed ? daysOff / leaveUsed : 0 };
}

/** The best value short breaks (up to 4 leave days), ranked by days off per leave day. */
export function quickWins(s: Settings, limit = 8): Break[] {
  const days = classify(s);
  const cands = candidates(days, Math.min(4, Math.max(1, s.maxPerBreak)))
    .filter((c) => c.length >= 4 && c.length / c.leave >= 2)
    .sort((a, b) => b.length / b.leave - a.length / a.leave || b.length - a.length || a.lo - b.lo);
  const picked: Candidate[] = [];
  for (const c of cands) {
    if (picked.length >= limit) break;
    if (picked.every((p) => c.hi < p.lo || c.lo > p.hi)) picked.push(c);
  }
  return picked.map((c) => toBreak(days, c));
}

/** Long weekends you get for free: runs of 3+ days off that include a public holiday. */
export function freeLongWeekends(s: Settings): { start: Day; end: Day; holidays: Holiday[] }[] {
  const days = classify(s);
  const out: { start: Day; end: Day; holidays: Holiday[] }[] = [];
  for (let i = 0; i < days.length; ) {
    if (!isOffKind(days[i].kind)) { i++; continue; }
    let j = i;
    while (j + 1 < days.length && isOffKind(days[j + 1].kind)) j++;
    const run = days.slice(i, j + 1);
    const hols = run.flatMap((d) => (d.holiday ? [d.holiday] : []));
    if (run.length >= 3 && hols.length && run.some((d) => d.inRange)) out.push({ start: days[i].day, end: days[j].day, holidays: hols });
    i = j + 1;
  }
  return out;
}
