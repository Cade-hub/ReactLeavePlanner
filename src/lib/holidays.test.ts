import { describe, expect, it } from "vitest";
import { iso, toDay, weekday } from "./dates";
import { easterSunday, holidaysForYear } from "./holidays";

const list = (y: number) => holidaysForYear(y).map((h) => `${iso(h.day)} ${h.name}`);

describe("easterSunday", () => {
  it.each([
    [2019, "2019-04-21"], [2024, "2024-03-31"], [2025, "2025-04-20"], [2026, "2026-04-05"],
    [2027, "2027-03-28"], [2028, "2028-04-16"], [2030, "2030-04-21"], [2038, "2038-04-25"],
  ])("%i → %s", (y, date) => expect(iso(easterSunday(y))).toBe(date));
});

describe("holidaysForYear", () => {
  it("2026 has the 12 statutory days, the Women's Day Monday, and election day", () => {
    expect(list(2026)).toEqual([
      "2026-01-01 New Year's Day",
      "2026-03-21 Human Rights Day",
      "2026-04-03 Good Friday",
      "2026-04-06 Family Day",
      "2026-04-27 Freedom Day",
      "2026-05-01 Workers' Day",
      "2026-06-16 Youth Day",
      "2026-08-09 National Women's Day",
      "2026-08-10 National Women's Day (observed)",
      "2026-09-24 Heritage Day",
      "2026-11-04 Local Government Elections",
      "2026-12-16 Day of Reconciliation",
      "2026-12-25 Christmas Day",
      "2026-12-26 Day of Goodwill",
    ]);
  });

  it("moves a Sunday holiday to Monday (New Year 2023)", () => {
    expect(list(2023)).toContain("2023-01-02 New Year's Day (observed)");
  });

  it("doesn't double-book when the Monday is already a holiday, but keeps the declared 27 Dec 2022", () => {
    const l = list(2022);
    expect(l).toContain("2022-12-26 Day of Goodwill");
    expect(l).toContain("2022-12-27 Christmas holiday (declared)");
    expect(l.filter((x) => x.startsWith("2022-12-26"))).toHaveLength(1);
  });

  it("includes once-off election days", () => {
    expect(list(2024)).toContain("2024-05-29 National Elections");
  });

  it("every holiday is in its own year and dates are unique", () => {
    for (let y = 2020; y <= 2035; y++) {
      const days = holidaysForYear(y).map((h) => h.day);
      expect(new Set(days).size).toBe(days.length);
      expect(days.every((d) => d >= toDay(y, 1, 1) && d <= toDay(y, 12, 31))).toBe(true);
      // Observed holidays always land on a Monday
      holidaysForYear(y).filter((h) => h.observed).forEach((h) => expect(weekday(h.day)).toBe(1));
    }
  });
});
