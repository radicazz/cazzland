import { PANEL_IDS, PANELS, type PanelId } from "../desktop/panels";
import { Icon } from "./Icon";

type Props = {
  /** Open windows (minimized ones included). */
  open: PanelId[];
  minimized: (id: PanelId) => boolean;
  active?: PanelId;
  register: (id: PanelId, element: HTMLButtonElement | null) => void;
  onToggle: (id: PanelId) => void;
  onClose: (id: PanelId) => void;
};

/**
 * One tab per open window, in the menu bar (desktop only). Plain toggle buttons rather than role="tab":
 * there is no single tabpanel and no roving focus.
 */
export function Tabs({ open, minimized, active, register, onToggle, onClose }: Props) {
  return (
    <nav className="desk-tabs" aria-label="Open windows">
      {PANEL_IDS.filter((id) => open.includes(id)).map((id) => {
        const { label } = PANELS[id];
        const isMinimized = minimized(id);
        return (
          <div
            key={id}
            data-app={id}
            className={`desk-tab${active === id ? " is-active" : ""}${isMinimized ? " is-minimized" : ""}`}
          >
            <button
              type="button"
              className="desk-tab-main"
              aria-pressed={active === id && !isMinimized}
              aria-controls={`window-${id}`}
              aria-label={label}
              title={isMinimized ? `${label} (minimized)` : label}
              ref={(element) => register(id, element)}
              onClick={() => onToggle(id)}
            >
              <span className="desk-tab-icon"><Icon name={id} /></span>
              <span className="desk-tab-label">{label}</span>
            </button>
            <button type="button" className="desk-tab-close" aria-label={`Close ${label}`} title="Close" onClick={() => onClose(id)}>
              <Icon name="close" />
            </button>
          </div>
        );
      })}
    </nav>
  );
}
