import { type AppState, MAX_LEAVE, MIN_LEAVE, STYLES, type Style, periodOptions } from "../lib/state";

interface Props { state: AppState; update: (p: Partial<AppState>) => void }

/** The whole form is one sentence you can edit. */
export function Sentence({ state, update }: Props) {
  const periods = periodOptions();
  const setLeave = (n: number) => update({ leave: Math.min(MAX_LEAVE, Math.max(MIN_LEAVE, n)) });

  return (
    <div className="sentence-wrap">
      <p className="eyebrow">South African leave planner</p>
      <h1 className="sentence">
        I have{" "}
        <span className="stepper" role="group" aria-label="Leave days">
          <button type="button" onClick={() => setLeave(state.leave - 1)} disabled={state.leave <= MIN_LEAVE} aria-label="One fewer day">−</button>
          <output key={state.leave} className="val num">{state.leave}</output>
          <button type="button" onClick={() => setLeave(state.leave + 1)} disabled={state.leave >= MAX_LEAVE} aria-label="One more day">+</button>
        </span>{" "}
        days of leave for{" "}
        <Pick label="Period" value={state.period} options={periods.map((p) => [p.id, p.label])} onChange={(v) => update({ period: v })} />
        , and I'd like{" "}
        <Pick label="Style of breaks" value={state.style} options={(Object.keys(STYLES) as Style[]).map((k) => [k, STYLES[k].label])} onChange={(v) => update({ style: v as Style })} />
        .
      </h1>

      <div className="options">
        {state.period === "custom" && (
          <span className="dates">
            <label>From <input type="date" value={state.from} onChange={(e) => update({ from: e.target.value })} /></label>
            <label>to <input type="date" value={state.to} min={state.from} onChange={(e) => update({ to: e.target.value })} /></label>
          </span>
        )}
        <label className="check">
          <input type="checkbox" checked={state.sixDay} onChange={(e) => update({ sixDay: e.target.checked })} />
          <span className="box" aria-hidden="true" />
          I work Saturdays
        </label>
        <span className="hint">Most full-time workers get at least 15 working days a year (BCEA).</span>
      </div>
    </div>
  );
}

/** Shows the chosen text at its natural width, with a real <select> on top so phones get their native picker. */
function Pick({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (v: string) => void }) {
  const current = options.find(([v]) => v === value)?.[1] ?? options[0][1];
  return (
    <label className="pick">
      <span className="pick-face" aria-hidden="true">{current}<svg viewBox="0 0 12 12"><path d="M2.5 4.5 6 8l3.5-3.5" /></svg></span>
      <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}
