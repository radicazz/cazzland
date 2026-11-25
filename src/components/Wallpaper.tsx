import type { CSSProperties } from "react";

/** Deterministic pseudo-random sequence so the starfield is identical on every render. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const rand = seeded(7);
const STARS: CSSProperties[] = Array.from({ length: 36 }, () => ({
  "--x": `${(rand() * 100).toFixed(1)}%`,
  "--y": `${(rand() * 78).toFixed(1)}%`,
  "--s": `${(1 + rand() * 1.6).toFixed(1)}px`,
  "--d": `${(2.6 + rand() * 4).toFixed(1)}s`,
  "--t": `-${(rand() * 8).toFixed(1)}s`,
  "--o": (0.35 + rand() * 0.4).toFixed(2),
}) as CSSProperties);

const METEORS: CSSProperties[] = [
  { "--x": "62%", "--y": "6%", "--t": "-3s", "--d": "23s" },
  { "--x": "30%", "--y": "14%", "--t": "-14s", "--d": "31s" },
] as unknown as CSSProperties[];

/** Animated wallpaper layers. The base image and glow live in styles/wallpaper.css. */
export function Wallpaper() {
  return (
    <div className="wallpaper" aria-hidden="true">
      <span className="wp-blob wp-blob-pink" />
      <span className="wp-blob wp-blob-violet" />
      <span className="wp-blob wp-blob-rose" />
      {STARS.map((style, i) => (
        <span key={i} className="wp-star" style={style} />
      ))}
      {METEORS.map((style, i) => (
        <span key={i} className="wp-meteor" style={style} />
      ))}
    </div>
  );
}
