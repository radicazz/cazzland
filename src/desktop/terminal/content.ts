/**
 * Everything the terminal says about Cazz lives here, so it can be edited without touching
 * command logic. Facts must match the rest of the site; playful "system" lines are fine when
 * they are obviously a joke or computed live from the visitor's browser.
 * See docs/terminal.md.
 */
import { FEATURED, watchUrl } from "../featured";
import type { Span, Tone } from "./types";

export const USER = "cazz";
export const HOST = "cazzland";
export const HOME = "/home/cazz";
export const SHELL = "zsh";

/** The bundled latest upload (single source of truth: src/desktop/featured.ts). */
export const FEATURED_VIDEO = { title: FEATURED.title, url: watchUrl(FEATURED.id) };

export type LinkInfo = { id: string; label: string; url: string; handle: string };

/** Social links. `id` is also the command name (`youtube`, `open discord`, ...). */
export const LINKS: LinkInfo[] = [
  { id: "youtube", label: "YouTube", url: "https://www.youtube.com/@cazz", handle: "@cazz" },
  { id: "github", label: "GitHub", url: "https://github.com/cazzwastaken", handle: "cazzwastaken" },
  { id: "x", label: "X", url: "https://twitter.com/cazzwastaken", handle: "@cazzwastaken" },
  { id: "discord", label: "Discord", url: "https://discord.gg/xyxbg5VpcG", handle: "discord.gg/xyxbg5VpcG" },
  { id: "patreon", label: "Patreon", url: "https://www.patreon.com/cazzwastaken", handle: "cazzwastaken" },
];
/** Extra names that resolve to a link. */
export const LINK_ALIASES: Record<string, string> = { twitter: "x" };

export const SITE = "cazz.tech";

export const BLURB = "I make videos about C++, reverse engineering, and how games work.";

/** Contents of `cat about.txt`. */
export const ABOUT_TXT: string[] = [
  "Hey, I'm Cazz.",
  BLURB,
  "",
  "New uploads land in videos/ (or just type `videos`).",
  "Say hi on Discord: `discord`. Support the channel: `patreon`.",
];

/**
 * Original ASCII mark (a Gentoo-ish swirl). Each row is coloured top to bottom with
 * `LOGO_TONES`; keep rows the same width so the info column lines up.
 */
export const LOGO: string[] = [
  "      .-~~~~~~-.      ",
  "    .'  .----.  '.    ",
  "   /   /  ()  \\   \\   ",
  "  ;   |   ''   |   ;  ",
  "  |    \\      /   .'  ",
  "   \\    '----'  .'    ",
  "    '.        .'      ",
  "     .'     .'        ",
  "   .'    .-'          ",
  "  (___.-'             ",
];
export const LOGO_TONES: Tone[] = ["pink", "pink", "pink", "rose", "rose", "accent", "accent", "lilac", "violet", "violet"];

/** Snapshot of the visitor's environment, gathered by the React layer. */
export type SystemInfo = {
  now: Date;
  /** ms since page load (performance.now()). */
  uptimeMs: number;
  viewport: { width: number; height: number };
  locale: string;
  timeZone: string;
  /** navigator.hardwareConcurrency, when the browser exposes it. */
  cores?: number;
  /** navigator.deviceMemory (GiB, rounded by the browser), when exposed. */
  memoryGiB?: number;
  /** Number of apps (panels) installed. */
  apps: number;
};

export function formatUptime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${s}s`;
  return `${s}s`;
}

/**
 * The right-hand column of `fastfetch`. Return `null` to omit a line
 * (e.g. when the browser does not expose a value).
 */
export const FETCH_FIELDS: { label: string; value: (sys: SystemInfo) => string | Span[] | null }[] = [
  { label: "OS", value: () => "Gentoo Linux (cazzland)" },
  { label: "Host", value: () => SITE },
  { label: "Uptime", value: (sys) => formatUptime(sys.uptimeMs) },
  { label: "Packages", value: (sys) => `${sys.apps} (apps)` },
  { label: "Shell", value: () => `${SHELL} (cazzsh)` },
  { label: "Resolution", value: (sys) => `${sys.viewport.width}x${sys.viewport.height}` },
  { label: "WM", value: () => "cazzland" },
  { label: "Terminal", value: () => "cazzterm" },
  {
    label: "Hardware",
    value: (sys) => {
      const parts = [sys.cores && `${sys.cores} threads`, sys.memoryGiB && `~${sys.memoryGiB} GiB`].filter(Boolean);
      return parts.length ? `${parts.join(", ")} (yours)` : null;
    },
  },
  { label: "Locale", value: (sys) => `${sys.locale} (${sys.timeZone})` },
  { label: "Topics", value: () => "C++, reverse engineering, how games work" },
  {
    label: "Latest",
    value: () => [{ text: FEATURED_VIDEO.title, href: FEATURED_VIDEO.url }],
  },
];

/** Links printed after opening an app by name (e.g. `about`). */
export const APP_LINKS: Record<string, string[]> = {
  about: ["youtube", "github", "x", "discord", "patreon"],
};

/** Login banner shown before `login:` during boot. */
export const BANNER = `This is ${HOST}.${SITE} (Gentoo Linux, tty1)`;

/** Hint printed at the end of the boot sequence. */
export const HINT: Span[] = [
  { text: "type ", tone: "muted" },
  { text: "help", tone: "accent" },
  { text: " for commands, or try ", tone: "muted" },
  { text: "videos", tone: "accent" },
  { text: ", ", tone: "muted" },
  { text: "links", tone: "accent" },
  { text: ", ", tone: "muted" },
  { text: "fastfetch", tone: "accent" },
];

/** Files and folders shown by `ls` in ~. Folders end with "/". */
export const HOME_ENTRIES = ["about.txt", "apps/", "links/", "videos/"];
