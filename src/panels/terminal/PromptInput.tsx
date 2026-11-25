import { useLayoutEffect, useState, type KeyboardEvent, type Ref, type RefObject } from "react";
import type { Span } from "../../desktop/terminal/types";
import { Spans } from "./Output";

/**
 * The live prompt: a real <input> (transparent text) over an aria-hidden mirror that draws
 * the text and a block cursor at the caret. Hidden visually while output is animating,
 * but kept focusable so Ctrl+C still reaches it.
 */
export function PromptInput({ ref, prompt, value, hidden, onChange, onKeyDown }: {
  ref: Ref<HTMLInputElement>;
  prompt: Span[];
  value: string;
  hidden: boolean;
  onChange: (value: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}) {
  const [caret, setCaret] = useState(0);
  const sync = (el: HTMLInputElement | null) => {
    if (el) setCaret(el.selectionDirection === "backward" ? el.selectionStart ?? 0 : el.selectionEnd ?? el.value.length);
  };

  // Programmatic changes (history, completion) put the caret at the end.
  useLayoutEffect(() => {
    sync((ref as RefObject<HTMLInputElement | null>).current);
  }, [value, ref]);

  const at = Math.min(caret, value.length);
  return (
    <div className={`term-prompt${hidden ? " is-waiting" : ""}`}>
      <span aria-hidden="true"><Spans spans={prompt} /></span>
      <span className="term-field">
        <span className="term-mirror" aria-hidden="true">
          {value.slice(0, at)}
          <span className="term-cursor">{value[at] ?? " "}</span>
          {value.slice(at + 1)}
        </span>
        <input
          ref={ref}
          className="term-input"
          type="text"
          maxLength={200}
          value={value}
          aria-label="Terminal command input"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="send"
          onChange={(event) => {
            onChange(event.currentTarget.value);
            sync(event.currentTarget);
          }}
          onSelect={(event) => sync(event.currentTarget)}
          onKeyDown={onKeyDown}
          onKeyUp={(event) => sync(event.currentTarget)}
        />
      </span>
    </div>
  );
}
