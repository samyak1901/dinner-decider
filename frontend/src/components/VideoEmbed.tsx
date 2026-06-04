interface VideoEmbedProps {
  url?: string | null;
  title?: string | null;
}

export default function VideoEmbed({ url, title }: VideoEmbedProps) {
  if (!url) return null;

  let videoId = null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com')) {
      videoId = parsed.searchParams.get('v');
    } else if (parsed.hostname === 'youtu.be') {
      videoId = parsed.pathname.slice(1);
    }
  } catch {
    // Not a valid URL
  }

  if (videoId) {
    return (
      <div className="mt-3 aspect-video w-full overflow-hidden rounded-xl bg-black/30 ring-1 ring-white/5">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title={title || 'Recipe video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-amber-400 hover:text-amber-300 underline underline-offset-4 decoration-amber-500/30 hover:decoration-amber-400 transition-all"
    >
      {title || 'Watch recipe video'}
    </a>
  );
}
