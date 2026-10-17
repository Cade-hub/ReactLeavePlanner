import { type Day, addYears, endOfYear, iso, parseIso, startOfYear, today, ymd } from "./dates";

export type Style = "weekends" | "mix" | "long";

/** How each style maps onto the planner: the cap per break and how strongly longer breaks are favoured. */
export const STYLES: Record<Style, { label: string; short: string; maxPerBreak: number; power: number }> = {
  weekends: { label: "Lots of long weekends", short: "Long weekends", maxPerBreak: 2, power: 1 },
  mix: { label: "A good mix of breaks", short: "A mix", maxPerBreak: 5, power: 1.35 },
  long: { label: "A few long breaks", short: "Long breaks", maxPerBreak: 10, power: 1.7 },
};

export interface AppState {
  from: Day | null;
  to: Day | null;
  /** null means "suggest a budget for this range". */
  leave: number | null;
  style: Style;
  sixDay: boolean;
  customOff: Day[];
  blocked: Day[];
}

export const MIN_LEAVE = 1;
export const MAX_LEAVE = 40;

/**
 * A sensible default budget for a range: what you'd accrue under the BCEA
 * (15 days a year, about 1.25 a month), so a full year suggests 15.
 */
export function suggestedLeave(start: Day, end: Day): number {
  const months = (end - start + 1) / 30.44;
  return Math.min(MAX_LEAVE, Math.max(MIN_LEAVE, Math.round(months * 1.25)));
}

export function presets(now = today()): { label: string; from: Day; to: Day }[] {
  const { y, m } = ymd(now);
  const out = [{ label: "Next 12 months", from: now, to: addYears(now, 1) - 1 }];
  if (m < 12) out.push({ label: `Rest of ${y}`, from: now, to: endOfYear(y) });
  out.push({ label: `${y + 1}`, from: startOfYear(y + 1), to: endOfYear(y + 1) });
  return out;
}

export const emptyState = (): AppState => ({ from: null, to: null, leave: null, style: "mix", sixDay: false, customOff: [], blocked: [] });

const days = (v: string | null) => (v ? v.split(",").map(parseIso).filter((d): d is Day => d !== null) : []);

export function fromUrl(search: string): AppState {
  const q = new URLSearchParams(search), d = emptyState();
  const from = parseIso(q.get("from") ?? ""), to = parseIso(q.get("to") ?? "");
  const leave = Number(q.get("leave"));
  const style = q.get("style") as Style | null;
  const ok = from !== null && to !== null && to >= from;
  return {
    from: ok ? from : null,
    to: ok ? Math.min(to!, from! + 366 * 2) : null,
    leave: q.has("leave") && Number.isFinite(leave) && leave >= MIN_LEAVE && leave <= MAX_LEAVE ? Math.round(leave) : null,
    style: style && style in STYLES ? style : d.style,
    sixDay: q.get("sat") === "1",
    customOff: days(q.get("off")),
    blocked: days(q.get("block")),
  };
}

export function toUrl(s: AppState): string {
  const q = new URLSearchParams();
  if (s.from !== null && s.to !== null) { q.set("from", iso(s.from)); q.set("to", iso(s.to)); }
  if (s.leave !== null) q.set("leave", String(s.leave));
  if (s.style !== "mix") q.set("style", s.style);
  if (s.sixDay) q.set("sat", "1");
  if (s.customOff.length) q.set("off", s.customOff.map(iso).join(","));
  if (s.blocked.length) q.set("block", s.blocked.map(iso).join(","));
  const str = q.toString();
  return str ? `?${str}` : location.pathname;
}
