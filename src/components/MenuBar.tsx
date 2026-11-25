import type { Ref } from "react";
import type { PanelId } from "../desktop/panels";
import { AppMenu } from "./AppMenu";
import { Clock } from "./Clock";
import { Tabs } from "./Tabs";

type Props = {
  open: PanelId[];
  minimized: (id: PanelId) => boolean;
  active?: PanelId;
  /** Tabs are desktop-only; the dock takes over on phones. */
  showTabs: boolean;
  brandRef: Ref<HTMLButtonElement>;
  registerTab: (id: PanelId, element: HTMLButtonElement | null) => void;
  onToggle: (id: PanelId) => void;
  onClose: (id: PanelId) => void;
  onOpen: (id: PanelId) => void;
};

export function MenuBar({ open, minimized, active, showTabs, brandRef, registerTab, onToggle, onClose, onOpen }: Props) {
  return (
    <header className="desk-menubar">
      <AppMenu open={open} onOpen={onOpen} buttonRef={brandRef} />
      {showTabs ? (
        <Tabs open={open} minimized={minimized} active={active} register={registerTab} onToggle={onToggle} onClose={onClose} />
      ) : (
        <span className="desk-tabs-spacer" />
      )}
      <Clock />
    </header>
  );
}
