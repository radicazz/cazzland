// Parses YouTube's public Atom feed. Lives in api/_lib so Vercel does not deploy it as a function
// (underscore-prefixed paths are ignored) and tests can import it directly.

const xmlEntities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

function decodeEntities(text) {
  return text.replace(/&(amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);/gi, (entity, value) => {
    if (!value.startsWith('#')) return xmlEntities[value.toLowerCase()] ?? entity;

    const code = value[1].toLowerCase() === 'x'
      ? Number.parseInt(value.slice(2), 16)
      : Number.parseInt(value.slice(1), 10);

    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity;
  });
}

/** Returns { id, title, published } for the newest entry, or null if the feed is unusable. */
export function latestFromFeed(xml) {
  // Tolerate attributes on <entry> (e.g. xmlns) and CDATA-wrapped titles.
  const entry = xml.match(/<entry\b[^>]*>([\s\S]*?)<\/entry>/)?.[1];
  const id = entry?.match(/<yt:videoId>([\w-]{11})<\/yt:videoId>/)?.[1];
  const titleMatch = entry?.match(/<title\b[^>]*>(?:\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*|([^<]+))<\/title>/);
  const rawTitle = (titleMatch?.[1] ?? (titleMatch?.[2] && decodeEntities(titleMatch[2])))?.trim();
  const published = entry?.match(/<published>([^<]+)<\/published>/)?.[1];
  if (!id || !rawTitle || !published || !Number.isFinite(Date.parse(published))) return null;

  return { id, title: rawTitle, published };
}
