import { memo, type ComponentType } from "react";
import type { PanelId } from "../desktop/panels";
import Video from "../Video";
import { Terminal } from "./Terminal";
import { About } from "./About";

/**
 * Props every panel body receives.
 * - `minimized` lets a panel stop background work (e.g. video).
 * - `openApp` opens/raises/focuses another panel (used by the terminal's `open` command).
 * - `closeSelf` closes this panel's own window (the terminal's `exit`).
 * `openApp` is referentially stable, so the memo below keeps working.
 */
export type PanelProps = {
  minimized: boolean;
  openApp: (id: PanelId) => void;
  closeSelf: () => void;
};

const content: Record<PanelId, ComponentType<PanelProps>> = {
  videos: Video,
  terminal: Terminal,
  about: About,
};

/** Memoized so dragging a window does not re-render every panel body. */
export const PanelContent = memo(function PanelContent({ id, minimized, openApp, closePanel }: {
  id: PanelId;
  minimized: boolean;
  openApp: (id: PanelId) => void;
  closePanel: (id: PanelId) => void;
}) {
  const Body = content[id];
  return <Body minimized={minimized} openApp={openApp} closeSelf={() => closePanel(id)} />;
});
