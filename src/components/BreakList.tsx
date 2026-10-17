import { type Day, fmtMonth, fmtShort, weekday } from "../lib/dates";
import { leaveRuns, runLabel } from "../lib/ics";
import type { Break } from "../lib/planner";

/** A friendly name for a break, based on the holidays inside it. */
export function breakTitle(b: Break): string {
  const names = [...new Set(b.holidays.map((h) => h.name.replace(" (observed)", "")))];
  if (names.some((n) => n === "Good Friday" || n === "Family Day")) {
    const rest = names.filter((n) => n !== "Good Friday" && n !== "Family Day");
    return ["Easter", ...rest].join(" + ");
  }
  const xmas = names.some((n) => /Christmas|Goodwill/.test(n)), ny = names.includes("New Year's Day");
  if (xmas && ny) return "Festive season";
  if (xmas) return "Christmas";
  if (ny) return "New Year";
  if (names.length) return names.join(" + ");
  return `${fmtMonth(b.start)} break`;
}

interface Props {
  breaks: Break[];
  hover: number | null;
  setHover: (i: number | null) => void;
  onExport: (i: number) => void;
  onJump: (d: Day) => void;
}

export function BreakList({ breaks, hover, setHover, onExport, onJump }: Props) {
  return (
    <ol className="breaks">
      {breaks.map((b, i) => {
        const leave = new Set(b.leaveDays);
        const hols = new Set(b.holidays.map((h) => h.day));
        const cells: Day[] = [];
        for (let d = b.start; d <= b.end; d++) cells.push(d);
        return (
          <li key={b.start} className={`break${hover === i ? " hl" : ""}`} style={{ animationDelay: `${i * 40}ms` }}
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <button type="button" className="b-main" onClick={() => onJump(b.start)} title="Show on calendar">
              <span className="b-top">
                <span className="b-title">{breakTitle(b)}</span>
                <span className="b-days"><b className="num">{b.length}</b> days</span>
              </span>
              <span className="b-dates">{fmtShort(b.start)} → {fmtShort(b.end)}</span>
              <span className="strip" aria-hidden="true">
                {cells.map((d) => <i key={d} className={leave.has(d) ? "leave" : hols.has(d) ? "hol" : "off"} data-wd={weekday(d) === 1 ? "mon" : undefined} />)}
              </span>
              <span className="b-take">
                Take {leaveRuns(b.leaveDays).map(runLabel).join(", ")}
                <span className="b-stat"> · {b.leave} leave · {b.ratio.toFixed(1)}×</span>
              </span>
            </button>
            <button type="button" className="icon-btn" onClick={() => onExport(i)} aria-label={`Add ${breakTitle(b)} to calendar`} title="Add to calendar">
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 2v3M14 2v3M3 8h14M4 4h12a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm6 6v5m-2.5-2.5h5" /></svg>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
