/**
 * PURE terminal logic: parse a command line and describe what should happen.
 * No DOM, no React, no globals: everything environmental arrives in `ctx`.
 * The React layer (src/panels/Terminal.tsx) renders `blocks` and performs `effects`.
 * See docs/terminal.md for how to add a command.
 */
import { PANEL_IDS, PANELS, type PanelId } from "../panels";
import {
  ABOUT_TXT,
  APP_LINKS,
  BANNER,
  BLURB,
  FEATURED_VIDEO,
  FETCH_FIELDS,
  HINT,
  HOME,
  HOME_ENTRIES,
  HOST,
  LINK_ALIASES,
  LINKS,
  LOGO,
  LOGO_TONES,
  SHELL,
  USER,
  formatUptime,
  type LinkInfo,
  type SystemInfo,
} from "./content";
import type { Block, Result, Span, Step, TextLine, Tone } from "./types";

export type Context = { sys: SystemInfo; history: string[] };

/* ---------- building blocks ---------- */

export const line = (...spans: (Span | string)[]): TextLine => ({
  type: "line",
  spans: spans.map((s) => (typeof s === "string" ? { text: s } : s)),
});
const t = (text: string, tone?: Tone): Span => (tone ? { text, tone } : { text });
const err = (text: string) => line(t(text, "err"));

export const promptSpans = (): Span[] => [
  t(USER, "pink"),
  t("@", "muted"),
  t(HOST, "violet"),
  t(" ~ ", "mint"),
  t("$ ", "accent"),
];
export const promptLine = (input: string): TextLine => ({ type: "line", spans: [...promptSpans(), t(input)] });

const linkSpan = (link: LinkInfo): Span => ({ text: link.url, href: link.url });
const linkLine = (link: LinkInfo, width = 9): TextLine =>
  line(t(link.label.padEnd(width), "accent"), t(link.handle.padEnd(24), "muted"), linkSpan(link));

const ok = (...blocks: Block[]): Result => ({ blocks, effects: [] });

/* ---------- formatting ---------- */

/** `Wed Nov 25 14:03:12 2026`, like coreutils `date` without the zone. */
export function unixDate(now: Date, timeZone: string): string {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "short", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit", year: "numeric", hourCycle: "h23",
    }).formatToParts(now);
  } catch {
    return now.toUTCString();
  }
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("weekday")} ${get("month")} ${get("day").padStart(2, " ")} ${get("hour")}:${get("minute")}:${get("second")} ${get("year")}`;
}

export function fetchBlock(sys: SystemInfo): Block {
  const title = `${USER}@${HOST}`;
  const info: Span[][] = [
    [t(USER, "pink"), t("@", "muted"), t(HOST, "violet")],
    [{ text: "-".repeat(title.length), tone: "muted", decorative: true }],
  ];
  for (const field of FETCH_FIELDS) {
    const value = field.value(sys);
    if (value === null || value === "") continue;
    info.push([t(field.label, "accent"), t(": ", "muted"), ...(typeof value === "string" ? [t(value)] : value)]);
  }
  const swatches = (["c0", "c1", "c2", "c3", "c4", "c5", "c6", "c7"] as Tone[]).map((tone) => t("███", tone));
  info.push(swatches.map((span) => ({ ...span, decorative: true })));
  return {
    type: "fetch",
    logo: LOGO.map((row, i) => [t(row, LOGO_TONES[i] ?? "violet")]),
    info,
  };
}

export const blurbLines = (): Block[] => [line(t("Cazz", "pink"), t(" — " + BLURB))];

/* ---------- apps and links ---------- */

export type AppInfo = { id: PanelId; label: string };
export const apps = (): AppInfo[] => PANEL_IDS.map((id) => ({ id, label: PANELS[id].label }));

export function findApp(name: string): AppInfo | undefined {
  const key = name.toLowerCase();
  return apps().find((app) => app.id === key || app.label.toLowerCase() === key);
}

export function findLink(name: string): LinkInfo | undefined {
  const key = name.toLowerCase();
  const id = LINK_ALIASES[key] ?? key;
  return LINKS.find((link) => link.id === id);
}

function openApp(app: AppInfo): Result {
  const message = app.id === "terminal" ? "you're already here, but sure: raising terminal..." : `opening ${app.id}...`;
  const links = (APP_LINKS[app.id] ?? []).flatMap((id) => {
    const link = findLink(id);
    return link ? [linkLine(link)] : [];
  });
  return { blocks: [line(t(message, "mint")), ...links], effects: [{ type: "open", id: app.id }] };
}

/* ---------- emerge (fake Gentoo compile) ---------- */

const delays = (blocks: Block[], ms: number[]): Step[] =>
  blocks.map((block, i) => ({ kind: "print", block, delay: ms[i % ms.length] }));

export function emergeSteps(args: string[]): Step[] {
  const star = (text: string, tone: Tone = "mint") => line(t(" * ", tone), t(text));
  const arrow = (text: string) => line(t(">>> ", "mint"), t(text));
  if (args.includes("--sync")) {
    return delays(
      [
        arrow("Syncing repository 'gentoo' into '/var/db/repos/gentoo'..."),
        line(t("receiving incremental file list", "muted")),
        line(t("sent 13,370 bytes  received 4,206,942 bytes  1.69M bytes/sec", "muted")),
        arrow("Syncing repository 'cazzland' into '/var/db/repos/cazzland'..."),
        line(t("=== Sync completed for gentoo", "mint")),
        line(t("=== Sync completed for cazzland", "mint")),
        star("IMPORTANT: 1 news item needs reading for repository 'cazzland'.", "gold"),
        star("Use `cat about.txt` to read it.", "gold"),
      ],
      [180, 260, 300, 220, 200, 120, 160, 80],
    );
  }
  const pkg = (args.find((a) => !a.startsWith("-")) ?? "").replace(/[^\w.+-]/g, "").slice(0, 32) || "cazzland";
  const atom = `app-misc/${pkg}-9999::cazzland`;
  return delays(
    [
      line(t("Calculating dependencies... "), t("done!", "mint")),
      arrow("Verifying ebuild manifests"),
      arrow(`Emerging (1 of 1) ${atom}`),
      arrow(`Compiling source in /var/tmp/portage/app-misc/${pkg}-9999/work ...`),
      line(t("[ 14%] ", "sky"), t(`Building CXX object src/${pkg}.cpp.o`)),
      line(t("[ 52%] ", "sky"), t("Building CXX object src/reverse_engineer.cpp.o")),
      line(t("[ 87%] ", "sky"), t("Building CXX object src/how_games_work.cpp.o")),
      line(t("[100%] ", "sky"), t(`Linking CXX executable ${pkg}`)),
      arrow(`Completed installing ${atom} into /`),
      star("GNU info directory index is up-to-date."),
    ],
    [180, 160, 200, 260, 240, 260, 280, 220, 200, 120],
  );
}

/* ---------- cowsay ---------- */

export function cowsay(message: string): Block[] {
  const words = (message.trim() || "moo").split(/\s+/);
  const rows: string[] = [];
  let current = "";
  for (const word of words) {
    const chunk = word.slice(0, 36);
    if (current && current.length + 1 + chunk.length > 36) {
      rows.push(current);
      current = chunk;
    } else current = current ? `${current} ${chunk}` : chunk;
  }
  rows.push(current);
  const width = Math.max(...rows.map((r) => r.length));
  const bubble =
    rows.length === 1
      ? [`< ${rows[0]} >`]
      : rows.map((r, i) => {
          const [l, rr] = i === 0 ? ["/", "\\"] : i === rows.length - 1 ? ["\\", "/"] : ["|", "|"];
          return `${l} ${r.padEnd(width)} ${rr}`;
        });
  const cow = ["        \\   ^__^", "         \\  (oo)\\_______", "            (__)\\       )\\/\\", "                ||----w |", "                ||     ||"];
  return [
    line(" " + "_".repeat(width + 2)),
    ...bubble.map((b) => line(b)),
    line(" " + "-".repeat(width + 2)),
    ...cow.map((c) => line(t(c, "pink"))),
  ];
}

/* ---------- commands ---------- */

type Command = {
  /** One-line description for `help`. Hidden commands (easter eggs) have none. */
  help?: string;
  /** Usage shown in help instead of the bare name. */
  usage?: string;
  run: (args: string[], ctx: Context, rest: string) => Result;
};

const fileOrDir = (name: string) => name.replace(/^~\//, "").replace(/^\.\//, "");

function listDir(target: string): Result {
  const name = fileOrDir(target).replace(/\/$/, "");
  if (!name || name === "~" || name === "." || name === HOME) {
    return ok(line(...HOME_ENTRIES.flatMap((entry) => [t(entry, entry.endsWith("/") ? "violet" : undefined), t("  ")])));
  }
  if (name === "apps") return ok(line(...apps().flatMap((app) => [t(app.id + "*", "mint"), t("  ")])));
  if (name === "links") return ok(line(...LINKS.flatMap((link) => [t(link.id, "sky"), t("  ")])));
  if (name === "videos") {
    return ok(line(t("latest -> ", "muted"), { text: FEATURED_VIDEO.title, href: FEATURED_VIDEO.url }), line(t("(type `videos` to open the player)", "muted")));
  }
  if (name === "about.txt") return ok(line(t("about.txt")));
  return ok(err(`ls: cannot access '${target}': No such file or directory`));
}

const ROOTISH = new Set(["/", "/*", "~", "~/", "*", "--no-preserve-root"]);

export const COMMANDS: Record<string, Command> = {
  help: {
    help: "list commands",
    run: () => {
      const visible = Object.entries(COMMANDS).filter(([, c]) => c.help);
      const width = Math.max(...visible.map(([name, c]) => (c.usage ?? name).length)) + 2;
      return ok(
        line(t("cazzsh", "pink"), t(" — available commands", "muted")),
        ...visible.map(([name, c]) => line(t((c.usage ?? name).padEnd(width), "accent"), t(c.help!, "muted"))),
        line(t("<app>".padEnd(width), "accent"), t(`open an app directly: ${apps().map((a) => a.id).join(", ")}`, "muted")),
        line(t("Tab completes, ↑/↓ walks history, Ctrl+C cancels, Ctrl+L clears. There may be a few secrets.", "muted")),
      );
    },
  },
  fastfetch: { help: "system info (alias: neofetch)", run: (_a, ctx) => ok(fetchBlock(ctx.sys)) },
  neofetch: { run: (_a, ctx) => ok(fetchBlock(ctx.sys)) },
  cat: {
    usage: "cat about.txt",
    help: "who is cazz?",
    run: (args) => {
      if (!args.length) return ok(err("cat: missing file operand (try `cat about.txt`)"));
      const blocks: Block[] = [];
      for (const arg of args) {
        const name = fileOrDir(arg);
        if (name === "about.txt") blocks.push(...ABOUT_TXT.map((row) => line(row)));
        else if (HOME_ENTRIES.includes(name.replace(/\/?$/, "/"))) blocks.push(err(`cat: ${arg}: Is a directory`));
        else blocks.push(err(`cat: ${arg}: No such file or directory`));
      }
      return ok(...blocks);
    },
  },
  ls: { usage: "ls [dir]", help: "list files", run: (args) => listDir(args.find((a) => !a.startsWith("-")) ?? "") },
  apps: {
    help: "list apps you can open",
    run: () => ok(...apps().map((app) => line(t(app.id.padEnd(11), "mint"), t(app.label, "muted")))),
  },
  open: {
    usage: "open <app|link>",
    help: "open a window or a link",
    run: (args) => {
      const name = args[0];
      if (!name) {
        return ok(
          err("usage: open <app|link>"),
          line(t("apps:  ", "muted"), t(apps().map((a) => a.id).join("  "), "mint")),
          line(t("links: ", "muted"), t(LINKS.map((l) => l.id).join("  "), "sky")),
        );
      }
      const app = findApp(name);
      if (app) return openApp(app);
      const link = findLink(name);
      if (link) {
        return {
          blocks: [line(t(`opening ${link.label}: `, "mint"), linkSpan(link))],
          effects: [{ type: "openUrl", url: link.url }],
        };
      }
      return ok(err(`open: no such app or link: ${name.slice(0, 40)}`), line(t("try `apps` or `links`", "muted")));
    },
  },
  links: { help: "all the links", run: () => ok(...LINKS.map((l) => linkLine(l))) },
  whoami: { help: "print user name", run: () => ok(line(USER)) },
  id: {
    run: () => ok(line(`uid=1000(${USER}) gid=1000(${USER}) groups=1000(${USER}),18(audio),27(video),250(portage)`)),
  },
  hostname: { run: () => ok(line(HOST)) },
  uname: {
    usage: "uname -a",
    help: "kernel info",
    run: (args) =>
      ok(line(args.some((a) => a.startsWith("-") && a.includes("a"))
        ? `Linux ${HOST} 6.6.6-gentoo-${HOST} #1 SMP PREEMPT_DYNAMIC cazzland GNU/Linux`
        : "Linux")),
  },
  pwd: { run: () => ok(line(HOME)) },
  cd: {
    run: (args) => {
      const target = args[0];
      if (!target || target === "~" || target === HOME) return ok();
      if (HOME_ENTRIES.includes(fileOrDir(target).replace(/\/?$/, "/"))) {
        return ok(line(t(`cd: everything lives in ~ here. try \`ls ${fileOrDir(target).replace(/\/$/, "")}\``, "muted")));
      }
      return ok(err(`cd: no such file or directory: ${target.slice(0, 40)}`));
    },
  },
  date: {
    help: "current date and time",
    run: (_a, ctx) => ok(line(`${unixDate(ctx.sys.now, ctx.sys.timeZone)} (${ctx.sys.timeZone})`)),
  },
  uptime: {
    help: "time since you opened cazzland",
    run: (_a, ctx) =>
      ok(line(`${unixDate(ctx.sys.now, ctx.sys.timeZone).slice(11, 19)} up ${formatUptime(ctx.sys.uptimeMs)},  1 user,  load average: chill`)),
  },
  echo: { usage: "echo <text>", help: "print text", run: (_a, _c, rest) => ok(line(rest.replace(/^(["'])(.*)\1$/, "$2"))) },
  history: {
    help: "command history",
    run: (_a, ctx) => ok(...ctx.history.map((entry, i) => line(t(String(i + 1).padStart(4) + "  ", "muted"), t(entry)))),
  },
  clear: { help: "clear the screen (Ctrl+L)", run: () => ({ blocks: [], effects: [{ type: "clear" }] }) },
  exit: { help: "close the terminal", run: () => ({ blocks: [line(t("logout", "muted"))], effects: [{ type: "close" }] }) },
  logout: { run: (a, c, r) => COMMANDS.exit.run(a, c, r) },

  /* easter eggs */
  sudo: {
    run: (args) =>
      args.length
        ? ok(line(t(`[sudo] password for ${USER}: `, "muted")), err(`${USER} is not in the sudoers file. This incident will be reported.`))
        : ok(err("usage: sudo <command>")),
  },
  rm: {
    run: (args) => {
      const recursive = args.some((a) => /^-[a-zA-Z]*[rR]/.test(a) || a === "--recursive");
      if (recursive && args.some((a) => ROOTISH.has(a))) {
        return ok(
          err("rm: it is dangerous to operate recursively on '/'"),
          line(t("rm: also, this took a whole weekend to emerge. nice try though.", "muted")),
        );
      }
      if (!args.length) return ok(err("rm: missing operand"));
      return ok(err(`rm: cannot remove '${args[args.length - 1].slice(0, 40)}': Read-only file system`));
    },
  },
  cowsay: { usage: "cowsay <text>", run: (_a, _c, rest) => ok(...cowsay(rest)) },
  emerge: {
    run: (args) => {
      if (!args.length) {
        return ok(err("emerge: no targets specified"), line(t("try `emerge --sync` or `emerge <package>`", "muted")));
      }
      return { blocks: [], effects: [{ type: "animate", steps: emergeSteps(args) }] };
    },
  },
  vim: { run: () => ok(line(t("vim: you'd never find the way out. try `cat about.txt` instead.", "muted"))) },
  nano: { run: () => ok(line(t("nano: ^X to exit. or just try `cat about.txt`.", "muted"))) },
  emacs: { run: () => ok(line(t("emacs: a fine operating system, but cazzland already has one.", "muted"))) },
};

/** Words that run something when typed alone: commands, apps and links. */
export function commandNames(): string[] {
  const names = new Set<string>([
    ...Object.entries(COMMANDS).filter(([, c]) => c.help).map(([name]) => name),
    ...apps().map((a) => a.id),
    ...LINKS.map((l) => l.id),
  ]);
  return [...names].sort();
}

/* ---------- entry point ---------- */

export function run(input: string, ctx: Context): Result {
  const raw = input.trim();
  if (!raw) return ok();
  const [first, ...args] = raw.split(/\s+/);
  const name = first.toLowerCase();
  const rest = raw.slice(first.length).trim();

  const command = Object.hasOwn(COMMANDS, name) ? COMMANDS[name] : undefined;
  if (command) return command.run(args, ctx, rest);

  const app = findApp(name);
  if (app) return openApp(app);

  const link = findLink(name);
  if (link) return ok(linkLine(link));

  return ok(err(`${SHELL}: command not found: ${first.slice(0, 40)}`));
}

/* ---------- tab completion ---------- */

export type Completion = { value: string; options: string[] };

function commonPrefix(words: string[]): string {
  if (!words.length) return "";
  let prefix = words[0];
  for (const word of words) while (!word.startsWith(prefix)) prefix = prefix.slice(0, -1);
  return prefix;
}

/** Complete the last word of `input`. `options` lists the candidates when ambiguous. */
export function complete(input: string): Completion {
  const parts = input.split(" ");
  const word = parts[parts.length - 1];
  const head = parts.slice(0, -1).filter(Boolean);
  let candidates: string[];
  if (head.length === 0) candidates = commandNames();
  else {
    const cmd = head[0].toLowerCase();
    if (cmd === "open") candidates = [...apps().map((a) => a.id), ...LINKS.map((l) => l.id)];
    else if (cmd === "cat") candidates = ["about.txt"];
    else if (cmd === "ls" || cmd === "cd") candidates = HOME_ENTRIES;
    else if (cmd === "emerge") candidates = ["--sync"];
    else candidates = [];
  }
  const matches = candidates.filter((c) => c.startsWith(word.toLowerCase()));
  if (!matches.length) return { value: input, options: [] };
  const base = parts.slice(0, -1).concat("").join(" ");
  if (matches.length === 1) {
    const done = matches[0];
    return { value: base + done + (done.endsWith("/") ? "" : " "), options: [] };
  }
  const prefix = commonPrefix(matches);
  return { value: base + (prefix.length > word.length ? prefix : word), options: matches };
}

/* ---------- history ---------- */

export const HISTORY_LIMIT = 100;

export function pushHistory(history: string[], entry: string): string[] {
  const value = entry.trim();
  if (!value || history[history.length - 1] === value) return history;
  return [...history, value].slice(-HISTORY_LIMIT);
}

/**
 * Walk history with ↑ (-1) / ↓ (+1). `index === null` means "editing a new line" (the draft).
 * Returns the new index and the value to show.
 */
export function stepHistory(history: string[], index: number | null, dir: -1 | 1, draft: string): { index: number | null; value: string } {
  if (!history.length) return { index: null, value: draft };
  if (dir === -1) {
    const next = index === null ? history.length - 1 : Math.max(0, index - 1);
    return { index: next, value: history[next] };
  }
  if (index === null) return { index: null, value: draft };
  const next = index + 1;
  if (next >= history.length) return { index: null, value: draft };
  return { index: next, value: history[next] };
}

/* ---------- boot ---------- */

/** The login + fastfetch sequence. Total time stays well under 2.5s. */
export function bootSteps(sys: SystemInfo): Step[] {
  return [
    { kind: "print", block: line(t(BANNER, "muted")), delay: 60 },
    { kind: "type", prefix: [t(`${HOST} login: `, "violet")], text: USER, delay: 240, charDelay: 70 },
    { kind: "print", block: line(t(`Last login: ${unixDate(sys.now, sys.timeZone)} on tty1`, "muted")), delay: 260 },
    { kind: "type", prefix: promptSpans(), text: "fastfetch", delay: 280, charDelay: 42 },
    { kind: "print", block: fetchBlock(sys), delay: 160 },
    // Long enough after the fetch for its CSS row reveal (~0.5s) to finish before boot ends.
    ...blurbLines().map((block): Step => ({ kind: "print", block, delay: 380 })),
    { kind: "print", block: line(...HINT), delay: 140 },
  ];
}

export const stepDuration = (step: Step) => step.delay + (step.kind === "type" ? step.text.length * step.charDelay : 0);

/** The block a step leaves behind once finished. */
export const stepBlock = (step: Step): Block =>
  step.kind === "print" ? step.block : { type: "line", spans: [...step.prefix, t(step.text)] };
