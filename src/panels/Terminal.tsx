import { Icon } from "../components/Icon";
import type { PanelProps } from ".";

export function Terminal(_props: PanelProps) {
  return (
    <div className="desk-profile">
      <img src="/portrait.webp" alt="" />
      <div>
        <h1>
          Hey, I’m Cazz<span>.</span>
        </h1>
        <p>I make videos about C++, reverse engineering, and how games work.</p>
        <a className="desk-profile-link" href="https://www.youtube.com/@cazz" target="_blank" rel="noreferrer">
          YouTube <Icon name="external" />
        </a>
      </div>
    </div>
  );
}
