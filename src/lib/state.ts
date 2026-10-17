import { type Day, addYears, endOfYear, iso, parseIso, startOfYear, today, ymd } from "./dates";

export type Style = "weekends" | "mix" | "long";

/** How each style maps onto the planner: the cap per break and how strongly longer breaks are favoured. */
export const STYLES: Record<Style, { label: string; maxPerBreak: number; power: number }> = {
  weekends: { label: "lots of long weekends", maxPerBreak: 2, power: 1 },
  mix: { label: "a good mix of breaks", maxPerBreak: 5, power: 1.35 },
  long: { label: "a few long breaks", maxPerBreak: 10, power: 1.7 },
};

export interface AppState {
  leave: number;
  period: string; // "next12" | "rest" | "y2027" | "custom"
  from: string;
  to: string;
  style: Style;
  sixDay: boolean;
  customOff: Day[];
  blocked: Day[];
}

export const MIN_LEAVE = 1;
export const MAX_LEAVE = 40;

export function periodOptions(now = today()) {
  const { y, m } = ymd(now);
  const opts: { id: string; label: string }[] = [{ id: "next12", label: "the next 12 months" }];
  if (m < 12) opts.push({ id: "rest", label: `the rest of ${y}` });
  opts.push({ id: `y${y + 1}`, label: `${y + 1}` }, { id: `y${y + 2}`, label: `${y + 2}` }, { id: "custom", label: "dates I choose" });
  return opts;
}

export function resolveRange(s: AppState, now = today()): { start: Day; end: Day } {
  if (s.period === "rest") return { start: now, end: endOfYear(ymd(now).y) };
  const yr = /^y(\d{4})$/.exec(s.period);
  if (yr) return { start: startOfYear(+yr[1]), end: endOfYear(+yr[1]) };
  if (s.period === "custom") {
    const a = parseIso(s.from), b = parseIso(s.to);
    if (a !== null && b !== null && b >= a) return { start: a, end: Math.min(b, a + 366 * 2) };
  }
  return { start: now, end: addYears(now, 1) - 1 };
}

export function defaults(): AppState {
  const now = today();
  return { leave: 15, period: "next12", from: iso(now), to: iso(addYears(now, 1) - 1), style: "mix", sixDay: false, customOff: [], blocked: [] };
}

const days = (v: string | null) => (v ? v.split(",").map(parseIso).filter((d): d is Day => d !== null) : []);

export function fromUrl(search: string): AppState {
  const q = new URLSearchParams(search), d = defaults();
  const leave = Number(q.get("leave"));
  const style = q.get("style") as Style | null;
  return {
    leave: Number.isFinite(leave) && leave >= MIN_LEAVE && leave <= MAX_LEAVE ? Math.round(leave) : d.leave,
    period: q.get("period") || d.period,
    from: q.get("from") || d.from,
    to: q.get("to") || d.to,
    style: style && style in STYLES ? style : d.style,
    sixDay: q.get("sat") === "1",
    customOff: days(q.get("off")),
    blocked: days(q.get("block")),
  };
}

export function toUrl(s: AppState): string {
  const q = new URLSearchParams();
  q.set("leave", String(s.leave));
  q.set("period", s.period);
  if (s.period === "custom") { q.set("from", s.from); q.set("to", s.to); }
  q.set("style", s.style);
  if (s.sixDay) q.set("sat", "1");
  if (s.customOff.length) q.set("off", s.customOff.map(iso).join(","));
  if (s.blocked.length) q.set("block", s.blocked.map(iso).join(","));
  return `?${q.toString()}`;
}
