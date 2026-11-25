import { PANEL_IDS, PANELS, type PanelId } from "../desktop/panels";
import { Icon } from "./Icon";

/** Desktop icons. The app menu and tabs are the guaranteed routes, so these are named "Open X" to stay distinct. */
export function Shortcuts({ hidden, onOpen }: { hidden: boolean; onOpen: (id: PanelId) => void }) {
  return (
    <nav className="desk-shortcuts" aria-label="Desktop shortcuts" hidden={hidden}>
      {PANEL_IDS.map((id) => (
        <button type="button" key={id} data-app={id} aria-label={`Open ${PANELS[id].label}`} onClick={() => onOpen(id)}>
          <span className="desk-tile"><Icon name={id} /></span>
          <span aria-hidden="true">{PANELS[id].label}</span>
        </button>
      ))}
    </nav>
  );
}
