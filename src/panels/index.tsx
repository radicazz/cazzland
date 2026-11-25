import { memo, type ComponentType } from "react";
import type { PanelId } from "../desktop/panels";
import Video from "../Video";
import { About } from "./About";
import { Community, Socials, Support } from "./Links";

/** Props every panel body receives. `minimized` lets a panel stop background work (e.g. video). */
export type PanelProps = { minimized: boolean };

const content: Record<PanelId, ComponentType<PanelProps>> = {
  videos: Video,
  about: About,
  socials: Socials,
  community: Community,
  support: Support,
};

/** Memoized so dragging a window does not re-render every panel body. */
export const PanelContent = memo(function PanelContent({ id, minimized }: { id: PanelId } & PanelProps) {
  const Body = content[id];
  return <Body minimized={minimized} />;
});
