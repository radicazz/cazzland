import { useEffect, useId, useRef, useState, type KeyboardEvent, type Ref } from "react";
import { PANEL_IDS, PANELS, type PanelId } from "../desktop/panels";
import { Icon } from "./Icon";

type Props = {
  open: PanelId[];
  onOpen: (id: PanelId) => void;
  buttonRef: Ref<HTMLButtonElement>;
};

/** The brand button plus a dropdown listing every app, so a closed app is always reachable. */
export function AppMenu({ open, onOpen, buttonRef }: Props) {
  const [expanded, setExpanded] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement | null>(null);
  const listId = useId();

  // Focus moves into the menu on open.
  useEffect(() => {
    if (expanded) root.current?.querySelector<HTMLButtonElement>(".desk-menu button")?.focus();
  }, [expanded]);

  useEffect(() => {
    if (!expanded) return;
    function onPointerDown(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setExpanded(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [expanded]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!expanded) return;
    if (event.key === "Escape") {
      event.stopPropagation();
      setExpanded(false);
      button.current?.focus();
      return;
    }
    const step = event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    const items = [...root.current!.querySelectorAll<HTMLButtonElement>(".desk-menu button")];
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    event.preventDefault();
    items[(index + step + items.length) % items.length]?.focus();
  }

  return (
    <div
      className="desk-appmenu"
      ref={root}
      onKeyDown={onKeyDown}
      onBlur={(event) => {
        if (expanded && !root.current?.contains(event.relatedTarget as Node | null)) setExpanded(false);
      }}
    >
      <button
        type="button"
        className="desk-brand"
        aria-expanded={expanded}
        aria-controls={expanded ? listId : undefined}
        ref={(element) => {
          button.current = element;
          if (typeof buttonRef === "function") buttonRef(element);
          else if (buttonRef) buttonRef.current = element;
        }}
        onClick={() => setExpanded((value) => !value)}
      >
        <Icon name="terminal" /> Desktop
      </button>
      {expanded && (
        <ul className="desk-menu" id={listId} aria-label="Apps">
          {PANEL_IDS.map((id) => (
            <li key={id}>
              <button
                type="button"
                data-app={id}
                onClick={() => {
                  setExpanded(false);
                  onOpen(id);
                }}
              >
                <span className="desk-tile"><Icon name={id} /></span>
                <span className="desk-menu-label">{PANELS[id].label}</span>
                {open.includes(id) && <span className="desk-menu-open">open</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
