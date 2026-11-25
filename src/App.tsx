import {
  useState,
  type PointerEvent,
  type ReactNode,
  type CSSProperties,
} from "react";
import {
  UsersRound,
  Heart,
  Info,
  TvMinimalPlay,
  MessagesSquare,
  Minus,
  Square,
  Copy,
  ArrowUpRight,
} from "lucide-react";
import Video from "./Video";
import "./desktop.css";

type Panel = "videos" | "about" | "socials" | "support" | "community";
type Glyph = Panel | "minus" | "expand" | "restore" | "arrow";
const icons = {
  videos: TvMinimalPlay,
  about: Info,
  socials: UsersRound,
  community: MessagesSquare,
  support: Heart,
  minus: Minus,
  expand: Square,
  restore: Copy,
  arrow: ArrowUpRight,
};
function Icon({ name }: { name: Glyph }) {
  const Symbol = icons[name];
  return <Symbol className="desk-icon" aria-hidden="true" strokeWidth={1.65} />;
}
const labels: Record<Panel, string> = {
  videos: "Videos",
  community: "Community",
  socials: "Socials",
  support: "Support",
  about: "About",
};
const panels: Panel[] = ["videos", "community", "socials", "support", "about"];
type Position = { x: number; y: number };
const origin = { x: 0, y: 0 };
function LinkRow({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className="desk-link" href={href} target="_blank" rel="noreferrer">
      {children}
      <Icon name="arrow" />
    </a>
  );
}
function PanelContent({ id }: { id: Panel }) {
  switch (id) {
    case "videos":
      return <Video />;
    case "about":
      return (
        <div className="desk-profile">
          <img src="/portrait.png" alt="cazz" />
          <div>
            <h1>
              hey, i’m cazz<span>.</span>
            </h1>
            <p>
              I make videos about C++, reverse engineering, and how games work.
            </p>
            <a
              className="desk-profile-link"
              href="https://www.youtube.com/@cazz"
              target="_blank"
              rel="noreferrer"
            >
              YouTube <Icon name="arrow" />
            </a>
          </div>
        </div>
      );
    case "socials":
      return (
        <div className="desk-list">
          <LinkRow href="https://www.youtube.com/@cazz">YouTube</LinkRow>
          <LinkRow href="https://github.com/cazzwastaken">GitHub</LinkRow>
          <LinkRow href="https://twitter.com/cazzwastaken">X / Twitter</LinkRow>
        </div>
      );
    case "community":
      return (
        <div className="desk-list">
          <LinkRow href="https://discord.gg/xyxbg5VpcG">
            Join the Discord
          </LinkRow>
        </div>
      );
    case "support":
      return (
        <div className="desk-list">
          <LinkRow href="https://www.patreon.com/cazzwastaken">
            Support cazz on Patreon
          </LinkRow>
        </div>
      );
  }
}
export default function App() {
  const [open, setOpen] = useState<Panel[]>(["about", "videos"]);
  const [max, setMax] = useState<Panel | null>(null);
  const [offsets, setOffsets] = useState<Partial<Record<Panel, Position>>>({});
  function focus(id: Panel) {
    setOpen((list) => [...list.filter((item) => item !== id), id]);
  }
  function hide(id: Panel) {
    setOpen((list) => list.filter((item) => item !== id));
    setMax((current) => (current === id ? null : current));
  }
  function toggle(id: Panel) {
    if (open.includes(id)) hide(id);
    else focus(id);
  }
  function drag(event: PointerEvent<HTMLDivElement>, id: Panel) {
    if (
      max === id ||
      event.button !== 0 ||
      (event.target as HTMLElement).closest("button") ||
      window.innerWidth < 761
    )
      return;
    const header = event.currentTarget,
      win = header.parentElement!,
      bounds = win.getBoundingClientRect();
    const start = { x: event.clientX, y: event.clientY },
      base = offsets[id] ?? origin;
    header.setPointerCapture(event.pointerId);
    const move = (ev: globalThis.PointerEvent) => {
      const dx = Math.min(
        window.innerWidth - bounds.left - 90,
        Math.max(90 - bounds.right, ev.clientX - start.x),
      );
      const dy = Math.min(
        window.innerHeight - bounds.top - 95,
        Math.max(50 - bounds.top, ev.clientY - start.y),
      );
      setOffsets((old) => ({
        ...old,
        [id]: { x: base.x + dx, y: base.y + dy },
      }));
    };
    function end() {
      header.removeEventListener("pointermove", move);
      header.removeEventListener("lostpointercapture", end);
    }
    header.addEventListener("pointermove", move);
    header.addEventListener("lostpointercapture", end);
  }
  return (
    <div className="desktop">
      <header className="desk-menubar">
        <span className="desk-brand">
          <b>&gt;</b>cazz
          <i />
        </span>
        <span className="desk-domain">cazz.tech</span>
      </header>
      <main className="desk-workspace" aria-label="Desktop windows">
        {panels
          .filter((id) => open.includes(id))
          .map((id) => {
            const off = offsets[id] ?? origin;
            return (
              <section
                key={id}
                aria-label={labels[id]}
                onPointerDown={() => focus(id)}
                onFocusCapture={() => focus(id)}
                className={
                  "desk-window desk-" + id + (max === id ? " is-max" : "")
                }
                style={
                  {
                    "--dx": off.x + "px",
                    "--dy": off.y + "px",
                    zIndex: 1 + open.indexOf(id),
                  } as CSSProperties
                }
              >
                <div
                  className="desk-titlebar"
                  onPointerDown={(ev) => drag(ev, id)}
                  onDoubleClick={(ev) => {
                    if (!(ev.target as HTMLElement).closest("button"))
                      setMax(max === id ? null : id);
                  }}
                >
                  <div className="desk-lights">
                    <button
                      title={"Close " + labels[id]}
                      aria-label={"Close " + labels[id]}
                      onClick={() => hide(id)}
                    />
                    <i />
                    <i />
                  </div>
                  <span className="desk-title">
                    <Icon name={id} />
                    {id === "videos" ? "Latest upload" : labels[id]}
                  </span>
                  <div className="desk-controls">
                    <button
                      title="Minimize"
                      aria-label={"Minimize " + labels[id]}
                      onClick={() => hide(id)}
                    >
                      <Icon name="minus" />
                    </button>
                    <button
                      title={max === id ? "Restore" : "Maximize"}
                      aria-label={
                        (max === id ? "Restore " : "Maximize ") + labels[id]
                      }
                      onClick={() => setMax(max === id ? null : id)}
                    >
                      <Icon name={max === id ? "restore" : "expand"} />
                    </button>
                  </div>
                </div>
                <div className="desk-body">
                  <PanelContent id={id} />
                </div>
              </section>
            );
          })}
      </main>
      <nav className="desk-dock" aria-label="Desktop apps">
        {panels.map((id) => (
          <button
            className={open.includes(id) ? "is-open" : ""}
            aria-pressed={open.includes(id)}
            key={id}
            onClick={() => toggle(id)}
          >
            <Icon name={id} />
            <span>{labels[id]}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
