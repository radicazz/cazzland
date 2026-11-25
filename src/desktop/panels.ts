/**
 * Panel registry (data only, no React). To add a panel, see docs/adding-a-panel.md.
 * Every panel needs: an id here, an icon in components/Icon.tsx,
 * content in panels/index.tsx, and a `[data-app]` color pair in styles/tokens.css.
 */
import { clamp, PADDING, type Bounds, type Size } from "./geometry";

export type PanelId = "about" | "terminal" | "videos";

type PanelMeta = {
  /** Name used in the dock, shortcuts and aria-labels. */
  label: string;
  /** Window title, when it differs from the label. */
  title?: string;
  /** Smallest size the window may be resized to without clipping its content. */
  min?: Size;
};

export const PANEL_IDS: PanelId[] = ["terminal", "about", "videos"];

export const PANELS: Record<PanelId, PanelMeta> = {
  videos: { label: "Videos", title: "Latest upload", min: { width: 380, height: 366 } },
  about: { label: "About", min: { width: 320, height: 430 } },
  terminal: { label: "Terminal", title: "cazz@cazzland: ~", min: { width: 420, height: 300 } },
};

/** Space reserved at the left of the workspace for the desktop-shortcuts column (visible above 900px). */
export const SHORTCUTS_RESERVE = 130;
/** Fixed chrome inside the video window (title bar, caption, "Watch on YouTube" row) below the 16:9 frame. */
export const VIDEO_CHROME = 150;
/** Gap between side-by-side windows. */
const GUTTER = 16;
/** Tall enough for the login + fastfetch boot without scrolling (the terminal is not tied to the 16:9 video). */
const TERMINAL_MIN_HEIGHT = 540;

/** Terminal left half, Videos right half; overlapping (terminal over videos) when the workspace is too narrow. */
function mainWindows(area: Size): { videos: Bounds; terminal: Bounds } {
  const { width, height } = area;
  const left = width > 900 ? SHORTCUTS_RESERVE : PADDING;
  const avail = width - left - PADDING;
  const minVideo = PANELS.videos.min!.width;
  const minTerminal = PANELS.terminal.min!.width;
  const heightLimit = ((height - 2 * PADDING - VIDEO_CHROME) * 16) / 9;
  const place = (videoWidth: number, terminalWidth: number, terminalX: number, videoX: number, dy: number) => {
    const h = (videoWidth * 9) / 16 + VIDEO_CHROME;
    const y = clamp(height * 0.08, PADDING, Math.max(PADDING, height - h - PADDING - dy));
    return {
      videos: { x: videoX, y, width: videoWidth, height: h },
      // The terminal needs room for the boot output even when the video window is small.
      terminal: { x: terminalX, y: y + dy, width: terminalWidth, height: Math.min(Math.max(h, TERMINAL_MIN_HEIGHT), height - y - dy - PADDING) },
    };
  };

  if (avail >= minVideo + minTerminal + GUTTER) {
    const half = (avail - GUTTER) / 2;
    const videoWidth = Math.max(minVideo, Math.min(half, heightLimit));
    const videoX = width - PADDING - videoWidth;
    return place(videoWidth, videoX - GUTTER - left, left, videoX, 0);
  }
  const videoWidth = Math.max(minVideo, Math.min(avail * 0.62, heightLimit));
  const terminalWidth = Math.min(avail, Math.max(minTerminal, avail * 0.72));
  return place(videoWidth, terminalWidth, left, width - PADDING - videoWidth, 40);
}

export function defaultBounds(id: PanelId, area: Size): Bounds {
  const { width, height } = area;
  if (id === "videos" || id === "terminal") return mainWindows(area)[id];
  // About: a profile card with five link rows, off-centre so it does not hide the default pair.
  return { x: width * 0.17, y: height * 0.14, width: 360, height: 470 };
}
