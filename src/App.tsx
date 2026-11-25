import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import {
  Link2,
  Github,
  Youtube,
  ExternalLink,
  Terminal,
  RotateCcw,
  Pause,
  Play,
  X,
  Heart,
  Info,
  TvMinimalPlay,
  MessagesSquare,
  Minus,
  Square,
  Copy,
} from "lucide-react";
import Video from "./Video";
import "./desktop.css";

type Panel = "videos" | "about" | "socials" | "support" | "community";
type Glyph = keyof typeof icons;
const icons = {
  videos: TvMinimalPlay,
  about: Info,
  socials: Link2,
  community: MessagesSquare,
  support: Heart,
  minus: Minus,
  expand: Square,
  restore: Copy,
  external: ExternalLink,
  github: Github,
  youtube: Youtube,
  close: X,
  terminal: Terminal,
  reset: RotateCcw,
  pause: Pause,
  play: Play,
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
type Size = { width: number; height: number };
type Bounds = Size & { x: number; y: number };
const desktopQuery = "(min-width: 761px)";
const padding = 12;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function fit(bounds: Bounds, area: Size): Bounds {
  const availableWidth = Math.max(1, area.width - 2 * padding);
  const availableHeight = Math.max(1, area.height - 2 * padding);
  const width = clamp(bounds.width, Math.min(300, availableWidth), availableWidth);
  const height = clamp(bounds.height, Math.min(150, availableHeight), availableHeight);
  return {
    width,
    height,
    x: clamp(bounds.x, padding, Math.max(padding, area.width - width - padding)),
    y: clamp(bounds.y, padding, Math.max(padding, area.height - height - padding)),
  };
}

function defaultBounds(id: Panel, area: Size): Bounds {
  const { width, height } = area;
  const videoWidth = clamp(width * 0.44, 380, 720);
  const gutter = clamp(width * 0.045, 24, 80);
  const videoX = width - videoWidth - gutter;
  if (id === "videos") {
    return { x: videoX, y: height * 0.1, width: videoWidth, height: videoWidth * 9 / 16 + 130 };
  }
  if (id === "about") {
    const profileWidth = clamp(width * 0.28, 300, 400);
    return { x: Math.max(padding, videoX - profileWidth - 24), y: height * 0.57, width: profileWidth, height: 232 };
  }

  const step = panels.indexOf(id) - 1;
  return { x: width * 0.17 + step * 27, y: height * 0.24 + step * 28, width: 350, height: id === "socials" ? 240 : 156 };
}
function LinkRow({ href, icon, children }: { href: string; icon: Glyph; children: ReactNode }) {
  return (
    <a className="desk-link" href={href} target="_blank" rel="noreferrer">
      <span><Icon name={icon} />{children}</span>
      <Icon name="external" />
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
          <img src="/portrait.png" alt="" />
          <div>
            <h1>
              Hey, I’m Cazz<span>.</span>
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
              YouTube <Icon name="external" />
            </a>
          </div>
        </div>
      );
    case "socials":
      return (
        <div className="desk-list">
          <LinkRow icon="youtube" href="https://www.youtube.com/@cazz">YouTube</LinkRow>
          <LinkRow icon="github" href="https://github.com/cazzwastaken">GitHub</LinkRow>
          <LinkRow icon="socials" href="https://twitter.com/cazzwastaken">X / Twitter</LinkRow>
        </div>
      );
    case "community":
      return (
        <div className="desk-list">
          <LinkRow icon="community" href="https://discord.gg/xyxbg5VpcG">
            Join the Discord
          </LinkRow>
        </div>
      );
    case "support":
      return (
        <div className="desk-list">
          <LinkRow icon="support" href="https://www.patreon.com/cazzwastaken">
            Support on Patreon
          </LinkRow>
        </div>
      );
  }
}
export default function App() {
  const [stack, setStack] = useState<Panel[]>(["about", "videos"]);
  const [minimized, setMinimized] = useState<Panel[]>([]);
  const [maximized, setMaximized] = useState<Panel[]>([]);
  const [customBounds, setCustomBounds] = useState<Partial<Record<Panel, Bounds>>>({});
  const [isDesktop, setIsDesktop] = useState(() => matchMedia(desktopQuery).matches);
  const [area, setArea] = useState<Size>({ width: 0, height: 0 });
  const [motionPaused, setMotionPaused] = useState(false);
  const workspace = useRef<HTMLElement>(null);
  const windows = useRef<Partial<Record<Panel, HTMLElement>>>({});
  const launchers = useRef<Partial<Record<Panel, HTMLButtonElement>>>({});
  const pendingFocus = useRef<Panel | null>(null);
  const active = stack.filter((id) => !minimized.includes(id)).at(-1);
  const hasVisibleMax = maximized.some((id) => !minimized.includes(id));

  useLayoutEffect(() => {
    const element = workspace.current!;
    const desktop = matchMedia(desktopQuery);
    function measure() {
      setArea({ width: element.clientWidth, height: element.clientHeight });
      setIsDesktop(desktop.matches);
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    desktop.addEventListener("change", measure);
    return () => {
      observer.disconnect();
      desktop.removeEventListener("change", measure);
    };
  }, []);

  useLayoutEffect(() => {
    const id = pendingFocus.current;
    if (!id) return;
    pendingFocus.current = null;
    const panel = windows.current[id];
    panel?.focus({ preventScroll: true });
    if (!matchMedia(desktopQuery).matches) panel?.scrollIntoView({ block: "start" });
  }, [stack, minimized]);

  function raise(id: Panel) {
    setStack((list) => list.at(-1) === id ? list : [...list.filter((item) => item !== id), id]);
  }

  function show(id: Panel) {
    pendingFocus.current = id;
    setMinimized((list) => list.filter((item) => item !== id));
    raise(id);
  }

  function dismiss(id: Panel, close: boolean) {
    if (close) {
      setStack((list) => list.filter((item) => item !== id));
      setMinimized((list) => list.filter((item) => item !== id));
      setMaximized((list) => list.filter((item) => item !== id));
      setCustomBounds((old) => ({ ...old, [id]: undefined }));
    } else {
      setMinimized((list) => [...list, id]);
    }
    launchers.current[id]?.focus({ preventScroll: true });
  }

  function toggleMaximize(id: Panel) {
    raise(id);
    setMaximized((list) => list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);
  }

  function resetLayout() {
    setCustomBounds({});
    setMaximized([]);
    setMinimized([]);
    setStack(["about", "videos"]);
  }

  function updateBounds(id: Panel, start: Bounds, dx: number, dy: number, resize: boolean) {
    const next = resize
      ? {
          ...start,
          width: Math.min(start.width + dx, area.width - start.x - padding),
          height: Math.min(start.height + dy, area.height - start.y - padding),
        }
      : { ...start, x: start.x + dx, y: start.y + dy };
    setCustomBounds((old) => ({ ...old, [id]: fit(next, area) }));
  }

  function startGesture(event: PointerEvent<HTMLElement>, id: Panel, bounds: Bounds, resize: boolean) {
    if (
      !event.isPrimary || event.button !== 0 || maximized.includes(id) ||
      !isDesktop ||
      (!resize && (event.target as Element).closest("button"))
    ) return;

    const handle = event.currentTarget;
    const { clientX, clientY, pointerId } = event;
    handle.setPointerCapture(pointerId);

    function move(ev: globalThis.PointerEvent) {
      if (ev.pointerId !== pointerId) return;
      const dx = ev.clientX - clientX;
      const dy = ev.clientY - clientY;
      updateBounds(id, bounds, dx, dy, resize);
    }
    function end(ev: globalThis.PointerEvent) {
      if (ev.pointerId !== pointerId) return;
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("lostpointercapture", end);
    }
    handle.addEventListener("pointermove", move);
    handle.addEventListener("lostpointercapture", end);
  }

  function adjustFromKeyboard(event: KeyboardEvent<HTMLElement>, id: Panel, bounds: Bounds, resize: boolean) {
    const step = event.shiftKey ? 48 : 16;
    const dx = Number(event.key === "ArrowRight") - Number(event.key === "ArrowLeft");
    const dy = Number(event.key === "ArrowDown") - Number(event.key === "ArrowUp");
    if (!dx && !dy) return;
    event.preventDefault();
    updateBounds(id, bounds, dx * step, dy * step, resize);
  }

  return (
    <div className={"desktop" + (motionPaused ? " motion-paused" : "")}>
      <header className="desk-menubar">
        <span className="desk-brand"><Icon name="terminal" /> Desktop</span>
        <div className="desk-tools">
          <button
            type="button"
            className="desk-motion"
            aria-label="Pause wallpaper animation"
            aria-pressed={motionPaused}
            title={motionPaused ? "Resume wallpaper animation" : "Pause wallpaper animation"}
            onClick={() => setMotionPaused((paused) => !paused)}
          >
            <Icon name={motionPaused ? "play" : "pause"} />
          </button>
          <button type="button" aria-label="Reset layout" title="Reset layout" onClick={resetLayout}>
            <Icon name="reset" />
          </button>
        </div>
      </header>
      <main className="desk-workspace" ref={workspace} aria-label="Desktop windows">
        <nav className="desk-shortcuts" aria-label="Desktop shortcuts" hidden={hasVisibleMax}>
          {panels.map((id) => (
            <button type="button" key={id} onClick={() => show(id)} data-app={id}>
              <span className="desk-tile"><Icon name={id} /></span>
              <span>{labels[id]}</span>
            </button>
          ))}
        </nav>
        {panels.filter((id) => stack.includes(id)).map((id) => {
          const bounds = fit(customBounds[id] ?? defaultBounds(id, area), area);
          const isMax = maximized.includes(id);
          const canMove = isDesktop && !isMax;
          return (
            <section
              key={id}
              id={`window-${id}`}
              ref={(element) => { windows.current[id] = element ?? undefined; }}
              aria-label={labels[id]}
              tabIndex={-1}
              hidden={minimized.includes(id)}
              onPointerDown={() => raise(id)}
              onFocusCapture={() => raise(id)}
              className={`desk-window desk-${id}${isMax ? " is-max" : ""}${active === id ? " is-active" : ""}`}
              style={{
                "--window-x": bounds.x + "px",
                "--window-y": bounds.y + "px",
                "--window-width": bounds.width + "px",
                "--window-height": bounds.height + "px",
                zIndex: 1 + stack.indexOf(id),
              } as CSSProperties}
            >
              <div
                className="desk-titlebar"
                onPointerDown={(event) => startGesture(event, id, bounds, false)}
                onDoubleClick={(event) => {
                  if (isDesktop && !(event.target as Element).closest("button")) {
                    toggleMaximize(id);
                  }
                }}
              >
                <span
                  className="desk-title"
                  data-app={id}
                  role={canMove ? "group" : undefined}
                  aria-label={canMove ? `Move ${labels[id]} with arrow keys` : undefined}
                  title={canMove ? "Drag to move or use arrow keys" : undefined}
                  tabIndex={canMove ? 0 : undefined}
                  onKeyDown={canMove ? (event) => adjustFromKeyboard(event, id, bounds, false) : undefined}
                >
                  <Icon name={id} />
                  {id === "videos" ? "Latest upload" : labels[id]}
                </span>
                <div className="desk-controls">
                  <button type="button" title="Minimize" aria-label={`Minimize ${labels[id]}`} onClick={() => dismiss(id, false)}>
                    <Icon name="minus" />
                  </button>
                  <button
                    type="button"
                    className="desk-maximize"
                    title={isMax ? "Restore" : "Maximize"}
                    aria-label={`${isMax ? "Restore" : "Maximize"} ${labels[id]}`}
                    onClick={() => toggleMaximize(id)}
                  >
                    <Icon name={isMax ? "restore" : "expand"} />
                  </button>
                  <button type="button" className="desk-close" title="Close" aria-label={`Close ${labels[id]}`} onClick={() => dismiss(id, true)}>
                    <Icon name="close" />
                  </button>
                </div>
              </div>
              <div className="desk-body">
                <PanelContent id={id} />
              </div>
              {!isMax && (
                <button
                  type="button"
                  className="desk-resize"
                  aria-label={`Resize ${labels[id]} with arrow keys`}
                  title="Drag to resize or use arrow keys"
                  onPointerDown={(event) => startGesture(event, id, bounds, true)}
                  onKeyDown={(event) => adjustFromKeyboard(event, id, bounds, true)}
                />
              )}
            </section>
          );
        })}
      </main>
      <nav className="desk-dock" aria-label="Desktop apps">
        {panels.map((id) => {
          const isOpen = stack.includes(id);
          const visible = isOpen && !minimized.includes(id);
          return (
            <button
              type="button"
              data-app={id}
              className={active === id ? "is-active" : ""}
              aria-expanded={visible}
              aria-controls={isOpen ? `window-${id}` : undefined}
              key={id}
              ref={(element) => { launchers.current[id] = element ?? undefined; }}
              onClick={() => {
                if (active === id && isDesktop) dismiss(id, false);
                else show(id);
              }}
            >
              <span className="desk-tile"><Icon name={id} /></span>
              <span>{labels[id]}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
