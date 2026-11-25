import { useEffect, useState } from 'react';
import type { PanelProps } from './panels';
import { FEATURED, watchUrl as watchUrlFor } from './desktop/featured';
import { Play, Youtube } from 'lucide-react';
import './video.css';

type Upload = {
  id: string;
  title: string;
  published: string;
};

const featured: Upload = FEATURED;
const dateFormat = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

export default function Video({ minimized }: PanelProps) {
  const [upload, setUpload] = useState(featured);
  const [playing, setPlaying] = useState(false);

  // Minimizing the window stops playback so audio never continues out of sight.
  useEffect(() => {
    if (minimized) setPlaying(false);
  }, [minimized]);

  useEffect(() => {
    const controller = new AbortController();

    async function refresh() {
      try {
        const response = await fetch('/api/latest-video', { signal: controller.signal });
        if (!response.ok) return;

        const latest: Partial<Upload> | null = await response.json();
        if (
          !controller.signal.aborted &&
          typeof latest?.id === 'string' &&
          /^[\w-]{11}$/.test(latest.id) &&
          typeof latest.title === 'string' &&
          latest.title.trim() &&
          typeof latest.published === 'string' &&
          Date.parse(latest.published) >= Date.parse(featured.published)
        ) {
          setUpload({ id: latest.id, title: latest.title, published: latest.published });
        }
      } catch {
        // The bundled upload remains available if the feed cannot be reached.
      }
    }

    if (!playing) void refresh();
    return () => controller.abort();
  }, [playing]);

  const watchUrl = watchUrlFor(upload.id);
  const thumbnailUrl = upload.id === featured.id
    ? '/latest-video.jpg'
    : `https://i.ytimg.com/vi/${upload.id}/hqdefault.jpg`;

  return (
    <section className="video-app" aria-label="Latest YouTube upload">
      <div className="video-app__player">
        {playing ? (
          <iframe
            title={upload.title}
            src={`https://www.youtube-nocookie.com/embed/${upload.id}?autoplay=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            className="video-app__play"
            aria-label={`Play ${upload.title}`}
            onClick={() => setPlaying(true)}
          >
            <img src={thumbnailUrl} alt="" draggable="false" />
            <span className="video-app__play-icon" aria-hidden="true">
              <Play size={21} fill="currentColor" />
            </span>
          </button>
        )}
      </div>
      <div className="video-app__details">
        <div className="video-app__caption">
          <h2>{upload.title}</h2>
          <time dateTime={upload.published}>{dateFormat.format(new Date(upload.published))}</time>
        </div>
        <a href={watchUrl} target="_blank" rel="noreferrer">
          <Youtube size={17} aria-hidden="true" /> Watch on YouTube
        </a>
      </div>
    </section>
  );
}
