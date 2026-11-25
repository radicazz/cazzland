import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import type { Size } from "./geometry";

/** Below this width the desktop collapses into a scrolling stack of cards. */
export const DESKTOP_QUERY = "(min-width: 761px)";

/**
 * Tracks the workspace size and breakpoint. `areaRef` always holds the latest size,
 * so long-lived pointer handlers never read a stale copy.
 */
export function useWorkspace(element: RefObject<HTMLElement | null>) {
  const [area, setArea] = useState<Size>({ width: 0, height: 0 });
  const [isDesktop, setIsDesktop] = useState(() => matchMedia(DESKTOP_QUERY).matches);
  const areaRef = useRef(area);

  useLayoutEffect(() => {
    const node = element.current!;
    const query = matchMedia(DESKTOP_QUERY);
    function measure() {
      areaRef.current = { width: node.clientWidth, height: node.clientHeight };
      setArea(areaRef.current);
      setIsDesktop(query.matches);
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    query.addEventListener("change", measure);
    return () => {
      observer.disconnect();
      query.removeEventListener("change", measure);
    };
  }, [element]);

  return { area, areaRef, isDesktop };
}
