/** 5400 -> "1h 30m", 90 -> "1m 30s", 45 -> "45s". */
export function formatDuration(totalSec: number): string {
  const sec = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  if (m > 0) return s > 0 && m < 10 ? `${m}m ${s}s` : `${m}m`;
  return `${s}s`;
}

/** 3725 -> "1:02:05": the live timer display. */
export function formatClock(totalSec: number): string {
  const sec = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(sec / 3600);
  const mm = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${Math.floor((sec % 3600) / 60)}:${ss}`;
}

/**
 * Parses what people type for manual time: "1h 30m", "45m", "2h", "90" (minutes), "1:30" (h:mm).
 * Returns seconds, or null when it is not a duration.
 */
export function parseDuration(input: string): number | null {
  const text = input.trim().toLowerCase();
  if (!text) return null;
  const clock = /^(\d+):([0-5]?\d)$/.exec(text);
  if (clock) return (Number(clock[1]) * 60 + Number(clock[2])) * 60 || null;
  if (/^\d+(\.\d+)?$/.test(text)) return Math.round(Number(text) * 60) || null;
  const parts = /^(?:(\d+(?:\.\d+)?)\s*h(?:ours?|rs?)?)?\s*(?:(\d+(?:\.\d+)?)\s*m(?:in(?:ute)?s?)?)?$/.exec(text);
  if (!parts || (!parts[1] && !parts[2])) return null;
  return Math.round(Number(parts[1] ?? 0) * 3600 + Number(parts[2] ?? 0) * 60) || null;
}
