import { describe, expect, it } from "vitest";
import { PANEL_IDS } from "../panels";
import {
  COMMANDS,
  bootSteps,
  commandNames,
  complete,
  cowsay,
  emergeSteps,
  fetchBlock,
  pushHistory,
  run,
  stepDuration,
  stepHistory,
  unixDate,
  HISTORY_LIMIT,
  type Context,
} from "./commands";
import { LINKS, formatUptime, type SystemInfo } from "./content";
import { createSession, nextDelay, sessionReducer, MAX_ENTRIES, type Session } from "./session";
import type { Block, Result } from "./types";

const sys: SystemInfo = {
  now: new Date("2026-11-25T14:03:07Z"),
  uptimeMs: 192_000,
  viewport: { width: 1440, height: 900 },
  locale: "en-US",
  timeZone: "UTC",
  apps: PANEL_IDS.length,
};
const ctx: Context = { sys, history: ["help", "ls"] };

const textOf = (block: Block): string =>
  block.type === "line" ? block.spans.map((s) => s.text).join("") : [...block.logo, ...block.info].map((r) => r.map((s) => s.text).join("")).join("\n");
const out = (result: Result) => result.blocks.map(textOf).join("\n");
const exec = (input: string, c: Context = ctx) => run(input, c);
const hrefs = (result: Result) =>
  result.blocks.flatMap((b) => (b.type === "line" ? b.spans : b.info.flat())).flatMap((s) => (s.href ? [s.href] : []));

describe("run", () => {
  it("does nothing for an empty line", () => {
    expect(exec("   ")).toEqual({ blocks: [], effects: [] });
  });

  it("help lists visible commands and apps", () => {
    const text = out(exec("help"));
    for (const name of ["fastfetch", "ls", "open <app|link>", "links", "clear", "exit"]) expect(text).toContain(name);
    for (const id of PANEL_IDS) expect(text).toContain(id);
    expect(text).not.toContain("sudo");
  });

  it("fastfetch and neofetch print the fetch block with live values", () => {
    const result = exec("fastfetch");
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0].type).toBe("fetch");
    const text = out(result);
    expect(text).toContain("cazz@cazzland");
    expect(text).toContain("Gentoo Linux (cazzland)");
    expect(text).toContain("1440x900");
    expect(text).toContain(`Packages: ${PANEL_IDS.length} (apps)`);
    expect(text).toContain("Uptime: 3m 12s");
    expect(out(exec("NEOFETCH"))).toBe(text);
  });

  it("omits Hardware unless the browser exposes it", () => {
    expect(textOf(fetchBlock(sys))).not.toContain("Hardware");
    expect(textOf(fetchBlock({ ...sys, cores: 8 }))).toContain("Hardware: 8 threads (yours)");
    expect(textOf(fetchBlock({ ...sys, cores: 8, memoryGiB: 4 }))).toContain("Hardware: 8 threads, ~4 GiB (yours)");
  });

  it("marks the separator and colour swatches as decorative", () => {
    const block = fetchBlock(sys);
    if (block.type !== "fetch") throw new Error("expected fetch");
    expect(block.info[1].every((s) => s.decorative)).toBe(true);
    const swatches = block.info[block.info.length - 1];
    expect(swatches).toHaveLength(8);
    expect(swatches.every((s) => s.decorative)).toBe(true);
    expect(block.info.slice(2, -1).flat().some((s) => s.decorative)).toBe(false);
  });

  it("identity commands", () => {
    expect(out(exec("whoami"))).toBe("cazz");
    expect(out(exec("id"))).toMatch(/^uid=1000\(cazz\) gid=1000\(cazz\)/);
    expect(out(exec("hostname"))).toBe("cazzland");
    expect(out(exec("uname"))).toBe("Linux");
    expect(out(exec("uname -a"))).toMatch(/^Linux cazzland .*GNU\/Linux$/);
    expect(out(exec("pwd"))).toBe("/home/cazz");
  });

  it("ls lists home and subfolders", () => {
    expect(out(exec("ls"))).toMatch(/about\.txt.*apps\/.*links\/.*videos\//);
    expect(out(exec("ls -la ~"))).toContain("about.txt");
    const appsText = out(exec("ls apps/"));
    for (const id of PANEL_IDS) expect(appsText).toContain(`${id}*`);
    expect(out(exec("ls links"))).toContain("discord");
    expect(hrefs(exec("ls videos"))).toHaveLength(1);
    expect(out(exec("ls nope"))).toContain("No such file or directory");
  });

  it("cat about.txt and errors", () => {
    expect(out(exec("cat about.txt"))).toContain("I make videos about C++, reverse engineering, and how games work.");
    expect(out(exec("cat ~/about.txt"))).toContain("Cazz");
    expect(out(exec("cat links"))).toBe("cat: links: Is a directory");
    expect(out(exec("cat secrets"))).toBe("cat: secrets: No such file or directory");
    expect(out(exec("cat"))).toContain("missing file operand");
  });

  it("cd stays home", () => {
    expect(exec("cd").blocks).toEqual([]);
    expect(exec("cd ~").blocks).toEqual([]);
    expect(out(exec("cd links"))).toContain("ls links");
    expect(out(exec("cd /etc"))).toContain("no such file or directory");
  });

  it("date and uptime use the context clock", () => {
    expect(out(exec("date"))).toBe("Wed Nov 25 14:03:07 2026 (UTC)");
    expect(out(exec("uptime"))).toMatch(/^14:03:07 up 3m 12s, +1 user/);
    expect(unixDate(sys.now, "Not/AZone")).toBe(sys.now.toUTCString());
  });

  it("echo prints its argument, stripping one pair of quotes", () => {
    expect(out(exec("echo hello   world"))).toBe("hello   world");
    expect(out(exec('echo "quoted"'))).toBe("quoted");
    expect(out(exec("echo"))).toBe("");
  });

  it("history numbers the entries from ctx", () => {
    expect(out(exec("history"))).toBe("   1  help\n   2  ls");
  });

  it("clear and exit only emit effects", () => {
    expect(exec("clear")).toEqual({ blocks: [], effects: [{ type: "clear" }] });
    expect(exec("exit").effects).toEqual([{ type: "close" }]);
    expect(exec("logout").effects).toEqual([{ type: "close" }]);
  });

  it("apps lists every panel", () => {
    const text = out(exec("apps"));
    for (const id of PANEL_IDS) expect(text).toContain(id);
  });

  it("bare app names and `open <app>` open windows", () => {
    for (const id of PANEL_IDS) {
      expect(exec(id).effects).toEqual([{ type: "open", id }]);
      expect(exec(`open ${id}`).effects).toEqual([{ type: "open", id }]);
    }
    expect(out(exec("open videos"))).toBe("opening videos...");
    expect(hrefs(exec("socials"))).toEqual(["https://www.youtube.com/@cazz", "https://github.com/cazzwastaken", "https://twitter.com/cazzwastaken"]);
    expect(hrefs(exec("open community"))).toEqual(["https://discord.gg/xyxbg5VpcG"]);
    expect(hrefs(exec("support"))).toEqual(["https://www.patreon.com/cazzwastaken"]);
    expect(exec("Videos").effects).toEqual([{ type: "open", id: "videos" }]);
  });

  it("open <link> opens a tab; bare link names print an anchor", () => {
    for (const link of LINKS) {
      const opened = exec(`open ${link.id}`);
      expect(opened.effects).toEqual([{ type: "openUrl", url: link.url }]);
      expect(hrefs(opened)).toEqual([link.url]);
      const bare = exec(link.id);
      expect(bare.effects).toEqual([]);
      expect(hrefs(bare)).toEqual([link.url]);
    }
    expect(exec("open twitter").effects).toEqual([{ type: "openUrl", url: "https://twitter.com/cazzwastaken" }]);
  });

  it("links prints every link as an anchor", () => {
    expect(hrefs(exec("links"))).toEqual(LINKS.map((l) => l.url));
  });

  it("open with an unknown or missing target explains itself", () => {
    const unknown = exec("open minesweeper");
    expect(unknown.effects).toEqual([]);
    expect(out(unknown)).toContain("open: no such app or link: minesweeper");
    expect(out(exec("open"))).toContain("usage: open <app|link>");
  });

  it("unknown commands look like zsh", () => {
    expect(out(exec("frobnicate --now"))).toBe("zsh: command not found: frobnicate");
    // Prototype keys are not commands.
    expect(out(exec("constructor"))).toBe("zsh: command not found: constructor");
    expect(out(exec("toString"))).toBe("zsh: command not found: toString");
  });

  it("easter eggs", () => {
    expect(out(exec("sudo rm -rf /"))).toContain("cazz is not in the sudoers file. This incident will be reported.");
    expect(out(exec("sudo"))).toContain("usage");
    expect(out(exec("rm -rf /"))).toContain("dangerous");
    expect(out(exec("rm -fr --no-preserve-root /"))).toContain("dangerous");
    expect(out(exec("rm file"))).toContain("Read-only file system");
    expect(out(exec("cowsay hi"))).toContain("< hi >");
    expect(out(exec("vim"))).toContain("vim");
  });

  it("cowsay wraps long text into a multi-line bubble", () => {
    const text = cowsay("a ".repeat(40)).map(textOf);
    expect(text[1].startsWith("/ ")).toBe(true);
    expect(text.some((row) => row.startsWith("\\ "))).toBe(true);
    expect(cowsay("").map(textOf)[1]).toBe("< moo >");
  });

  it("emerge animates, sanitises the package and needs a target", () => {
    const sync = exec("emerge --sync");
    expect(sync.effects[0].type).toBe("animate");
    const pkg = exec("emerge <b>x</b>");
    const steps = pkg.effects[0].type === "animate" ? pkg.effects[0].steps : [];
    expect(steps.length).toBeGreaterThan(5);
    const joined = steps.map((s) => (s.kind === "print" ? textOf(s.block) : "")).join("\n");
    expect(joined).toContain("app-misc/bxb-9999");
    expect(joined).not.toContain("<");
    expect(out(exec("emerge"))).toContain("no targets");
    const total = emergeSteps(["cowsay"]).reduce((sum, s) => sum + stepDuration(s), 0);
    expect(total).toBeLessThan(3000);
  });

  it("every visible command name appears in commandNames()", () => {
    const names = commandNames();
    for (const [name, c] of Object.entries(COMMANDS)) if (c.help) expect(names).toContain(name);
    expect(names).not.toContain("sudo");
  });
});

describe("complete", () => {
  it("completes a unique command with a trailing space", () => {
    expect(complete("fastf")).toEqual({ value: "fastfetch ", options: [] });
    expect(complete("vid")).toEqual({ value: "videos ", options: [] });
  });

  it("extends to the common prefix and lists options when ambiguous", () => {
    const c = complete("c");
    expect(c.options).toEqual(expect.arrayContaining(["cat", "clear", "community"]));
    expect(c.value).toBe("c");
    expect(complete("su").options).toEqual([]); // only "support" -> unique
    expect(complete("su").value).toBe("support ");
  });

  it("completes arguments for open, cat, ls and emerge", () => {
    expect(complete("open dis").value).toBe("open discord ");
    expect(complete("open s").options).toEqual(["socials", "support"]);
    expect(complete("cat ab").value).toBe("cat about.txt ");
    expect(complete("ls li").value).toBe("ls links/");
    expect(complete("emerge --s").value).toBe("emerge --sync ");
  });

  it("leaves input alone when nothing matches", () => {
    expect(complete("zzz")).toEqual({ value: "zzz", options: [] });
    expect(complete("echo hel")).toEqual({ value: "echo hel", options: [] });
  });
});

describe("history helpers", () => {
  it("pushHistory ignores blanks and consecutive duplicates and caps the length", () => {
    expect(pushHistory([], "  ")).toEqual([]);
    expect(pushHistory(["ls"], "ls")).toEqual(["ls"]);
    expect(pushHistory(["ls"], " help ")).toEqual(["ls", "help"]);
    const long = Array.from({ length: HISTORY_LIMIT }, (_, i) => `c${i}`);
    expect(pushHistory(long, "new")).toHaveLength(HISTORY_LIMIT);
  });

  it("stepHistory walks up and back down to the draft", () => {
    const h = ["a", "b", "c"];
    let s = stepHistory(h, null, -1, "dr");
    expect(s).toEqual({ index: 2, value: "c" });
    s = stepHistory(h, s.index, -1, "dr");
    s = stepHistory(h, s.index, -1, "dr");
    s = stepHistory(h, s.index, -1, "dr");
    expect(s).toEqual({ index: 0, value: "a" });
    s = stepHistory(h, s.index, 1, "dr");
    expect(s).toEqual({ index: 1, value: "b" });
    s = stepHistory(h, 2, 1, "dr");
    expect(s).toEqual({ index: null, value: "dr" });
    expect(stepHistory([], null, -1, "x")).toEqual({ index: null, value: "x" });
    expect(stepHistory(h, null, 1, "x")).toEqual({ index: null, value: "x" });
  });
});

describe("boot", () => {
  it("logs in as cazz, runs fastfetch, ends with the hint, under 2.5s", () => {
    const steps = bootSteps(sys);
    const total = steps.reduce((sum, s) => sum + stepDuration(s), 0);
    expect(total).toBeLessThan(2500);
    expect(steps.some((s) => s.kind === "type" && s.text === "cazz")).toBe(true);
    expect(steps.some((s) => s.kind === "type" && s.text === "fastfetch")).toBe(true);
    const printed = steps.flatMap((s) => (s.kind === "print" ? [textOf(s.block)] : []));
    expect(printed.join("\n")).toContain("Last login: Wed Nov 25 14:03:07 2026 on tty1");
    expect(printed.join("\n")).toContain("I make videos about C++, reverse engineering, and how games work.");
    expect(printed[printed.length - 1]).toContain("help");
  });

  it("formatUptime", () => {
    expect(formatUptime(5_400)).toBe("5s");
    expect(formatUptime(3_723_000)).toBe("1h 2m");
  });
});

describe("session", () => {
  const steps = bootSteps(sys);
  const drain = (state: Session) => {
    let guard = 0;
    while (nextDelay(state) !== null && guard++ < 1000) state = sessionReducer(state, { type: "advance" });
    return state;
  };

  it("instant (reduced motion) starts finished and idle", () => {
    const s = createSession(steps, true);
    expect(s.mode).toBe("idle");
    expect(s.entries).toHaveLength(steps.length);
    expect(s.entries.every((e) => !e.fresh)).toBe(true);
    expect(nextDelay(s)).toBeNull();
  });

  it("advancing to the end equals flushing (same text, no duplicates)", () => {
    const played = drain(createSession(steps, false));
    const flushed = sessionReducer(createSession(steps, false), { type: "flush" });
    expect(played.mode).toBe("idle");
    expect(played.entries.map((e) => textOf(e.block))).toEqual(flushed.entries.map((e) => textOf(e.block)));
    expect(played.entries).toHaveLength(steps.length);
  });

  it("typing reveals one character per advance", () => {
    let s = createSession(steps, false);
    s = sessionReducer(s, { type: "advance" }); // banner
    s = sessionReducer(s, { type: "advance" }); // start typing "cazz"
    expect(s.typing?.shown).toBe(0);
    s = sessionReducer(s, { type: "advance" });
    expect(s.typing?.shown).toBe(1);
  });

  it("skipping mid-boot finishes typing and clears reveal flags", () => {
    let s = createSession(steps, false);
    for (let i = 0; i < 12; i++) s = sessionReducer(s, { type: "advance" });
    s = sessionReducer(s, { type: "flush" });
    expect(s.mode).toBe("idle");
    expect(s.typing).toBeNull();
    expect(s.entries).toHaveLength(steps.length);
    expect(s.entries.every((e) => !e.fresh)).toBe(true);
  });

  it("enqueue runs as busy; cancel stops it", () => {
    let s = createSession([], false);
    s = sessionReducer(s, { type: "enqueue", steps: emergeSteps(["x"]) });
    expect(s.mode).toBe("busy");
    s = sessionReducer(s, { type: "advance" });
    expect(s.entries).toHaveLength(1);
    s = sessionReducer(s, { type: "cancel" });
    expect(s.mode).toBe("idle");
    expect(nextDelay(s)).toBeNull();
  });

  it("clear empties the log and the log is capped", () => {
    let s = createSession(steps, true);
    s = sessionReducer(s, { type: "clear" });
    expect(s.entries).toEqual([]);
    const many: Block[] = Array.from({ length: MAX_ENTRIES + 10 }, () => ({ type: "line", spans: [] }));
    s = sessionReducer(s, { type: "append", blocks: many });
    expect(s.entries).toHaveLength(MAX_ENTRIES);
    expect(new Set(s.entries.map((e) => e.id)).size).toBe(MAX_ENTRIES);
  });
});
