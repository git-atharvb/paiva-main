import { useState, useEffect } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface WikipediaImageProps {
  searchTerm: string;
  alt?: string;
  className?: string;
}

export default function WikipediaImage({ searchTerm, alt, className }: WikipediaImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(false);

    const fetchImage = async () => {
      try {
        const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
          searchTerm
        )}&prop=pageimages&format=json&pithumbsize=500&origin=*`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (!isMounted) return;

        const pages = data?.query?.pages;
        if (pages) {
          const pageIds = Object.keys(pages);
          if (pageIds.length > 0 && pageIds[0] !== '-1') {
            const page = pages[pageIds[0]];
            if (page.thumbnail?.source) {
              setImageUrl(page.thumbnail.source);
            } else {
              setError(true);
            }
          } else {
            setError(true);
          }
        } else {
          setError(true);
        }
      } catch (err) {
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
    };
  }, [searchTerm]);

  if (error) {
    // If we can't find an image, we fail gracefully and render nothing
    // so it doesn't break the chat layout.
    return null;
  }

  if (loading) {
    return (
      <div className={cn("w-[400px] h-[300px] shrink-0 animate-pulse bg-muted rounded-xl border border-border/50 flex items-center justify-center my-4 shadow-sm max-w-[85vw]", className)}>
        <ImageIcon className="text-muted-foreground/30" size={32} />
      </div>
    );
  }

  if (!imageUrl) return null;

  return (
    <figure className={cn("my-4 w-[400px] h-[300px] max-w-[85vw] shrink-0 overflow-hidden rounded-xl border border-border/50 shadow-md bg-black/5 dark:bg-black/20 group relative flex items-center justify-center", className)}>
      <img
        src={imageUrl}
        alt={alt || searchTerm.replace(/_/g, ' ')}
        className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <figcaption className="absolute bottom-0 left-0 right-0 p-3 text-xs text-white/90 font-medium tracking-snug truncate opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {alt || searchTerm.replace(/_/g, ' ')}
      </figcaption>
    </figure>
  );
}
