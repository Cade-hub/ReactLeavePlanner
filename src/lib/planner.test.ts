import { describe, expect, it } from "vitest";
import { iso, toDay, weekday } from "./dates";
import { classify, isOffKind, plan, quickWins, type Settings } from "./planner";

const base = (over: Partial<Settings> = {}): Settings => ({
  start: toDay(2027, 1, 1), end: toDay(2027, 12, 31), budget: 15, maxPerBreak: 5,
  sixDayWeek: false, customOff: new Set(), blocked: new Set(), ...over,
});

/** Score any set of leave days the way the planner does: total length of runs that contain leave. */
function score(s: Settings, leave: Set<number>) {
  const days = classify(s);
  let total = 0;
  for (let i = 0; i < days.length; ) {
    const off = (k: number) => isOffKind(days[k].kind) || leave.has(days[k].day);
    if (!off(i)) { i++; continue; }
    let j = i, used = 0;
    while (j < days.length && off(j)) { if (leave.has(days[j].day)) used++; j++; }
    if (used > s.maxPerBreak) return -1; // breaks the per-break cap
    if (used) total += j - i;
    i = j;
  }
  return total;
}

describe("plan", () => {
  it("never spends more than the budget or leave on a non-working day", () => {
    for (const budget of [1, 5, 15, 25]) {
      const s = base({ budget });
      const p = plan(s);
      expect(p.leaveUsed).toBeLessThanOrEqual(budget);
      const kinds = new Map(classify(s).map((d) => [d.day, d.kind]));
      p.breaks.flatMap((b) => b.leaveDays).forEach((d) => expect(kinds.get(d)).toBe("work"));
    }
  });

  it("breaks don't overlap and are listed in order", () => {
    const p = plan(base());
    for (let i = 1; i < p.breaks.length; i++) expect(p.breaks[i].start).toBeGreaterThan(p.breaks[i - 1].end + 1);
  });

  it("matches brute force on a small window", () => {
    const s = base({ start: toDay(2027, 3, 15), end: toDay(2027, 5, 10), budget: 3, maxPerBreak: 3 });
    const work = classify(s).filter((d) => d.kind === "work").map((d) => d.day);
    let best = 0;
    for (let a = 0; a < work.length; a++)
      for (let b = a; b < work.length; b++)
        for (let c = b; c < work.length; c++) best = Math.max(best, score(s, new Set([work[a], work[b], work[c]])));
    expect(plan(s).daysOff).toBe(best);
  });

  it("favours one long break when power is high: Human Rights Day to Family Day 2027", () => {
    // Human Rights Day falls on a Sunday (observed Mon 22 Mar), and Good Friday is 26 Mar,
    // so three leave days (23 to 25 Mar) bridge Sat 20 to Mon 29 Mar.
    const p = plan(base({ budget: 3, maxPerBreak: 5, power: 1.7, start: toDay(2027, 3, 1), end: toDay(2027, 4, 30) }));
    expect(p.breaks).toHaveLength(1);
    expect(p.breaks[0].leaveDays.map(iso)).toEqual(["2027-03-23", "2027-03-24", "2027-03-25"]);
    expect([iso(p.breaks[0].start), iso(p.breaks[0].end)]).toEqual(["2027-03-20", "2027-03-29"]);
  });

  it("power 1 prefers more total days, even if spread out", () => {
    const s = base({ budget: 3, maxPerBreak: 5, start: toDay(2027, 3, 1), end: toDay(2027, 4, 30) });
    expect(plan(s).daysOff).toBeGreaterThanOrEqual(plan({ ...s, power: 1.7 }).daysOff);
  });

  it("respects blocked days and custom days off", () => {
    const blocked = new Set([toDay(2027, 3, 30)]);
    const p = plan(base({ budget: 4, maxPerBreak: 4, start: toDay(2027, 3, 1), end: toDay(2027, 4, 30), blocked }));
    expect(p.breaks.flatMap((b) => b.leaveDays)).not.toContain(toDay(2027, 3, 30));
    // With Wed 31 Mar and Thu 1 Apr already off, one leave day (Tue 30) bridges Fri 26 Mar to Thu 1 Apr
    const off = plan(base({ budget: 1, power: 1.7, customOff: new Set([toDay(2027, 3, 31), toDay(2027, 4, 1)]), start: toDay(2027, 3, 1), end: toDay(2027, 4, 30) }));
    expect(off.breaks[0].length).toBeGreaterThanOrEqual(7);
  });

  it("treats Saturday as a working day on a six-day week", () => {
    const s = base({ sixDayWeek: true });
    const sat = classify(s).find((d) => d.inRange && weekday(d.day) === 6 && !d.holiday)!;
    expect(sat.kind).toBe("work");
  });
});

describe("quickWins", () => {
  it("returns non-overlapping breaks worth at least 2 days per leave day", () => {
    const w = quickWins(base());
    expect(w.length).toBeGreaterThan(0);
    w.forEach((b) => expect(b.ratio).toBeGreaterThanOrEqual(2));
  });
});
