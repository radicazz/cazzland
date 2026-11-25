import { useCallback, type Dispatch, type KeyboardEvent, type PointerEvent, type RefObject } from "react";
import { applyDelta, type Bounds, type Size } from "./geometry";
import type { PanelId } from "./panels";
import type { WindowAction } from "./windowReducer";

type Gesture = { id: PanelId; bounds: Bounds; min: Size; resize: boolean };

/** Pointer drag/resize and arrow-key move/resize. Reads the workspace size from a ref, never a stale closure. */
export function useGestures(areaRef: RefObject<Size>, isDesktop: boolean, dispatch: Dispatch<WindowAction>) {
  const update = useCallback(
    ({ id, bounds, min, resize }: Gesture, dx: number, dy: number) =>
      dispatch({ type: "setBounds", id, bounds: applyDelta(bounds, dx, dy, resize, areaRef.current, min) }),
    [areaRef, dispatch],
  );

  const startPointer = useCallback(
    (event: PointerEvent<HTMLElement>, gesture: Gesture, locked: boolean) => {
      if (
        !event.isPrimary || event.button !== 0 || locked || !isDesktop ||
        (!gesture.resize && (event.target as Element).closest("button"))
      ) return;

      const handle = event.currentTarget;
      const { clientX, clientY, pointerId } = event;
      handle.setPointerCapture(pointerId);
      let frame = 0;
      let latest: PointerEvent["nativeEvent"] | undefined;

      function flush() {
        frame = 0;
        if (latest) update(gesture, latest.clientX - clientX, latest.clientY - clientY);
      }
      function move(ev: globalThis.PointerEvent) {
        if (ev.pointerId !== pointerId) return;
        latest = ev;
        frame ||= requestAnimationFrame(flush);
      }
      function end(ev: globalThis.PointerEvent) {
        if (ev.pointerId !== pointerId) return;
        cancelAnimationFrame(frame);
        flush();
        handle.removeEventListener("pointermove", move);
        handle.removeEventListener("lostpointercapture", end);
      }
      handle.addEventListener("pointermove", move);
      handle.addEventListener("lostpointercapture", end);
    },
    [isDesktop, update],
  );

  const startKeyboard = useCallback(
    (event: KeyboardEvent<HTMLElement>, gesture: Gesture) => {
      const step = event.shiftKey ? 48 : 16;
      const dx = Number(event.key === "ArrowRight") - Number(event.key === "ArrowLeft");
      const dy = Number(event.key === "ArrowDown") - Number(event.key === "ArrowUp");
      if (!dx && !dy) return;
      event.preventDefault();
      update(gesture, dx * step, dy * step);
    },
    [update],
  );

  return { startPointer, startKeyboard };
}
