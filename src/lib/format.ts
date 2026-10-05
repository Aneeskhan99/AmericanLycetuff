/** Date formatting shared by server and client admin screens (Pakistan time). */
export function fmtDate(v: string | Date | null | undefined, withTime = true) {
  if (!v) return "—";
  const d = new Date(v);
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Asia/Karachi",
  });
}
