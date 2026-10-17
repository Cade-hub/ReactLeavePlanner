import { useEffect, useMemo, useState } from "react";
import { type Day, today } from "./lib/dates";
import { holidayMap } from "./lib/holidays";
import { classify, freeLongWeekends, plan, quickWins, type Settings } from "./lib/planner";
import { download, toIcs } from "./lib/ics";
import { type AppState, STYLES, fromUrl, resolveRange, toUrl } from "./lib/state";
import { Sentence } from "./components/Sentence";
import { Summary } from "./components/Summary";
import { BreakList } from "./components/BreakList";
import { QuickWins } from "./components/QuickWins";
import { YearView } from "./components/YearView";
import { HolidayList } from "./components/HolidayList";
import { ThemeToggle } from "./components/ThemeToggle";
import { Footer } from "./components/Footer";

export default function App() {
  const [state, setState] = useState<AppState>(() => fromUrl(location.search));
  const [hover, setHover] = useState<number | null>(null);
  const [toast, setToast] = useState("");
  const update = (patch: Partial<AppState>) => setState((s) => ({ ...s, ...patch }));

  // Keep the URL in sync so any plan can be shared or bookmarked
  useEffect(() => { history.replaceState(null, "", toUrl(state)); }, [state]);

  const range = useMemo(() => resolveRange(state), [state.period, state.from, state.to]);
  const settings: Settings = useMemo(() => ({
    start: range.start,
    end: range.end,
    budget: state.leave,
    maxPerBreak: STYLES[state.style].maxPerBreak,
    power: STYLES[state.style].power,
    sixDayWeek: state.sixDay,
    customOff: new Set(state.customOff),
    blocked: new Set(state.blocked),
  }), [range, state.leave, state.style, state.sixDay, state.customOff, state.blocked]);

  const result = useMemo(() => plan(settings), [settings]);
  const wins = useMemo(() => quickWins(settings), [settings]);
  const days = useMemo(() => classify(settings), [settings]);
  const holidays = useMemo(() => [...holidayMap(range.start, range.end).values()], [range]);
  const freebies = useMemo(() => freeLongWeekends(settings), [settings]);

  // Tap a weekday to cycle: working → already off → can't take leave → working
  const cycleDay = (day: Day) => {
    const off = new Set(state.customOff), blocked = new Set(state.blocked);
    if (off.has(day)) { off.delete(day); blocked.add(day); }
    else if (blocked.has(day)) blocked.delete(day);
    else off.add(day);
    update({ customOff: [...off].sort((a, b) => a - b), blocked: [...blocked].sort((a, b) => a - b) });
  };

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2200); };
  const exportAll = () => {
    if (!result.breaks.length) return;
    download("leave-plan.ics", toIcs(result.breaks));
    flash("Calendar file downloaded");
  };
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(location.href); flash("Link copied"); }
    catch { flash("Couldn't copy, but the address bar has your plan"); }
  };

  return (
    <>
      <header className="top">
        <a className="brand" href="./" aria-label="SA Leave Planner home">
          <span className="mark" aria-hidden="true"><i /><i /><i /><i className="sun" /></span>
          <span>Leave Planner</span><span className="za">ZA</span>
        </a>
        <ThemeToggle />
      </header>

      <main>
        <section className="hero">
          <Sentence state={state} update={update} />
          <Summary result={result} holidayCount={holidays.length} freebies={freebies.length} onExport={exportAll} onCopy={copyLink} />
        </section>

        <BreakList breaks={result.breaks} today={today()} hover={hover} setHover={setHover} onExport={(i) => download(`leave-break-${i + 1}.ics`, toIcs([result.breaks[i]]))} />

        <QuickWins wins={wins} />

        <YearView days={days} start={range.start} end={range.end} breaks={result.breaks} hover={hover} setHover={setHover} onToggle={cycleDay}
          hasCustom={state.customOff.length + state.blocked.length > 0} onReset={() => update({ customOff: [], blocked: [] })} />

        <HolidayList holidays={holidays} />
      </main>

      <Footer />
      <div className={`toast${toast ? " show" : ""}`} role="status">{toast}</div>
    </>
  );
}
