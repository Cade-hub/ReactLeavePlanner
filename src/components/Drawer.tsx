import { useEffect, useRef } from "react";
import type { Day } from "../lib/dates";
import type { Holiday } from "../lib/holidays";
import type { Break } from "../lib/planner";
import { type AppState, MAX_LEAVE, MIN_LEAVE, STYLES, type Style, presets } from "../lib/state";
import { BreakList } from "./BreakList";
import { QuickWins } from "./QuickWins";
import { HolidayList } from "./HolidayList";

export type Tab = "plan" | "wins" | "holidays" | "options";
const TABS: [Tab, string][] = [["plan", "Plan"], ["wins", "Best value"], ["holidays", "Holidays"], ["options", "Options"]];

interface Props {
  tab: Tab | null;
  setTab: (t: Tab | null) => void;
  breaks: Break[];
  wins: Break[];
  holidays: Holiday[];
  hasRange: boolean;
  state: AppState;
  leave: number;
  update: (p: Partial<AppState>) => void;
  setLeave: (n: number) => void;
  hover: number | null;
  setHover: (i: number | null) => void;
  onExport: (i: number | null) => void;
  onCopy: () => void;
  onJump: (d: Day) => void;
  editMode: boolean;
  setEditMode: (v: boolean) => void;
}

/** Everything beyond the calendar. Out of the way until someone asks for it. */
export function Drawer(p: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const open = p.tab !== null;
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && p.setTab(null);
    addEventListener("keydown", onKey);
    ref.current?.focus();
    return () => removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <div className={`scrim${open ? " on" : ""}`} onClick={() => p.setTab(null)} aria-hidden="true" />
      <aside className={`drawer${open ? " on" : ""}`} aria-hidden={!open} aria-label="Details" ref={ref} tabIndex={-1}>
        <div className="d-head">
          <div className="tabs" role="tablist">
            {TABS.map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={p.tab === id} className={p.tab === id ? "on" : ""} onClick={() => p.setTab(id)}>{label}</button>
            ))}
          </div>
          <button type="button" className="icon-btn" onClick={() => p.setTab(null)} aria-label="Close details">
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5 5 15" /></svg>
          </button>
        </div>

        <div className="d-body">
          {p.tab === "plan" && (p.breaks.length ? (
            <>
              <p className="d-lede">Your best breaks, in order. Tap one to see it on the calendar.</p>
              <BreakList breaks={p.breaks} hover={p.hover} setHover={p.setHover} onExport={(i) => p.onExport(i)} onJump={p.onJump} />
              <div className="d-actions">
                <button type="button" className="btn primary" onClick={() => p.onExport(null)}>Add all to my calendar</button>
                <button type="button" className="btn" onClick={p.onCopy}>Copy link</button>
              </div>
            </>
          ) : <p className="empty">Pick a range on the calendar and your plan shows up here.</p>)}

          {p.tab === "wins" && (p.hasRange
            ? <><p className="d-lede">Short on leave? These give you the most days off per leave day.</p><QuickWins wins={p.wins} onJump={p.onJump} /></>
            : <p className="empty">Pick a range on the calendar first.</p>)}

          {p.tab === "holidays" && <HolidayList holidays={p.holidays} onJump={p.onJump} />}

          {p.tab === "options" && (
            <div className="opts">
              <div className="opt">
                <span className="opt-l">Leave days to use</span>
                <span className="stepper big-step" role="group" aria-label="Leave days">
                  <button type="button" onClick={() => p.setLeave(p.leave - 1)} disabled={p.leave <= MIN_LEAVE} aria-label="One fewer">−</button>
                  <output className="num">{p.leave}</output>
                  <button type="button" onClick={() => p.setLeave(p.leave + 1)} disabled={p.leave >= MAX_LEAVE} aria-label="One more">+</button>
                </span>
                <span className="opt-h">We suggest what you'd accrue over the range (15 a year under the BCEA).{p.state.leave !== null && <> <button type="button" className="link" onClick={() => p.update({ leave: null })}>Use the suggestion</button></>}</span>
              </div>

              <div className="opt">
                <span className="opt-l">Kind of breaks</span>
                <div className="seg" role="radiogroup">
                  {(Object.keys(STYLES) as Style[]).map((k) => (
                    <button key={k} type="button" role="radio" aria-checked={p.state.style === k} className={p.state.style === k ? "on" : ""} onClick={() => p.update({ style: k })}>{STYLES[k].short}</button>
                  ))}
                </div>
                <span className="opt-h">{STYLES[p.state.style].label}: up to {STYLES[p.state.style].maxPerBreak} leave days per break.</span>
              </div>

              <label className="opt check">
                <input type="checkbox" checked={p.state.sixDay} onChange={(e) => p.update({ sixDay: e.target.checked })} />
                <span className="box" aria-hidden="true" />
                <span><span className="opt-l">I work Saturdays</span><span className="opt-h">Six-day week. Saturdays count as working days.</span></span>
              </label>

              <div className="opt">
                <span className="opt-l">Mark your own days</span>
                <button type="button" className={`btn${p.editMode ? " primary" : ""}`} onClick={() => { p.setEditMode(!p.editMode); p.setTab(null); }}>
                  {p.editMode ? "Done marking" : "Mark days on the calendar"}
                </button>
                <span className="opt-h">Tap a weekday once if you're <b>already off</b> (a company shutdown), and twice if you <b>can't take leave</b> then.</span>
                {(p.state.customOff.length > 0 || p.state.blocked.length > 0) && <button type="button" className="link" onClick={() => p.update({ customOff: [], blocked: [] })}>Clear marked days</button>}
              </div>

              <div className="opt">
                <span className="opt-l">Quick ranges</span>
                <div className="chips">
                  {presets().map((r) => <button key={r.label} type="button" className="chip-btn" onClick={() => { p.update({ from: r.from, to: r.to }); p.onJump(r.from); p.setTab(null); }}>{r.label}</button>)}
                </div>
              </div>

              <details className="how">
                <summary>How it works</summary>
                <p>We look at every way of spending your leave in runs, stretch each one over the weekends and public holidays on either side, and pick the set of breaks that gives you the most time off.
                  "Long breaks" counts days in a row for more, so it prefers one ten-day trip over two five-day ones.</p>
                <p>Holidays follow the Public Holidays Act 36 of 1994. When a holiday falls on a Sunday, the Monday is off. Once-off days declared by the President (like election days) are added as they're announced. Everything runs in your browser.</p>
                <p>Made by <a href="https://github.com/Cade-hub" target="_blank" rel="noopener">Cade Wickham</a>.</p>
              </details>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
