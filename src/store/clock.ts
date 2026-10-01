/** Demo clock. Fixed to "today" 10 October 2026, 09:00 UTC for the presentation. */
export const DEMO_CLOCK_START = "2026-10-10T09:00:00.000Z";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)}, ${timeFormatter.format(new Date(iso))}`;
}

export function formatClock(iso: string): string {
  return `${formatDate(iso)} · ${timeFormatter.format(new Date(iso))} UTC`;
}

/** ISO string for the demo clock with an offset in minutes. */
export function clockPlus(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}
