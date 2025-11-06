import { useState, useEffect } from 'react';

// In-memory cache stored as a static variable to persist across component re-renders within a session.
const imageCache = new Map<string, string>();

export const useCachedImage = (src: string | undefined) => {
  const [imageSrc, setImageSrc] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!src) {
        setIsLoading(false);
        return;
    }

    let isCancelled = false;

    const loadImage = async () => {
        // Check cache first
        if (imageCache.has(src)) {
            if (!isCancelled) {
                setImageSrc(imageCache.get(src));
                setIsLoading(false);
            }
            return;
        }

        // If not in cache, fetch and store it
        try {
            const response = await fetch(src);
            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.statusText}`);
            }
            const blob = await response.blob();
            const dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });

            if (!isCancelled) {
                imageCache.set(src, dataUrl); // Store in cache
                setImageSrc(dataUrl);
                setIsLoading(false);
            }
        } catch (error) {
            console.error(`Failed to load and cache image ${src}:`, error);
            if (!isCancelled) {
                // Fallback to src directly on error, the browser might still handle caching
                setImageSrc(src); 
                setIsLoading(false);
            }
        }
    };

    loadImage();

    return () => {
        isCancelled = true;
    };
  }, [src]);

  return { imageSrc, isLoading };
};
