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
  if (names.some((n) => /Christmas|Goodwill|New Year/.test(n))) return "Festive season";
  if (names.length) return names.join(" + ");
  return `${fmtMonth(b.start)} break`;
}

interface Props {
  breaks: Break[];
  today: Day;
  hover: number | null;
  setHover: (i: number | null) => void;
  onExport: (i: number) => void;
}

export function BreakList({ breaks, hover, setHover, onExport }: Props) {
  if (!breaks.length) return null;
  const key = breaks.map((b) => `${b.start}-${b.end}`).join("|");

  return (
    <section className="block" aria-labelledby="plan-h">
      <div className="block-head">
        <h2 id="plan-h">Your plan</h2>
        <p className="legend"><i className="lg leave" />leave <i className="lg hol" />public holiday <i className="lg off" />weekend</p>
      </div>
      <ol className="breaks" key={key}>
        {breaks.map((b, i) => {
          const leave = new Set(b.leaveDays);
          const hols = new Set(b.holidays.map((h) => h.day));
          const cells: Day[] = [];
          for (let d = b.start; d <= b.end; d++) cells.push(d);
          return (
            <li key={b.start} className={`break${hover === i ? " hl" : ""}`} style={{ animationDelay: `${i * 45}ms` }}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <div className="b-when">
                <span className="b-title">{breakTitle(b)}</span>
                <span className="b-dates">{fmtShort(b.start)} <span aria-hidden="true">→</span><span className="sr">to</span> {fmtShort(b.end)}</span>
              </div>
              <div className="strip" aria-hidden="true">
                {cells.map((d) => (
                  <i key={d} className={leave.has(d) ? "leave" : hols.has(d) ? "hol" : "off"} data-wd={weekday(d) === 1 ? "mon" : undefined} />
                ))}
              </div>
              <div className="b-take">
                <span className="lbl">Take leave</span>
                {leaveRuns(b.leaveDays).map((r) => <span key={r[0]} className="chip">{runLabel(r)}</span>)}
              </div>
              <div className="b-score">
                <span className="b-days num">{b.length}</span>
                <span className="b-sub">days off · <b className="num">{b.leave}</b> leave · <b className="num">{b.ratio.toFixed(1)}×</b></span>
              </div>
              <button type="button" className="icon-btn" onClick={() => onExport(i)} aria-label={`Add ${breakTitle(b)} to calendar`} title="Add to calendar">
                <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 2v3M14 2v3M3 8h14M4 4h12a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm6 6v5m-2.5-2.5h5" /></svg>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
