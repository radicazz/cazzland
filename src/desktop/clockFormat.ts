export interface ClockOptions {
  locale?: string | string[];
  timeZone?: string;
}

export interface ClockText {
  /** Desktop form, e.g. "Tue 25 Nov  14:07". */
  short: string;
  /** Phone form: short date and time, e.g. "25 Nov 14:07". */
  compact: string;
  /** Full date and time for the title tooltip. */
  long: string;
  iso: string;
}

export function formatClock(date: Date, { locale, timeZone }: ClockOptions = {}): ClockText {
  const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, { timeZone, ...o }).format(date);
  const time = fmt({ hour: "numeric", minute: "2-digit" });
  return {
    short: `${fmt({ weekday: "short", day: "numeric", month: "short" })}  ${time}`,
    compact: `${fmt({ day: "numeric", month: "short" })} ${time}`,
    long: fmt({ dateStyle: "full", timeStyle: "long" }),
    iso: date.toISOString(),
  };
}

/** Milliseconds from `now` until the next whole minute (always > 0). */
export function msToNextMinute(now: number): number {
  return 60_000 - (now % 60_000);
}
