import { Clock } from "./Clock";
import { Icon } from "./Icon";

export function MenuBar() {
  return (
    <header className="desk-menubar">
      <span className="desk-brand"><Icon name="terminal" /> Desktop</span>
      <Clock />
    </header>
  );
}
