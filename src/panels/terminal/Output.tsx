import { memo, type CSSProperties } from "react";
import type { Block, Span } from "../../desktop/terminal/types";

const toneClass = (span: Span) => (span.tone ? `t-${span.tone}` : undefined);

export function SpanView({ span }: { span: Span }) {
  if (span.href) {
    return (
      <a className={span.tone ? `term-link t-${span.tone}` : "term-link"} href={span.href} target="_blank" rel="noreferrer">
        {span.text}
      </a>
    );
  }
  const className = toneClass(span);
  if (span.decorative) return <span className={className} aria-hidden="true">{span.text}</span>;
  return className ? <span className={className}>{span.text}</span> : <>{span.text}</>;
}

export function Spans({ spans }: { spans: Span[] }) {
  // An empty line still takes one row of height.
  if (!spans.length) return <>{" "}</>;
  return <>{spans.map((span, i) => <SpanView key={i} span={span} />)}</>;
}

/** One printed block. `reveal` staggers the fastfetch rows in (CSS only, transform/opacity). */
export const BlockView = memo(function BlockView({ block, reveal }: { block: Block; reveal: boolean }) {
  if (block.type === "line") {
    return <div className="term-line"><Spans spans={block.spans} /></div>;
  }
  const row = (i: number) => (reveal ? { className: "term-row is-revealing", style: { "--i": i } as CSSProperties } : { className: "term-row" });
  return (
    <div className="term-fetch">
      <div className="term-logo" aria-hidden="true">
        {block.logo.map((spans, i) => <div key={i} {...row(i)}><Spans spans={spans} /></div>)}
      </div>
      <div className="term-info">
        {block.info.map((spans, i) => <div key={i} {...row(i + 2)}><Spans spans={spans} /></div>)}
      </div>
    </div>
  );
});
