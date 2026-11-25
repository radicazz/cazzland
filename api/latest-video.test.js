import { afterEach, describe, expect, it, vi } from 'vitest';
import handler from './latest-video.js';
import { latestFromFeed } from './_lib/feed.js';

const entry = (inner, attrs = '') => `<feed><entry${attrs}>${inner}</entry></feed>`;
const fields = (title = '<title>Hello</title>') =>
  `<yt:videoId>abcdefghijk</yt:videoId>${title}<published>2026-11-20T14:37:54+00:00</published>`;

describe('latestFromFeed', () => {
  it('parses the newest entry', () => {
    expect(latestFromFeed(entry(fields()))).toEqual({
      id: 'abcdefghijk', title: 'Hello', published: '2026-11-20T14:37:54+00:00',
    });
  });

  it('accepts attributes on <entry> and CDATA titles', () => {
    expect(latestFromFeed(entry(fields('<title><![CDATA[A & B]]></title>'), ' xmlns="http://www.w3.org/2005/Atom"')))
      .toMatchObject({ title: 'A & B' });
  });

  it('decodes XML entities and leaves invalid code points alone', () => {
    expect(latestFromFeed(entry(fields('<title>Tom &amp; &#x41; &#0; &lt;3</title>'))).title).toBe('Tom & A &#0; <3');
  });

  it.each([
    ['empty', ''],
    ['no entry', '<feed></feed>'],
    ['bad id', entry(fields().replace('abcdefghijk', 'short'))],
    ['no title', entry('<yt:videoId>abcdefghijk</yt:videoId><published>2026-11-20T14:37:54+00:00</published>')],
    ['bad date', entry(fields().replace('2026-11-20T14:37:54+00:00', 'not a date'))],
  ])('returns null for a malformed feed (%s)', (_name, xml) => {
    expect(latestFromFeed(xml)).toBeNull();
  });
});

function mockResponse() {
  const res = { headers: {}, statusCode: 0, body: undefined };
  res.setHeader = (k, v) => { res.headers[k] = v; };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => { res.body = body; };
  res.end = () => {};
  return res;
}

describe('handler', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('returns the latest upload with cache headers', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(entry(fields()))));
    const res = mockResponse();
    await handler({ method: 'GET' }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe('abcdefghijk');
    expect(res.headers['Vercel-CDN-Cache-Control']).toContain('s-maxage=3600');
  });

  it.each(['HEAD'])('allows %s', async (method) => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(entry(fields()))));
    const res = mockResponse();
    await handler({ method }, res);
    expect(res.statusCode).toBe(200);
  });

  it('rejects other methods with 405', async () => {
    const res = mockResponse();
    await handler({ method: 'POST' }, res);
    expect(res.statusCode).toBe(405);
    expect(res.headers.Allow).toBe('GET, HEAD');
  });

  it.each([
    ['upstream error', async () => new Response('', { status: 500 })],
    ['network failure', async () => { throw new Error('down'); }],
    ['malformed feed', async () => new Response('<feed/>')],
  ])('returns an uncacheable-by-browser 502 on %s', async (_name, fetcher) => {
    vi.stubGlobal('fetch', vi.fn(fetcher));
    const res = mockResponse();
    await handler({ method: 'GET' }, res);
    expect(res.statusCode).toBe(502);
    expect(res.headers['Cache-Control']).toBe('no-store');
    expect(res.headers['Vercel-CDN-Cache-Control']).toBe('public, s-maxage=60');
  });
});
