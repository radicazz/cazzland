/**
 * PURE terminal session state: the printed log plus a queue of animation steps
 * (boot sequence, emerge). The React hook only schedules `advance` after `nextDelay()` ms,
 * so a StrictMode double-mount can never duplicate output: timers are cleared on cleanup
 * and every transition lives here.
 */
import { stepBlock } from "./commands";
import type { Block, Span, Step } from "./types";

/** `fresh` entries may play their reveal animation; skipping the boot clears it. */
export type Entry = { id: number; block: Block; fresh: boolean };
export type Typing = { prefix: Span[]; text: string; shown: number; charDelay: number };
export type Mode = "boot" | "busy" | "idle";

export type Session = {
  entries: Entry[];
  queue: Step[];
  typing: Typing | null;
  mode: Mode;
  nextId: number;
};

export type SessionAction =
  | { type: "advance" }
  | { type: "flush" }
  | { type: "cancel" }
  | { type: "append"; blocks: Block[] }
  | { type: "clear" }
  | { type: "enqueue"; steps: Step[] };

/** Oldest entries are dropped beyond this many. */
export const MAX_ENTRIES = 400;

function append(state: Session, blocks: Block[], fresh = true): Session {
  if (!blocks.length) return state;
  const added = blocks.map((block, i) => ({ id: state.nextId + i, block, fresh }));
  return { ...state, entries: [...state.entries, ...added].slice(-MAX_ENTRIES), nextId: state.nextId + blocks.length };
}

export function createSession(steps: Step[], instant: boolean): Session {
  const empty: Session = { entries: [], queue: [], typing: null, mode: "idle", nextId: 0 };
  if (instant) return append(empty, steps.map(stepBlock), false);
  return { ...empty, queue: steps, mode: steps.length ? "boot" : "idle" };
}

/** ms until the next `advance`, or null when nothing is animating. */
export function nextDelay(state: Session): number | null {
  if (state.typing) return state.typing.charDelay;
  const head = state.queue[0];
  return head ? head.delay : null;
}

const settle = (state: Session): Session =>
  !state.typing && !state.queue.length && state.mode !== "idle" ? { ...state, mode: "idle" } : state;

export function sessionReducer(state: Session, action: SessionAction): Session {
  switch (action.type) {
    case "advance": {
      if (state.typing) {
        const typing = state.typing;
        const shown = typing.shown + 1;
        if (shown < typing.text.length) return { ...state, typing: { ...typing, shown } };
        const done = { ...state, typing: null };
        return settle(append(done, [{ type: "line", spans: [...typing.prefix, { text: typing.text }] }]));
      }
      const [head, ...queue] = state.queue;
      if (!head) return settle(state);
      if (head.kind === "print") return settle(append({ ...state, queue }, [head.block]));
      if (!head.text) return settle(append({ ...state, queue }, [stepBlock(head)]));
      return { ...state, queue, typing: { prefix: head.prefix, text: head.text, shown: 0, charDelay: head.charDelay } };
    }
    case "flush": {
      const pending: Block[] = [];
      if (state.typing) pending.push({ type: "line", spans: [...state.typing.prefix, { text: state.typing.text }] });
      pending.push(...state.queue.map(stepBlock));
      const entries = state.entries.map((entry) => (entry.fresh ? { ...entry, fresh: false } : entry));
      return settle(append({ ...state, entries, queue: [], typing: null }, pending, false));
    }
    case "cancel":
      return settle({ ...state, queue: [], typing: null });
    case "append":
      return append(state, action.blocks);
    case "clear":
      return { ...state, entries: [] };
    case "enqueue":
      if (!action.steps.length) return state;
      return { ...state, queue: [...state.queue, ...action.steps], mode: state.mode === "boot" ? "boot" : "busy" };
  }
}
