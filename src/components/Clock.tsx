import { useEffect, useMemo, useState } from "react";
import { formatClock, msToNextMinute } from "../desktop/clockFormat";

export function Clock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer: number | undefined;
    const tick = () => {
      window.clearTimeout(timer);
      setNow(new Date());
      timer = window.setTimeout(tick, msToNextMinute(Date.now()));
    };
    timer = window.setTimeout(tick, msToNextMinute(Date.now()));
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const text = useMemo(() => formatClock(now), [now]);

  return (
    <time className="desk-clock" dateTime={text.iso} title={text.long}>
      <span className="desk-clock-full">{text.short}</span>
      <span className="desk-clock-compact">{text.compact}</span>
    </time>
  );
}
