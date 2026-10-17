import { type Day, fmtShort, iso } from "./dates";
import type { Break } from "./planner";

const stamp = (day: Day) => iso(day).replace(/-/g, "");

/** Group leave days into runs of consecutive days ("Tue 30 Mar – Fri 2 Apr"). */
export function leaveRuns(days: Day[]): [Day, Day][] {
  const runs: [Day, Day][] = [];
  for (const d of [...days].sort((a, b) => a - b)) {
    const last = runs[runs.length - 1];
    if (last && d === last[1] + 1) last[1] = d;
    else runs.push([d, d]);
  }
  return runs;
}

export const runLabel = ([a, b]: [Day, Day]) => (a === b ? fmtShort(a) : `${fmtShort(a)} – ${fmtShort(b)}`);

/** An .ics file with one all-day event per break. Imports into Google, Outlook and Apple calendars. */
export function toIcs(breaks: Break[]): string {
  const now = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//SA Leave Planner//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  for (const b of breaks) {
    const leave = leaveRuns(b.leaveDays).map(runLabel).join(", ");
    const hols = b.holidays.map((h) => h.name).join(", ");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${stamp(b.start)}-${stamp(b.end)}@sa-leave-planner`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${stamp(b.start)}`,
      `DTEND;VALUE=DATE:${stamp(b.end + 1)}`, // all-day events end on the next day (exclusive)
      `SUMMARY:Time off: ${b.length} days (${b.leave} leave)`,
      `DESCRIPTION:Take leave: ${leave}.${hols ? `\\nPublic holidays: ${hols}.` : ""}\\nPlanned with SA Leave Planner.`,
      "TRANSP:OPAQUE",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function download(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/calendar;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
