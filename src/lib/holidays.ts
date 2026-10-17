import { type Day, toDay, weekday } from "./dates";

/*
 * South African public holidays, per the Public Holidays Act 36 of 1994.
 *
 * - Twelve statutory holidays: ten on fixed dates, plus Good Friday and
 *   Family Day, which move with Easter.
 * - The Sunday rule (s.2(1)): when a public holiday falls on a Sunday, the
 *   following Monday is a public holiday.
 * - Once-off holidays declared by the President (s.2A) can't be predicted,
 *   so they live in SPECIAL_HOLIDAYS below.
 *
 * ── Keeping this up to date ───────────────────────────────────────────────
 * When the President declares a new holiday (elections and so on), add one
 * line to SPECIAL_HOLIDAYS and bump HOLIDAYS_LAST_CHECKED. That's the only
 * maintenance this calendar needs.
 */

export const HOLIDAYS_LAST_CHECKED = "October 2026";

export interface Holiday {
  day: Day;
  name: string;
  /** Moved from a Sunday to the Monday. */
  observed?: boolean;
  /** Once-off holiday declared by the President. */
  special?: boolean;
}

const FIXED: [month: number, day: number, name: string][] = [
  [1, 1, "New Year's Day"],
  [3, 21, "Human Rights Day"],
  [4, 27, "Freedom Day"],
  [5, 1, "Workers' Day"],
  [6, 16, "Youth Day"],
  [8, 9, "National Women's Day"],
  [9, 24, "Heritage Day"],
  [12, 16, "Day of Reconciliation"],
  [12, 25, "Christmas Day"],
  [12, 26, "Day of Goodwill"],
];

export const SPECIAL_HOLIDAYS: { date: [number, number, number]; name: string }[] = [
  { date: [2014, 5, 7], name: "National Elections" },
  { date: [2016, 8, 3], name: "Local Government Elections" },
  { date: [2016, 12, 27], name: "Christmas holiday (declared)" },
  { date: [2019, 5, 8], name: "National Elections" },
  { date: [2021, 11, 1], name: "Local Government Elections" },
  { date: [2022, 12, 27], name: "Christmas holiday (declared)" },
  { date: [2023, 12, 15], name: "Rugby World Cup victory" },
  { date: [2024, 5, 29], name: "National Elections" },
  { date: [2026, 11, 4], name: "Local Government Elections" },
];

/** Western (Gregorian) Easter Sunday, using the anonymous Gregorian algorithm. */
export function easterSunday(year: number): Day {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return toDay(year, month, day);
}

const cache = new Map<number, Holiday[]>();

export function holidaysForYear(year: number): Holiday[] {
  const hit = cache.get(year);
  if (hit) return hit;

  const easter = easterSunday(year);
  const list: Holiday[] = FIXED.map(([m, d, name]) => ({ day: toDay(year, m, d), name }));
  list.push({ day: easter - 2, name: "Good Friday" }, { day: easter + 1, name: "Family Day" });

  const taken = new Set(list.map((h) => h.day));
  // Sunday rule. If the Monday is already a holiday (Christmas on a Sunday),
  // the Act adds nothing extra. The Tuesday has always come from a separate
  // declaration (2011, 2016, 2022), which goes in SPECIAL_HOLIDAYS.
  for (const h of [...list]) {
    if (weekday(h.day) === 0 && !taken.has(h.day + 1)) {
      list.push({ day: h.day + 1, name: `${h.name} (observed)`, observed: true });
      taken.add(h.day + 1);
    }
  }
  for (const s of SPECIAL_HOLIDAYS) {
    if (s.date[0] !== year) continue;
    const day = toDay(...s.date);
    if (!taken.has(day)) {
      list.push({ day, name: s.name, special: true });
      taken.add(day);
    }
  }

  list.sort((a, b) => a.day - b.day);
  cache.set(year, list);
  return list;
}

/** All holidays between two days (inclusive), keyed by day. */
export function holidayMap(from: Day, to: Day): Map<Day, Holiday> {
  const map = new Map<Day, Holiday>();
  const y0 = new Date(from * 86_400_000).getUTCFullYear();
  const y1 = new Date(to * 86_400_000).getUTCFullYear();
  for (let y = y0; y <= y1; y++) {
    for (const h of holidaysForYear(y)) if (h.day >= from && h.day <= to) map.set(h.day, h);
  }
  return map;
}
