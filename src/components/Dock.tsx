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
  return (
    <nav className="desk-dock" aria-label="Desktop apps">
      {PANEL_IDS.map((id) => {
        const isOpen = open.includes(id);
        return (
          <button
            type="button"
            key={id}
            data-app={id}
            className={active === id ? "is-active" : ""}
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
