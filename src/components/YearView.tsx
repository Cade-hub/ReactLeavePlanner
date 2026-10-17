import { type Day, daysInMonth, fmtLong, fmtMonth, toDay, today, weekday, ymd } from "../lib/dates";
import type { Break, DayInfo } from "../lib/planner";

interface Props {
  days: DayInfo[];
  start: Day;
  end: Day;
  breaks: Break[];
  hover: number | null;
  setHover: (i: number | null) => void;
  onToggle: (d: Day) => void;
  hasCustom: boolean;
  onReset: () => void;
}

const WD = ["M", "T", "W", "T", "F", "S", "S"];

export function YearView({ days, start, end, breaks, hover, setHover, onToggle, hasCustom, onReset }: Props) {
  const info = new Map(days.map((d) => [d.day, d]));
  const leave = new Map<Day, number>();
  const inBreak = new Map<Day, number>();
  breaks.forEach((b, i) => {
    b.leaveDays.forEach((d) => leave.set(d, i));
    for (let d = b.start; d <= b.end; d++) inBreak.set(d, i);
  });
  const now = today();

  // Every month the range touches
  const months: { y: number; m: number }[] = [];
  for (let { y, m } = ymd(start); toDay(y, m, 1) <= end; m === 12 ? (y++, (m = 1)) : m++) months.push({ y, m });

  return (
    <section className="block" aria-labelledby="cal-h">
      <div className="block-head">
        <h2 id="cal-h">At a glance</h2>
        <p className="aside">
          Tap a weekday to mark it <span className="tag off-tag">already off</span>, then again for <span className="tag block-tag">can't take leave</span>.
          {hasCustom && <button type="button" className="link" onClick={onReset}>Clear marked days</button>}
        </p>
      </div>
      <div className="months">
        {months.map(({ y, m }) => {
          const first = toDay(y, m, 1);
          const lead = (weekday(first) + 6) % 7; // Monday first
          const cells: (Day | null)[] = [...Array(lead).fill(null)];
          for (let d = 0; d < daysInMonth(y, m); d++) cells.push(first + d);
          return (
            <div className="month" key={`${y}-${m}`}>
              <h3>{fmtMonth(first)} <span>{y}</span></h3>
              <div className="grid" role="grid">
                {WD.map((w, i) => <span key={i} className="wd" aria-hidden="true">{w}</span>)}
                {cells.map((d, i) => {
                  if (d === null) return <span key={`b${i}`} className="cell blank" />;
                  const di = info.get(d);
                  const out = d < start || d > end;
                  const bi = inBreak.get(d);
                  const isLeave = leave.has(d);
                  const cls = ["cell",
                    out && "out",
                    di?.kind === "weekend" && "we",
                    di?.holiday && "hol",
                    di?.kind === "off" && "custom",
                    di?.kind === "blocked" && !out && "blocked",
                    bi !== undefined && "brk",
                    isLeave && "leave",
                    bi !== undefined && bi === hover && "hl",
                    d === now && "today",
                  ].filter(Boolean).join(" ");
                  const editable = !out && !di?.holiday && (di?.kind === "work" || di?.kind === "off" || di?.kind === "blocked");
                  const label = `${fmtLong(d)}${di?.holiday ? `, ${di.holiday.name}` : ""}${isLeave ? ", take leave" : ""}${di?.kind === "off" ? ", already off" : ""}${di?.kind === "blocked" && !out ? ", can't take leave" : ""}`;
                  return editable ? (
                    <button key={d} type="button" className={cls} title={label} aria-label={label} onClick={() => onToggle(d)}
                      onMouseEnter={() => bi !== undefined && setHover(bi)} onMouseLeave={() => setHover(null)}>{ymd(d).d}</button>
                  ) : (
                    <span key={d} className={cls} title={label} onMouseEnter={() => bi !== undefined && setHover(bi)} onMouseLeave={() => setHover(null)}>{ymd(d).d}</span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
