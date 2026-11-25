const channelId = 'UC9iIZaEy1r_q6CRAiXBqXOA';
const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

const xmlEntities = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

// YouTube emits flat Atom entries with a fixed set of fields.
export function latestFromFeed(xml) {
  const entry = xml.match(/<entry>([\s\S]*?)<\/entry>/)?.[1];
  const id = entry?.match(/<yt:videoId>([\w-]{11})<\/yt:videoId>/)?.[1];
  const rawTitle = entry?.match(/<title>([^<]+)<\/title>/)?.[1]?.trim();
  const published = entry?.match(/<published>([^<]+)<\/published>/)?.[1];
  if (!id || !rawTitle || !published || !Number.isFinite(Date.parse(published))) {
    return null;
  }

  const title = rawTitle.replace(/&(amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);/gi, (entity, value) => {
    if (!value.startsWith('#')) return xmlEntities[value] ?? entity;

    const code = value[1].toLowerCase() === 'x'
      ? Number.parseInt(value.slice(2), 16)
      : Number.parseInt(value.slice(1), 10);

    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity;
  });

  return { id, title, published };
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    response.status(405).end();
    return;
  }

  try {
    const upstream = await fetch(feedUrl, { signal: AbortSignal.timeout(5000) });
    if (!upstream.ok) throw new Error('YouTube feed unavailable');

    const video = latestFromFeed(await upstream.text());
    if (!video) throw new Error('YouTube feed missing an upload');

    response.setHeader('Cache-Control', 'public, max-age=300');
    response.setHeader('Vercel-CDN-Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    response.status(200).json(video);
  } catch {
    response.setHeader('Cache-Control', 'no-store');
    response.status(502).json({ error: 'Unable to check YouTube uploads' });
  }
}
