import { fmtShort } from "../lib/dates";
import { leaveRuns, runLabel } from "../lib/ics";
import type { Break } from "../lib/planner";
import { breakTitle } from "./BreakList";

/** The best value short breaks, for anyone who only has a day or two to spare. */
export function QuickWins({ wins }: { wins: Break[] }) {
  if (!wins.length) return null;
  return (
    <section className="block" aria-labelledby="wins-h">
      <div className="block-head">
        <h2 id="wins-h">Best value</h2>
        <p className="aside">Short on leave? These give the most days off per leave day.</p>
      </div>
      <ul className="wins">
        {wins.map((b) => (
          <li key={b.start} className="win">
            <p className="w-eq"><b className="num">{b.leave}</b> <span>leave</span> <span className="arrow" aria-hidden="true">→</span> <b className="num">{b.length}</b> <span>days off</span></p>
            <p className="w-title">{breakTitle(b)}</p>
            <p className="w-dates">{fmtShort(b.start)} – {fmtShort(b.end)}</p>
            <p className="w-take">Take {leaveRuns(b.leaveDays).map(runLabel).join(", ")}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
