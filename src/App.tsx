import { useEffect, useMemo, useState } from "react";
import { type Day, endOfYear, startOfYear, today, toDay, ymd } from "./lib/dates";
import { holidayMap } from "./lib/holidays";
import { plan, quickWins, type Settings } from "./lib/planner";
import { download, toIcs } from "./lib/ics";
import { useMedia } from "./lib/hooks";
import { type AppState, MAX_LEAVE, MIN_LEAVE, STYLES, fromUrl, suggestedLeave, toUrl } from "./lib/state";
import { Calendar, addMonths } from "./components/Calendar";
import { ResultBar } from "./components/ResultBar";
import { Drawer, type Tab } from "./components/Drawer";
import { ThemeToggle } from "./components/ThemeToggle";

export default function App() {
  const now = today();
  const [state, setState] = useState<AppState>(() => fromUrl(location.search));
  const [view, setView] = useState(() => { const { y, m } = ymd(state.from ?? now); return { y, m }; });
  const [hoverDay, setHoverDay] = useState<Day | null>(null);
  const [hoverBreak, setHoverBreak] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [toast, setToast] = useState("");
  const wide = useMedia("(min-width: 820px)");
  const count = wide ? 2 : 1;
  const update = (patch: Partial<AppState>) => setState((s) => ({ ...s, ...patch }));

  useEffect(() => { history.replaceState(null, "", toUrl(state)); }, [state]);

  const hasRange = state.from !== null && state.to !== null;
  const leave = state.leave ?? (hasRange ? suggestedLeave(state.from!, state.to!) : 15);
  const setLeave = (n: number) => update({ leave: Math.min(MAX_LEAVE, Math.max(MIN_LEAVE, n)) });

  const settings: Settings | null = useMemo(() => hasRange ? {
    start: state.from!, end: state.to!, budget: leave,
    maxPerBreak: STYLES[state.style].maxPerBreak, power: STYLES[state.style].power,
    sixDayWeek: state.sixDay, customOff: new Set(state.customOff), blocked: new Set(state.blocked),
  } : null, [hasRange, state.from, state.to, leave, state.style, state.sixDay, state.customOff, state.blocked]);

  const result = useMemo(() => (settings ? plan(settings) : null), [settings]);
  const wins = useMemo(() => (settings ? quickWins(settings) : []), [settings]);

  const leaveDays = useMemo(() => new Set(result?.breaks.flatMap((b) => b.leaveDays) ?? []), [result]);
  const breakDays = useMemo(() => {
    const s = new Set<Day>();
    result?.breaks.forEach((b) => { for (let d = b.start; d <= b.end; d++) s.add(d); });
    return s;
  }, [result]);

  // Holidays for the months on screen, and a list for the details panel
  const visHolidays = useMemo(() => {
    const first = toDay(view.y, view.m, 1), last = addMonths(view, count);
    return holidayMap(first - 7, toDay(last.y, last.m, 1) + 7);
  }, [view, count]);
  const listHolidays = useMemo(() => {
    const [a, b] = hasRange ? [state.from!, state.to!] : [startOfYear(ymd(now).y), endOfYear(ymd(now).y + 1)];
    return [...holidayMap(a, b).values()].filter((h) => hasRange || h.day >= now);
  }, [hasRange, state.from, state.to, now]);

  const onPick = (d: Day) => {
    if (state.from === null || state.to !== null) update({ from: d, to: null });
    else if (d < state.from) update({ from: d });
    else update({ to: d });
  };
  const onToggleDay = (day: Day) => {
    const off = new Set(state.customOff), blocked = new Set(state.blocked);
    if (off.has(day)) { off.delete(day); blocked.add(day); }
    else if (blocked.has(day)) blocked.delete(day);
    else off.add(day);
    update({ customOff: [...off].sort((a, b) => a - b), blocked: [...blocked].sort((a, b) => a - b) });
  };
  const nav = (delta: number) => setView((v) => {
    const next = addMonths(v, delta);
    return toDay(next.y, next.m, 1) < toDay(ymd(now).y, ymd(now).m, 1) ? v : next;
  });
  const jump = (d: Day) => { const { y, m } = ymd(d); setView({ y, m }); if (!wide) setTab(null); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (tab) return;
      if (e.key === "Escape" && state.to === null && state.from !== null) update({ from: null });
      if (e.key === "ArrowRight" && !(e.target instanceof HTMLInputElement)) nav(1);
      if (e.key === "ArrowLeft" && !(e.target instanceof HTMLInputElement)) nav(-1);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  });

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2200); };
  const exportIcs = (i: number | null) => {
    if (!result?.breaks.length) return;
    download(i === null ? "leave-plan.ics" : `leave-break-${i + 1}.ics`, toIcs(i === null ? result.breaks : [result.breaks[i]]));
    flash("Calendar file downloaded");
  };
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(location.href); flash("Link copied"); }
    catch { flash("Couldn't copy, but the address bar has your plan"); }
  };

  return (
    <div className="app">
      <header className="top">
        <a className="brand" href="./" aria-label="Leave Planner home">
          <span className="mark" aria-hidden="true"><i /><i /><i /><i className="sun" /></span>
          <span className="brand-t">
            <span className="name">Leave Planner</span>
            <span className="slogan">Maximising your leave</span>
          </span>
        </a>
        <div className="top-r">
          <button type="button" className="icon-btn" onClick={() => setTab(tab ? null : hasRange ? "plan" : "options")} aria-label="More details and options" title="Details and options">
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3.5 6h13M3.5 10h13M3.5 14h8" /></svg>
          </button>
          <ThemeToggle />
        </div>
      </header>

      <main className="stage">
        {editMode ? (
          <p className="lede editing">Tap a weekday you're <b>already off</b>, and tap again if you <b>can't take leave</b> then.
            <button type="button" className="btn primary small" onClick={() => setEditMode(false)}>Done</button></p>
        ) : (
          <p className="lede">Select a range and we'll calculate the best days to take to maximise your leave.</p>
        )}

        <Calendar view={view} count={count} onNav={nav} today={now} from={state.from} to={state.to} hover={hoverDay} onHover={setHoverDay}
          onPick={onPick} editMode={editMode} onToggleDay={onToggleDay} holidays={visHolidays} sixDay={state.sixDay}
          customOff={new Set(state.customOff)} blocked={new Set(state.blocked)} leave={leaveDays} inBreak={breakDays} />

        <ResultBar result={result} range={hasRange ? [state.from!, state.to!] : null} picking={state.from !== null && state.to === null}
          leave={leave} setLeave={setLeave} onDetails={() => setTab("plan")} onClear={() => update({ from: null, to: null, leave: null })} />
      </main>

      <Drawer tab={tab} setTab={setTab} breaks={result?.breaks ?? []} wins={wins} holidays={listHolidays} hasRange={hasRange}
        state={state} leave={leave} update={update} setLeave={setLeave} hover={hoverBreak} setHover={setHoverBreak}
        onExport={exportIcs} onCopy={copyLink} onJump={jump} editMode={editMode} setEditMode={setEditMode} />

      <div className={`toast${toast ? " show" : ""}`} role="status">{toast}</div>
    </div>
  );
}
