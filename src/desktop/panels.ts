/**
 * Panel registry (data only, no React). To add a panel, see docs/adding-a-panel.md.
 * Every panel needs: an id here, an icon in components/Icon.tsx,
 * content in panels/index.tsx, and a `[data-app]` color pair in styles/tokens.css.
 */
import { clamp, PADDING, type Bounds, type Size } from "./geometry";

export type PanelId = "videos" | "community" | "socials" | "support" | "about";

type PanelMeta = {
  /** Name used in the dock, shortcuts and aria-labels. */
  label: string;
  /** Window title, when it differs from the label. */
  title?: string;
  /** Smallest size the window may be resized to without clipping its content. */
  min?: Size;
};

export const PANEL_IDS: PanelId[] = ["videos", "community", "socials", "support", "about"];

export const PANELS: Record<PanelId, PanelMeta> = {
  videos: { label: "Videos", title: "Latest upload", min: { width: 380, height: 366 } },
  community: { label: "Community" },
  socials: { label: "Socials" },
  support: { label: "Support" },
  about: { label: "About" },
};

export function defaultBounds(id: PanelId, area: Size): Bounds {
  const { width, height } = area;
  const videoWidth = clamp(width * 0.44, 380, 720);
  const gutter = clamp(width * 0.045, 24, 80);
  const videoX = width - videoWidth - gutter;
  if (id === "videos") {
    return { x: videoX, y: height * 0.1, width: videoWidth, height: (videoWidth * 9) / 16 + 150 };
  }
  if (id === "about") {
    const profileWidth = clamp(width * 0.28, 300, 400);
    return { x: Math.max(PADDING, videoX - profileWidth - 24), y: height * 0.57, width: profileWidth, height: 232 };
  }
  // Cascade the small link panels down and to the right.
  const step = PANEL_IDS.indexOf(id) - 1;
  return { x: width * 0.17 + step * 27, y: height * 0.24 + step * 28, width: 350, height: id === "socials" ? 240 : 156 };
}
