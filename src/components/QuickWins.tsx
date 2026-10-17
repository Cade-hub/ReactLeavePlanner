import { type Day, fmtShort } from "../lib/dates";
import { leaveRuns, runLabel } from "../lib/ics";
import type { Break } from "../lib/planner";
import { breakTitle } from "./BreakList";

/** The best value short breaks, for anyone who only has a day or two to spare. */
export function QuickWins({ wins, onJump }: { wins: Break[]; onJump: (d: Day) => void }) {
  if (!wins.length) return <p className="empty">No short bridges in this range. Try a longer one.</p>;
  return (
    <ul className="wins">
      {wins.map((b) => (
        <li key={b.start}>
          <button type="button" className="win" onClick={() => onJump(b.start)}>
            <span className="w-eq"><b className="num">{b.leave}</b> leave <span className="arrow" aria-hidden="true">→</span> <b className="num">{b.length}</b> days off</span>
            <span className="w-title">{breakTitle(b)}</span>
            <span className="w-dates">{fmtShort(b.start)} – {fmtShort(b.end)} · take {leaveRuns(b.leaveDays).map(runLabel).join(", ")}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
