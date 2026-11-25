/**
 * The bundled "latest upload": shown on first paint and whenever the live feed is unavailable.
 * Shared by the Videos panel and the terminal. Update it (and public/latest-video.jpg) when a new video lands.
 */
export const FEATURED = {
  id: "nbfGBSerBJY",
  title: "FREE & UNCENSORED AI",
  published: "2026-11-20T14:37:54+00:00",
} as const;

export const watchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;
