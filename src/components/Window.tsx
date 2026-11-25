import { useLayoutEffect, useRef, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { type Bounds } from "../desktop/geometry";
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
  register: (id: PanelId, element: HTMLElement | null) => void;
  onRaise: (id: PanelId) => void;
  onMinimize: (id: PanelId) => void;
  onClose: (id: PanelId) => void;
  onToggleMaximize: (id: PanelId) => void;
  onPointerGesture: (event: PointerEvent<HTMLElement>, resize: boolean) => void;
  onKeyGesture: (event: KeyboardEvent<HTMLElement>, resize: boolean) => void;
};

export function Window({
  id, bounds, state, active, zIndex, isDesktop, register,
  onRaise, onMinimize, onClose, onToggleMaximize, onPointerGesture, onKeyGesture,
}: Props) {
  const { label, title = label } = PANELS[id];
  const { minimized, maximized } = state;
  const canMove = isDesktop && !maximized;
  const maximizeButton = useRef<HTMLButtonElement>(null);
  const first = useRef(true);

  // Maximizing removes the focused title/resize grip from the tab order; keep keyboard focus in the window.
  useLayoutEffect(() => {
    if (first.current) { first.current = false; return; }
    if (document.activeElement === document.body) maximizeButton.current?.focus({ preventScroll: true });
  }, [maximized]);

  return (
    <section
      id={`window-${id}`}
      data-window={id}
      ref={(element) => register(id, element)}
      aria-label={label}
      tabIndex={-1}
      hidden={minimized}
      onPointerDown={() => onRaise(id)}
      onFocusCapture={() => onRaise(id)}
      className={`desk-window desk-${id}${maximized ? " is-max" : ""}${active ? " is-active" : ""}`}
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

