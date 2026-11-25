import type { ReactNode } from "react";
import { Icon, type Glyph } from "../components/Icon";

export function LinkRow({ href, icon, children }: { href: string; icon: Glyph; children: ReactNode }) {
  return (
    <a className="desk-link" href={href} target="_blank" rel="noreferrer">
      <span><Icon name={icon} />{children}</span>
      <Icon name="external" />
    </a>
  );
}
