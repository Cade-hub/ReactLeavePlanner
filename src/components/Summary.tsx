import { useEffect, useRef, useState } from "react";
import type { Plan } from "../lib/planner";

/** Eases a number towards its new value, which is satisfying without being showy. */
function useCountUp(target: number, ms = 600) {
  const [v, setV] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setV(target); from.current = target; return; }
    const start = performance.now(), a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms), e = 1 - Math.pow(1 - p, 3);
      setV(Math.round(a + (target - a) * e));
      if (p < 1) raf = requestAnimationFrame(tick); else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); from.current = target; };
  }, [target, ms]);
  return v;
}

interface Props { result: Plan; holidayCount: number; freebies: number; onExport: () => void; onCopy: () => void }

export function Summary({ result, holidayCount, freebies, onExport, onCopy }: Props) {
  const days = useCountUp(result.daysOff);
  const leave = useCountUp(result.leaveUsed);
  const n = result.breaks.length;

  return (
    <div className="summary" aria-live="polite">
      <div className="big">
        <span className="figure num">{days}</span>
        <span className="unit">days off</span>
      </div>
      <p className="detail">
        {n ? (
          <>
            from <b className="num">{leave}</b> leave {leave === 1 ? "day" : "days"}, across <b className="num">{n}</b> {n === 1 ? "break" : "breaks"}.
            That's <b className="num">{result.ratio.toFixed(1)}</b> days off for every day of leave.
          </>
        ) : "No breaks fit those settings. Try more leave days, or unblock some dates."}
      </p>
      <p className="meta"><span className="num">{holidayCount}</span> public holidays in this period, and <span className="num">{freebies}</span> long weekends you get for free.</p>
      <div className="actions">
        <button type="button" className="btn primary" onClick={onExport} disabled={!n}>
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 2v3M14 2v3M3 8h14M4 4h12a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm6 6v5m-2.5-2.5h5" /></svg>
          Add to my calendar
        </button>
        <button type="button" className="btn" onClick={onCopy}>
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M8 12a3 3 0 0 0 4.2.3l2.6-2.6a3 3 0 0 0-4.2-4.2l-.8.8M12 8a3 3 0 0 0-4.2-.3l-2.6 2.6a3 3 0 0 0 4.2 4.2l.8-.8" /></svg>
          Copy link
        </button>
      </div>
    </div>
  );
}
