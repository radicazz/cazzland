import { describe, expect, it } from "vitest";
import { formatClock, msToNextMinute } from "./clockFormat";

const date = new Date("2025-11-25T14:07:30Z");

describe("formatClock", () => {
  it("formats a 24h locale in the given time zone", () => {
    const c = formatClock(date, { locale: "en-GB", timeZone: "UTC" });
    expect(c.short).toBe("Tue 25 Nov  14:07");
    expect(c.compact).toBe("25 Nov 14:07");
    expect(c.iso).toBe("2025-11-25T14:07:30.000Z");
    expect(c.long).toContain("Tuesday");
  });

  it("respects 12h locales and time zone offsets", () => {
    const c = formatClock(date, { locale: "en-US", timeZone: "America/New_York" });
    expect(c.compact.replace(/\s/g, " ")).toBe("Nov 25 9:07 AM");
    expect(c.short).toContain("Tue");
  });
});

describe("msToNextMinute", () => {
  it("returns the remainder to the minute boundary", () => {
    expect(msToNextMinute(Date.parse("2025-11-25T14:07:30.250Z"))).toBe(29_750);
    expect(msToNextMinute(Date.parse("2025-11-25T14:08:00.000Z"))).toBe(60_000);
  });
});
