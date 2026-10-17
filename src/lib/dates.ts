// Days are plain integers (days since 1970-01-01, UTC), so arithmetic never
// trips over time zones or daylight saving.

export type Day = number;

const MS = 86_400_000;

export const toDay = (y: number, m: number, d: number): Day => Math.round(Date.UTC(y, m - 1, d) / MS);

export const fromDate = (date: Date): Day => toDay(date.getFullYear(), date.getMonth() + 1, date.getDate());

export const today = (): Day => fromDate(new Date());

export const ymd = (day: Day) => {
  const dt = new Date(day * MS);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
};

/** 0 = Sunday … 6 = Saturday (1 Jan 1970 was a Thursday). */
export const weekday = (day: Day) => (((day + 4) % 7) + 7) % 7;

export const iso = (day: Day) => {
  const { y, m, d } = ymd(day);
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
};

export const parseIso = (s: string): Day | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const day = toDay(+m[1], +m[2], +m[3]);
  return iso(day) === s ? day : null;
};

export const endOfYear = (y: number) => toDay(y, 12, 31);
export const startOfYear = (y: number) => toDay(y, 1, 1);
export const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/** Same calendar day next year, clamped (29 Feb → 28 Feb). */
export const addYears = (day: Day, n: number) => {
  const { y, m, d } = ymd(day);
  return toDay(y + n, m, Math.min(d, daysInMonth(y + n, m)));
};

const fmt = (opts: Intl.DateTimeFormatOptions) => {
  const f = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", ...opts });
  return (day: Day) => f.format(new Date(day * MS));
};

export const fmtShort = fmt({ weekday: "short", day: "numeric", month: "short" }); // Fri, 3 Apr
export const fmtDayMonth = fmt({ day: "numeric", month: "short" }); // 3 Apr
export const fmtLong = fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" });
export const fmtMonth = fmt({ month: "long" });
export const fmtMonthYear = fmt({ month: "long", year: "numeric" });
export const fmtWeekday = fmt({ weekday: "short" });
