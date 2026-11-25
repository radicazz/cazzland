import { useEffect, useLayoutEffect, useReducer, useRef, useState, type KeyboardEvent } from "react";
import type { PanelProps } from ".";
import { PANEL_IDS } from "../desktop/panels";
import { prefersReducedMotion } from "../desktop/motion";
import {
  bootSteps,
  complete,
  promptLine,
  promptSpans,
  pushHistory,
  run,
  stepBlock,
  stepHistory,
  line,
} from "../desktop/terminal/commands";
import type { SystemInfo } from "../desktop/terminal/content";
import { createSession, nextDelay, sessionReducer } from "../desktop/terminal/session";
import type { Effect } from "../desktop/terminal/types";
import { BlockView, Spans } from "./terminal/Output";
import { PromptInput } from "./terminal/PromptInput";
import "../styles/terminal.css";

/** Live facts about the visitor's browser, read fresh for every command. */
function readSystem(): SystemInfo {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const intl = Intl.DateTimeFormat().resolvedOptions();
  return {
    now: new Date(),
    uptimeMs: performance.now(),
    viewport: { width: window.innerWidth, height: window.innerHeight },
    locale: intl.locale,
    timeZone: intl.timeZone,
    cores: nav.hardwareConcurrency || undefined,
    memoryGiB: nav.deviceMemory || undefined,
    apps: PANEL_IDS.length,
  };
}

const hasTextSelection = () => Boolean(window.getSelection()?.toString());

export function Terminal({ minimized, openApp, closeSelf }: PanelProps) {
  const [reduced] = useState(prefersReducedMotion);
  const [session, dispatch] = useReducer(sessionReducer, reduced, (instant) => createSession(bootSteps(readSystem()), instant));
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const historyIndex = useRef<number | null>(null);
  const draft = useRef("");
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const booting = session.mode === "boot";
  const delay = nextDelay(session);

  // One timer drives every animation step. Cleanup clears it, so StrictMode's
  // mount/unmount/mount cannot double-print, and minimizing pauses the animation.
  useEffect(() => {
    if (minimized || delay === null) return;
    const timer = window.setTimeout(() => dispatch({ type: "advance" }), delay);
    return () => window.clearTimeout(timer);
  }, [session, minimized, delay]);

  // Any key press or click skips the boot sequence to its finished state.
  useEffect(() => {
    if (!booting) return;
    const skip = () => dispatch({ type: "flush" });
    window.addEventListener("keydown", skip, true);
    window.addEventListener("pointerdown", skip, true);
    return () => {
      window.removeEventListener("keydown", skip, true);
      window.removeEventListener("pointerdown", skip, true);
    };
  }, [booting]);

  // Focus the prompt on mount, but not on touch devices (it would pop the on-screen keyboard).
  useEffect(() => {
    if (matchMedia("(pointer: fine)").matches) input.current?.focus({ preventScroll: true });
  }, []);

  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [session.entries, session.typing, value]);

  function perform(effect: Effect) {
    switch (effect.type) {
      case "clear": dispatch({ type: "clear" }); break;
      case "open": openApp(effect.id); break;
      case "close": closeSelf(); break;
      // Runs inside the key handler, so the browser treats it as user-initiated.
      case "openUrl": window.open(effect.url, "_blank", "noopener,noreferrer"); break;
      case "animate":
        if (reduced) dispatch({ type: "append", blocks: effect.steps.map(stepBlock) });
        else dispatch({ type: "enqueue", steps: effect.steps });
        break;
    }
  }

  function submit() {
    const nextHistory = pushHistory(history, value);
    const result = run(value, { sys: readSystem(), history: nextHistory });
    dispatch({ type: "append", blocks: [promptLine(value), ...result.blocks] });
    setHistory(nextHistory);
    historyIndex.current = null;
    draft.current = "";
    setValue("");
    result.effects.forEach(perform);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const el = event.currentTarget;
    const ctrl = event.ctrlKey && !event.metaKey && !event.altKey;
    if (booting) {
      // The window-level listener has already skipped the boot; just don't submit or print ^C.
      if (event.key === "Enter" || ctrl) event.preventDefault();
      return;
    }
    if (ctrl && event.key.toLowerCase() === "c") {
      // Let a real selection be copied.
      if (el.selectionStart !== el.selectionEnd || hasTextSelection()) return;
      event.preventDefault();
      const interrupted = { text: "^C", tone: "muted" } as const;
      if (session.mode === "busy") {
        dispatch({ type: "cancel" });
        dispatch({ type: "append", blocks: [line(interrupted)] });
      } else {
        dispatch({ type: "append", blocks: [line(...promptSpans(), value, interrupted)] });
      }
      setValue("");
      historyIndex.current = null;
      return;
    }
    if (ctrl && event.key.toLowerCase() === "l") {
      event.preventDefault();
      dispatch({ type: "clear" });
      return;
    }
    if (session.mode !== "idle") {
      // Output is still printing (boot, emerge): don't start another command yet.
      if (event.key === "Enter") event.preventDefault();
      return;
    }
    switch (event.key) {
      case "Enter":
        event.preventDefault();
        submit();
        break;
      case "ArrowUp":
      case "ArrowDown": {
        event.preventDefault();
        if (historyIndex.current === null) draft.current = value;
        const step = stepHistory(history, historyIndex.current, event.key === "ArrowUp" ? -1 : 1, draft.current);
        historyIndex.current = step.index;
        setValue(step.value);
        break;
      }
      case "Tab": {
        // Only capture Tab when there is something to complete, so keyboard users can still tab out.
        if (event.shiftKey || !value.trim()) return;
        const result = complete(value);
        if (result.value === value && !result.options.length) return;
        event.preventDefault();
        if (result.value !== value) setValue(result.value);
        else dispatch({ type: "append", blocks: [promptLine(value), line({ text: result.options.join("  "), tone: "mint" })] });
        break;
      }
    }
  }

  return (
    <div
      className={`term${booting ? " is-booting" : ""}`}
      ref={scroller}
      onClick={(event) => {
        if ((event.target as Element).closest("a") || hasTextSelection()) return;
        input.current?.focus({ preventScroll: true });
      }}
    >
      <div className="term-log" role="log" aria-live={booting ? "off" : "polite"} aria-label="Terminal output">
        {session.entries.map((entry) => (
          <BlockView key={entry.id} block={entry.block} reveal={entry.fresh && !reduced} />
        ))}
      </div>
      {session.typing && (
        <div className="term-line" aria-hidden="true">
          <Spans spans={session.typing.prefix} />
          {session.typing.text.slice(0, session.typing.shown)}
          <span className="term-cursor is-solid">{" "}</span>
        </div>
      )}
      <PromptInput
        ref={input}
        prompt={promptSpans()}
        value={value}
        hidden={session.mode !== "idle"}
        onChange={(next) => {
          setValue(next);
          historyIndex.current = null;
        }}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}
