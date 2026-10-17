import { fmtDayMonth } from "../lib/dates";
import { useCountUp } from "../lib/hooks";
import type { Plan } from "../lib/planner";
import { MAX_LEAVE, MIN_LEAVE } from "../lib/state";

interface Props {
  result: Plan | null;
  range: [number, number] | null;
  picking: boolean;
  leave: number;
  setLeave: (n: number) => void;
  onDetails: () => void;
  onClear: () => void;
}

/** The single line of results under the calendar. Everything else lives in the details panel. */
export function ResultBar({ result, range, picking, leave, setLeave, onDetails, onClear }: Props) {
  const days = useCountUp(result?.daysOff ?? 0);

  if (!result || !range) {
    return (
      <div className="result idle" aria-live="polite">
        <p className="hint">
          {picking ? "Now tap the last day of your range." : <>Tap a start date, then an end date. <span className="key"><i className="k-hol" />public holiday</span></>}
        </p>
      </div>
    );
  }

  const n = result.breaks.length;
  return (
    <div className="result" aria-live="polite">
      <div className="r-big">
        <span className="figure num">{days}</span>
        <span className="unit">days off</span>
      </div>
      <div className="r-text">
        <p>
          from{" "}
          <span className="stepper" role="group" aria-label="Leave days to use">
            <button type="button" onClick={() => setLeave(leave - 1)} disabled={leave <= MIN_LEAVE} aria-label="Use one fewer leave day">−</button>
            <output key={leave} className="num">{leave}</output>
            <button type="button" onClick={() => setLeave(leave + 1)} disabled={leave >= MAX_LEAVE} aria-label="Use one more leave day">+</button>
          </span>{" "}
          leave days{n ? <>, across <b className="num">{n}</b> {n === 1 ? "break" : "breaks"}. That's <b className="num">{result.ratio.toFixed(1)}</b> days off per leave day.</> : <>, but no breaks fit this range.</>}
        </p>
        <p className="r-range">{fmtDayMonth(range[0])} – {fmtDayMonth(range[1])}{result.leaveUsed < leave && n ? ` · only ${result.leaveUsed} worth using here` : ""}</p>
      </div>
      <div className="r-actions">
        <button type="button" className="btn primary" onClick={onDetails} disabled={!n}>See the plan</button>
        <button type="button" className="btn ghost" onClick={onClear} aria-label="Clear range">Clear</button>
      </div>
    </div>
  );
}
