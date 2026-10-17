import { fmtDayMonth, fmtWeekday, weekday, ymd } from "../lib/dates";
import { HOLIDAYS_LAST_CHECKED, type Holiday } from "../lib/holidays";

export function HolidayList({ holidays }: { holidays: Holiday[] }) {
  if (!holidays.length) return null;
  const years = [...new Set(holidays.map((h) => ymd(h.day).y))];
  return (
    <section className="block" aria-labelledby="hol-h">
      <div className="block-head">
        <h2 id="hol-h">Public holidays</h2>
        <p className="aside">From the Public Holidays Act, including the Sunday-to-Monday rule. Once-off holidays checked {HOLIDAYS_LAST_CHECKED}.</p>
      </div>
      <div className="hol-years">
        {years.map((y) => (
          <div key={y} className="hol-year">
            <h3>{y}</h3>
            <ul className="hols">
              {holidays.filter((h) => ymd(h.day).y === y).map((h) => {
                const wd = weekday(h.day);
                return (
                  <li key={h.day}>
                    <span className="h-date num">{fmtDayMonth(h.day)}</span>
                    <span className="h-wd">{fmtWeekday(h.day)}</span>
                    <span className="h-name">{h.name}</span>
                    {h.special && <span className="tag">declared</span>}
                    {wd === 6 && <span className="tag muted" title="Holidays on a Saturday don't move to Monday">on a Saturday</span>}
                    {(wd === 2 || wd === 4) && <span className="tag good" title="Take one day and get a four-day weekend">bridge day</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
