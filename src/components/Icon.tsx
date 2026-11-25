import {
  Copy, ExternalLink, Github, Heart, Info, Link2, MessagesSquare, Minus, Square, Terminal, TvMinimalPlay, X, Youtube,
} from "lucide-react";

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
};

export type Glyph = keyof typeof icons;

export function Icon({ name }: { name: Glyph }) {
  const Symbol = icons[name];
  return <Symbol className="desk-icon" aria-hidden="true" strokeWidth={1.65} />;
}
