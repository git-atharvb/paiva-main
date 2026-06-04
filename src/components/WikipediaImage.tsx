import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Image as ImageIcon, Download } from 'lucide-react';
import { cn } from '../lib/utils';
import { fetchWithAuth } from '../services/api';

interface WikipediaImageProps {
  searchTerm: string;
  alt?: string;
  className?: string;
}

// Global cache to prevent re-fetching and reloading when ReactMarkdown re-renders
const globalImageCache: Record<string, string[]> = {};

function ImageItem({ 
  url, 
  alt, 
  className,
  style,
  searchTerm, 
  onExpand, 
  onRemove,
  isSingle = false
}: { 
  url: string, 
  alt: string, 
  className?: string, 
  style?: React.CSSProperties,
  searchTerm: string, 
  onExpand: (url: string) => void, 
  onRemove: (url: string) => void,
  isSingle?: boolean
}) {
  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const response = await fetchWithAuth(`/api/images/download?url=${encodeURIComponent(url)}`);
      const blob = await response.blob();
      const objUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objUrl;
      
      let ext = 'jpg';
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('png')) ext = 'png';
      else if (contentType?.includes('gif')) ext = 'gif';
      else if (contentType?.includes('webp')) ext = 'webp';
      
      link.download = `${searchTerm.replace(/_/g, '-')}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objUrl);
    } catch (err) {
      window.open(url, '_blank');
    }
  };

  return (
    <figure 
      onClick={() => onExpand(url)}
      className={cn("overflow-hidden rounded-xl border border-border/50 shadow-md bg-black/5 dark:bg-black/20 group relative flex items-center justify-center cursor-zoom-in shrink-0", className)}
      style={style}
    >
      <img
        src={url}
        alt={alt}
        onError={() => onRemove(url)}
        className={cn(
          "w-full h-full transition-transform duration-500 group-hover:scale-105",
          isSingle ? "object-contain" : "object-cover"
        )}
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      {/* Top right actions (Download) */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex gap-2">
        <button
          onClick={handleDownload}
          className="p-2 rounded-lg bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm transition-colors border border-white/10 shadow-sm"
          title="Download Image"
        >
          <Download size={16} />
        </button>
      </div>

      <figcaption className="absolute bottom-0 left-0 right-0 p-3 text-xs text-white/90 font-medium tracking-snug truncate opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        {alt}
      </figcaption>
    </figure>
  );
}

export default function WikipediaImage({ searchTerm, alt, className }: WikipediaImageProps) {
  const cachedUrls = globalImageCache[searchTerm];

  const [imageUrls, setImageUrls] = useState<string[]>(cachedUrls || []);
  const [loading, setLoading] = useState(!cachedUrls);
  const [error, setError] = useState(false);
  const [maximizedUrl, setMaximizedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (globalImageCache[searchTerm]) {
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(false);

    const fetchImage = async () => {
      try {
        const response = await fetchWithAuth(`/api/images/search?q=${encodeURIComponent(searchTerm)}`);
        const urls = await response.json();
        
        if (!isMounted) return;

        if (urls && urls.length > 0) {
          globalImageCache[searchTerm] = urls;
          setImageUrls(urls);
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

  const handleRemoveUrl = (failedUrl: string) => {
    setImageUrls(prev => prev.filter(u => u !== failedUrl));
  };

  const handleDownloadMaximized = async (e: React.MouseEvent) => {
    if (!maximizedUrl) return;
    e.preventDefault();
    e.stopPropagation();
    try {
      const response = await fetchWithAuth(`/api/images/download?url=${encodeURIComponent(maximizedUrl)}`);
      const blob = await response.blob();
      const objUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objUrl;
      let ext = 'jpg';
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('png')) ext = 'png';
      else if (contentType?.includes('gif')) ext = 'gif';
      else if (contentType?.includes('webp')) ext = 'webp';
      
      link.download = `${searchTerm.replace(/_/g, '-')}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objUrl);
    } catch (err) {
      window.open(maximizedUrl, '_blank');
    }
  };

  if (error) {
    return null;
  }

  const displayUrls = imageUrls.slice(0, 3);

  if (loading || displayUrls.length === 0) {
    return (
      <div className={cn("w-[400px] shrink-0 animate-pulse bg-muted rounded-xl border border-border/50 flex items-center justify-center my-4 shadow-sm max-w-[85vw]", className)} style={{ minHeight: '300px' }}>
        <ImageIcon className="text-muted-foreground/30" size={32} />
      </div>
    );
  }

  const altText = alt || searchTerm.replace(/_/g, ' ');

  return (
    <>
      <div className={cn("my-4 w-[400px] max-w-[85vw] shrink-0 flex flex-col", className)}>
        
        {/* Layout for 1 Image */}
        {displayUrls.length === 1 && (
          <ImageItem 
            url={displayUrls[0]} alt={altText} searchTerm={searchTerm}
            className="w-full h-full min-h-[300px]" 
            onExpand={setMaximizedUrl} onRemove={handleRemoveUrl}
            isSingle={true}
          />
        )}

        {/* Layout for 2 Images */}
        {displayUrls.length === 2 && (
          <div className="flex gap-2 w-full h-full min-h-[200px]">
            <ImageItem 
              url={displayUrls[0]} alt={altText} searchTerm={searchTerm}
              className="flex-1 h-full" 
              onExpand={setMaximizedUrl} onRemove={handleRemoveUrl}
            />
            <ImageItem 
              url={displayUrls[1]} alt={altText} searchTerm={searchTerm}
              className="flex-1 h-full" 
              onExpand={setMaximizedUrl} onRemove={handleRemoveUrl}
            />
          </div>
        )}

        {/* Layout for 3 Images */}
        {displayUrls.length === 3 && (
          <div className="flex flex-col gap-2 w-full h-full min-h-[320px]">
            <ImageItem 
              url={displayUrls[0]} alt={altText} searchTerm={searchTerm}
              className="w-full" style={{ flex: 3, minHeight: '180px' }}
              onExpand={setMaximizedUrl} onRemove={handleRemoveUrl}
            />
            <div className="flex gap-2 w-full" style={{ flex: 2, minHeight: '120px' }}>
              <ImageItem 
                url={displayUrls[1]} alt={altText} searchTerm={searchTerm}
                className="flex-1 h-full" 
                onExpand={setMaximizedUrl} onRemove={handleRemoveUrl}
              />
              <ImageItem 
                url={displayUrls[2]} alt={altText} searchTerm={searchTerm}
                className="flex-1 h-full" 
                onExpand={setMaximizedUrl} onRemove={handleRemoveUrl}
              />
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Overlay */}
      {maximizedUrl && createPortal(
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 cursor-zoom-out p-4 md:p-10"
          onClick={() => setMaximizedUrl(null)}
        >
          <img
            src={maximizedUrl}
            alt={altText}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()} // Prevent click on image from closing
          />
          
          <button
            onClick={handleDownloadMaximized}
            className="absolute top-6 right-6 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm transition-colors border border-white/20 shadow-lg cursor-pointer"
            title="Download Image"
          >
            <Download size={20} />
          </button>
        </div>,
        document.body
      )}
    </>
  );
}
