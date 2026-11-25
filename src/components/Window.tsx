import { useEffect, useLayoutEffect, useRef, useState, type AnimationEvent, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { type Bounds } from "../desktop/geometry";
import { FALLBACK_MS, MOTION, genieVars, prefersReducedMotion, type WindowPhase } from "../desktop/motion";
import { PANELS, type PanelId } from "../desktop/panels";
import type { WindowState } from "../desktop/windowReducer";
import { PanelContent } from "../panels";
import { Icon } from "./Icon";

export const MOVE_HINT_ID = "desk-move-hint";

type Props = {
  id: PanelId;
  bounds: Bounds;
  state: WindowState;
  active: boolean;
  zIndex: number;
  isDesktop: boolean;
  /** Exit animation running; the window is already closed in state. */
  closing?: boolean;
  launcherRect: (id: PanelId) => DOMRect | undefined;
  onExited?: (id: PanelId) => void;
  register: (id: PanelId, element: HTMLElement | null) => void;
  onRaise: (id: PanelId) => void;
  onMinimize: (id: PanelId) => void;
  onClose: (id: PanelId) => void;
  onToggleMaximize: (id: PanelId) => void;
  onPointerGesture: (event: PointerEvent<HTMLElement>, resize: boolean) => void;
  onKeyGesture: (event: KeyboardEvent<HTMLElement>, resize: boolean) => void;
};

export function Window({
  id, bounds, state, active, zIndex, isDesktop, closing = false, launcherRect, onExited, register,
  onRaise, onMinimize, onClose, onToggleMaximize, onPointerGesture, onKeyGesture,
}: Props) {
  const { label, title = label } = PANELS[id];
  const { minimized, maximized } = state;
  const canMove = isDesktop && !maximized;
  const maximizeButton = useRef<HTMLButtonElement>(null);
  const first = useRef(true);
  const element = useRef<HTMLElement>(null);

  // Motion phase. Derived during render so the class lands in the same commit as the state change.
  const [phase, setPhase] = useState<WindowPhase>(() => (prefersReducedMotion() ? "idle" : "entering"));
  const [seen, setSeen] = useState({ minimized, maximized });
  if (seen.minimized !== minimized || seen.maximized !== maximized) {
    setSeen({ minimized, maximized });
    if (prefersReducedMotion()) {
      if (phase !== "idle") setPhase("idle");
    } else if (seen.minimized !== minimized) {
      setPhase(minimized ? "minimizing" : "restoring");
    } else if (isDesktop) {
      setPhase("morphing");
    }
  }

  useLayoutEffect(() => {
    register(id, closing ? null : element.current);
    return () => register(id, null);
  }, [id, closing, register]);

  // Genie: aim the window at its dock launcher before the animation's first frame.
  useLayoutEffect(() => {
    const node = element.current;
    if (!node || (phase !== "minimizing" && phase !== "restoring")) return;
    const launcher = isDesktop ? launcherRect(id) : undefined;
    const workspace = node.offsetParent?.getBoundingClientRect();
    if (!launcher || !workspace) {
      for (const name of ["x", "y", "sx", "sy"]) node.style.removeProperty(`--genie-${name}`);
      return;
    }
    const v = genieVars(
      { x: workspace.left + node.offsetLeft, y: workspace.top + node.offsetTop, width: node.offsetWidth, height: node.offsetHeight },
      launcher,
    );
    node.style.setProperty("--genie-x", `${v.x}px`);
    node.style.setProperty("--genie-y", `${v.y}px`);
    node.style.setProperty("--genie-sx", String(v.sx));
    node.style.setProperty("--genie-sy", String(v.sy));
  }, [phase, id, isDesktop, launcherRect]);

  // Timeout fallback: animationend never fires under reduced motion or display:none.
  useEffect(() => {
    if (phase === "idle") return;
    const ms = { entering: MOTION.open, minimizing: MOTION.genie, restoring: MOTION.genie, morphing: MOTION.morph }[phase];
    const timer = setTimeout(() => setPhase("idle"), ms + FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (!closing) return;
    const timer = setTimeout(() => onExited?.(id), (prefersReducedMotion() ? 0 : MOTION.close) + FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [closing, id, onExited]);

  function onAnimationEnd(event: AnimationEvent<HTMLElement>) {
    if (event.target !== event.currentTarget) return;
    if (closing) onExited?.(id);
    else if (phase !== "idle" && phase !== "morphing") setPhase("idle");
  }

  // Maximizing removes the focused title/resize grip from the tab order; keep keyboard focus in the window.
  useLayoutEffect(() => {
    if (first.current) { first.current = false; return; }
    if (document.activeElement === document.body) maximizeButton.current?.focus({ preventScroll: true });
  }, [maximized]);

  return (
    <section
      id={`window-${id}`}
      data-window={id}
      ref={element}
      aria-label={label}
      tabIndex={-1}
      hidden={minimized && phase !== "minimizing"}
      inert={closing || phase === "minimizing"}
      onAnimationEnd={onAnimationEnd}
      onTransitionEnd={(event) => {
        if (phase === "morphing" && event.target === event.currentTarget && event.propertyName === "height") setPhase("idle");
      }}
      onPointerDown={() => { if (phase === "morphing") setPhase("idle"); onRaise(id); }}
      onFocusCapture={() => onRaise(id)}
      className={`desk-window desk-${id}${maximized ? " is-max" : ""}${active ? " is-active" : ""}${closing ? " is-closing" : phase === "idle" ? "" : ` is-${phase}`}`}
      style={{
        "--window-x": bounds.x + "px",
        "--window-y": bounds.y + "px",
        "--window-width": bounds.width + "px",
        "--window-height": bounds.height + "px",
        zIndex,
      } as CSSProperties}
    >
      <div
        className="desk-titlebar"
        onPointerDown={(event) => onPointerGesture(event, false)}
        onDoubleClick={(event) => {
          if (isDesktop && !(event.target as Element).closest("button")) onToggleMaximize(id);
        }}
      >
        <span
          className="desk-title"
          data-app={id}
          role={canMove ? "button" : undefined}
          aria-roledescription={canMove ? "movable window" : undefined}
          aria-describedby={canMove ? MOVE_HINT_ID : undefined}
          tabIndex={canMove ? 0 : undefined}
          onKeyDown={canMove ? (event) => onKeyGesture(event, false) : undefined}
        >
          <Icon name={id} />
          {title}
        </span>
        <div className="desk-controls">
          <button type="button" title="Minimize" aria-label={`Minimize ${label}`} onClick={() => onMinimize(id)}>
            <Icon name="minus" />
          </button>
          <button
            ref={maximizeButton}
            type="button"
            className="desk-maximize"
            title={maximized ? "Restore" : "Maximize"}
            aria-label={`${maximized ? "Restore" : "Maximize"} ${label}`}
            onClick={() => onToggleMaximize(id)}
          >
            <Icon name={maximized ? "restore" : "expand"} />
          </button>
          <button type="button" className="desk-close" title="Close" aria-label={`Close ${label}`} onClick={() => onClose(id)}>
            <Icon name="close" />
          </button>
        </div>
      </div>
      <div className="desk-body">
        <PanelContent id={id} minimized={minimized} />
      </div>
      {!maximized && (
        <button
          type="button"
          className="desk-resize"
          aria-label={`Resize ${label}`}
          aria-describedby={MOVE_HINT_ID}
          title="Drag to resize or use arrow keys"
          onPointerDown={(event) => onPointerGesture(event, true)}
          onKeyDown={(event) => onKeyGesture(event, true)}
        />
      )}
    </section>
  );
}

