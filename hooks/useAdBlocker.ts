
import { useState, useEffect } from 'react';

export const useAdBlocker = (): boolean => {
  const [isDetected, setIsDetected] = useState(false);

  useEffect(() => {
    const baitElement = document.createElement('div');
    baitElement.className = 'ad-banner-placeholder ads-container';
    baitElement.style.position = 'absolute';
    baitElement.style.top = '-9999px';
    baitElement.style.left = '-9999px';
    baitElement.style.width = '1px';
    baitElement.style.height = '1px';
    baitElement.setAttribute('aria-hidden', 'true');
    document.body.appendChild(baitElement);

    const checkInterval = setTimeout(() => {
      if (
        !baitElement.parentElement ||
        baitElement.offsetHeight === 0 ||
        window.getComputedStyle(baitElement).display === 'none'
      ) {
        setIsDetected(true);
      }
      if (baitElement.parentElement) {
        baitElement.parentElement.removeChild(baitElement);
      }
    }, 100);

    return () => {
      clearTimeout(checkInterval);
      if (baitElement.parentElement) {
        try {
          baitElement.parentElement.removeChild(baitElement);
        } catch (error) {
           // Ignore errors during cleanup
        }
      }
    };
  }, []);

  return isDetected;
};
