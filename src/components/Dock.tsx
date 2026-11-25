import { useEffect, useRef, useState } from "react";
import { MOTION, prefersReducedMotion } from "../desktop/motion";
import { PANEL_IDS, PANELS, type PanelId } from "../desktop/panels";
import { Icon } from "./Icon";

type Props = {
  open: PanelId[];
  minimized: (id: PanelId) => boolean;
  active?: PanelId;
  register: (id: PanelId, element: HTMLButtonElement | null) => void;
  onToggle: (id: PanelId) => void;
};

export function Dock({ open, minimized, active, register, onToggle }: Props) {
  const [bouncing, setBouncing] = useState<PanelId | null>(null);
  const known = useRef(open);

  // Bounce a tile once when its app newly opens (not on first render).
  useEffect(() => {
    const opened = open.find((id) => !known.current.includes(id));
    known.current = open;
    if (!opened || prefersReducedMotion()) return;
    setBouncing(opened);
    const timer = setTimeout(() => setBouncing(null), MOTION.bounce + 80);
    return () => clearTimeout(timer);
  }, [open]);

  return (
    <nav className="desk-dock" aria-label="Desktop apps">
      {PANEL_IDS.map((id) => {
        const isOpen = open.includes(id);
        return (
          <button
            type="button"
            key={id}
            data-app={id}
            className={`${active === id ? "is-active" : ""}${bouncing === id ? " is-bouncing" : ""}`.trim()}
            aria-expanded={isOpen && !minimized(id)}
            aria-controls={isOpen ? `window-${id}` : undefined}
            ref={(element) => register(id, element)}
            onClick={() => onToggle(id)}
          >
            <span className="desk-tile"><Icon name={id} /></span>
            <span>{PANELS[id].label}</span>
          </button>
        );
      })}
    </nav>
  );
}
