/** Data model shared by the pure terminal modules and the React renderer. */
import type { PanelId } from "../panels";

/** Colour classes, rendered as `t-<tone>` in src/styles/terminal.css. */
export type Tone =
  | "accent"
  | "pink"
  | "rose"
  | "violet"
  | "lilac"
  | "mint"
  | "sky"
  | "gold"
  | "muted"
  | "err"
  | "bold"
  | "c0" | "c1" | "c2" | "c3" | "c4" | "c5" | "c6" | "c7";

/**
 * A run of text. With `href` it renders as a real external anchor.
 * `decorative` spans (separators, colour swatches) are hidden from screen readers.
 */
export type Span = { text: string; tone?: Tone; href?: string; decorative?: boolean };

/** One rendered row of output. */
export type TextLine = { type: "line"; spans: Span[] };
/** fastfetch-style output: decorative logo column + info rows. */
export type FetchBlock = { type: "fetch"; logo: Span[][]; info: Span[][] };
export type Block = TextLine | FetchBlock;

/** An animation step: wait `delay` ms, then print a block or type text after a prompt. */
export type Step =
  | { kind: "print"; block: Block; delay: number }
  | { kind: "type"; prefix: Span[]; text: string; delay: number; charDelay: number };

export type Effect =
  | { type: "open"; id: PanelId }
  | { type: "close" }
  | { type: "clear" }
  | { type: "openUrl"; url: string }
  | { type: "animate"; steps: Step[] };

export type Result = { blocks: Block[]; effects: Effect[] };
