import { type Day, daysInMonth, fmtLong, fmtMonth, toDay, weekday, ymd } from "../lib/dates";
import type { Holiday } from "../lib/holidays";

interface Props {
  view: { y: number; m: number };
  count: number;
  onNav: (delta: number) => void;
  today: Day;
  from: Day | null;
  to: Day | null;
  hover: Day | null;
  onHover: (d: Day | null) => void;
  onPick: (d: Day) => void;
  editMode: boolean;
  onToggleDay: (d: Day) => void;
  holidays: Map<Day, Holiday>;
  sixDay: boolean;
  customOff: Set<Day>;
  blocked: Set<Day>;
  leave: Set<Day>;
  inBreak: Set<Day>;
}

const WD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const addMonths = ({ y, m }: { y: number; m: number }, n: number) => {
  const t = y * 12 + (m - 1) + n;
  return { y: Math.floor(t / 12), m: (t % 12) + 1 };
};

export function Calendar(p: Props) {
  const months = Array.from({ length: p.count }, (_, i) => addMonths(p.view, i));
  // While choosing the end date, preview the range under the pointer
  const lo = p.from === null ? null : p.to !== null ? p.from : p.hover !== null ? Math.min(p.from, p.hover) : p.from;
  const hi = p.from === null ? null : p.to !== null ? p.to : p.hover !== null ? Math.max(p.from, p.hover) : p.from;
  const hasPlan = p.leave.size > 0;
  const canPrev = toDay(p.view.y, p.view.m, 1) > toDay(ymd(p.today).y, ymd(p.today).m, 1);

  return (
    <div className={`cal${p.editMode ? " editing" : ""}${hasPlan ? " planned" : ""}`} onMouseLeave={() => p.onHover(null)}>
      <div className="cal-nav">
        <button type="button" className="nav" onClick={() => p.onNav(-1)} disabled={!canPrev} aria-label="Previous month">
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M12.5 4.5 7 10l5.5 5.5" /></svg>
        </button>
        <button type="button" className="nav" onClick={() => p.onNav(1)} aria-label="Next month">
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7.5 4.5 13 10l-5.5 5.5" /></svg>
        </button>
      </div>
      <div className="cal-months" style={{ gridTemplateColumns: `repeat(${p.count}, 1fr)` }}>
        {months.map(({ y, m }) => {
          const first = toDay(y, m, 1);
          const lead = (weekday(first) + 6) % 7; // Monday first
          const cells: (Day | null)[] = [...Array(lead).fill(null)];
          for (let d = 0; d < daysInMonth(y, m); d++) cells.push(first + d);
          while (cells.length < 42) cells.push(null); // always six rows so the layout never jumps
          return (
            <div className="cal-month" key={`${y}-${m}`}>
              <h2>{fmtMonth(first)} <span>{y}</span></h2>
              <div className="cal-grid" role="grid" aria-label={`${fmtMonth(first)} ${y}`}>
                {WD.map((w) => <span key={w} className="cal-wd" aria-hidden="true">{w.slice(0, 1)}<span className="wd-rest">{w.slice(1)}</span></span>)}
                {cells.map((d, i) => {
                  if (d === null) return <span key={`b${i}`} className="day blank" />;
                  const wd = weekday(d);
                  const hol = p.holidays.get(d);
                  const past = d < p.today;
                  const weekend = wd === 0 || (wd === 6 && !p.sixDay);
                  const inSel = lo !== null && hi !== null && d >= lo && d <= hi;
                  const edge = d === lo || d === hi;
                  const isLeave = p.leave.has(d);
                  const brk = p.inBreak.has(d);
                  const off = p.customOff.has(d), block = p.blocked.has(d);
                  const cls = ["day",
                    past && "past", weekend && "we", hol && "hol", inSel && "sel", inSel && d === lo && "sel-start", inSel && d === hi && "sel-end",
                    edge && !hasPlan && "edge", brk && "brk", isLeave && "leave", off && "custom", block && "blocked", d === p.today && "today",
                  ].filter(Boolean).join(" ");
                  const label = `${fmtLong(d)}${hol ? `, ${hol.name}` : ""}${isLeave ? ", take leave" : brk ? ", day off" : ""}${off ? ", already off" : ""}${block ? ", can't take leave" : ""}`;
                  const editable = p.editMode && !past && !weekend && !hol;
                  return (
                    <button key={d} type="button" className={cls} disabled={past || (p.editMode && !editable)} aria-label={label} title={hol?.name}
                      aria-pressed={inSel || undefined}
                      onClick={() => (p.editMode ? p.onToggleDay(d) : p.onPick(d))}
                      onMouseEnter={() => p.onHover(d)}>
                      <span className="n">{ymd(d).d}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
