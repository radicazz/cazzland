import { latestFromFeed } from './_lib/feed.js';

const channelId = 'UC9iIZaEy1r_q6CRAiXBqXOA';
const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

export default async function handler(request, response) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.setHeader('Allow', 'GET, HEAD');
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
    // Browsers never keep an error; the CDN holds it briefly so a YouTube outage is not a stampede.
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Vercel-CDN-Cache-Control', 'public, s-maxage=60');
    response.status(502).json({ error: 'Unable to check YouTube uploads' });
  }
}
