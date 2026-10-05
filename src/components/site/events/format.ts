/**
 * Date/time formatting for events, the academic calendar and notices.
 * Works on Pakistan-time strings ("YYYY-MM-DD", "HH:MM") so the server, the browser
 * and the admin all print the same thing whatever their own time zone is.
 */
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function ymd(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return { y, m, d };
}

export const weekday = (s: string) => {
  const { y, m, d } = ymd(s);
  return DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
};

/** "14:30" → "2:30 PM" */
export function fmtTime(t: string) {
  const [h, min] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(min).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

/** "2026-10-12" → "12 Oct 2026" (optionally "Mon 12 Oct 2026"). */
export function fmtDay(s: string, opts: { weekday?: boolean; year?: boolean; long?: boolean } = {}) {
  const { y, m, d } = ymd(s);
  const month = (opts.long ? MONTHS_LONG : MONTHS)[m - 1];
  return `${opts.weekday ? `${weekday(s)} ` : ""}${d} ${month}${opts.year === false ? "" : ` ${y}`}`;
}

/** "12 – 14 Oct 2026", "28 Sep – 2 Oct 2026", "30 Dec 2026 – 2 Jan 2027"; a single day when end is empty or equal. */
export function fmtRange(start: string, end?: string | null, opts: { weekday?: boolean } = {}) {
  if (!end || end === start) return fmtDay(start, { weekday: opts.weekday });
  const a = ymd(start);
  const b = ymd(end);
  if (a.y !== b.y) return `${fmtDay(start)} – ${fmtDay(end)}`;
  if (a.m !== b.m) return `${fmtDay(start, { year: false })} – ${fmtDay(end)}`;
  return `${a.d} – ${fmtDay(end)}`;
}

export type When = { startDate: string; startTime: string | null; endDate: string | null; endTime: string | null; allDay: boolean };

/** The date line and the time line shown for an event. */
export function eventWhen(e: When) {
  const multi = Boolean(e.endDate && e.endDate !== e.startDate);
  const date = fmtRange(e.startDate, e.endDate, { weekday: !multi });
  let time = "All day";
  if (!e.allDay && e.startTime) {
    if (!e.endTime) time = fmtTime(e.startTime);
    else if (!multi) time = e.endTime === e.startTime ? fmtTime(e.startTime) : `${fmtTime(e.startTime)} – ${fmtTime(e.endTime)}`;
    else time = `Starts ${fmtTime(e.startTime)}, ends ${fmtTime(e.endTime)} on ${fmtDay(e.endDate!, { year: false })}`;
  }
  return { date, time, multi };
}

/** Today in Pakistan, "YYYY-MM-DD". */
export const todayPk = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });

/** The academic year a date falls in, assuming the year starts in August: "2026-09-01" → "2026-27". */
export function academicYearOf(date: string, startMonth = 8) {
  const { y, m } = ymd(date);
  const first = m >= startMonth ? y : y - 1;
  return `${first}-${String((first + 1) % 100).padStart(2, "0")}`;
}

export const KIND_LABEL: Record<string, string> = { term: "Term", holiday: "Holiday", exam: "Exams", other: "Other" };
