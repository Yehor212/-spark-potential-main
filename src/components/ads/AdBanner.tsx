import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdBannerProps {
  slot?: string;
  format?: 'auto' | 'horizontal' | 'vertical' | 'rectangle';
  className?: string;
}

export function AdBanner({ slot, format = 'auto', className = '' }: AdBannerProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  const clientId = import.meta.env.VITE_ADSENSE_CLIENT_ID;
  const adSlot = slot || import.meta.env.VITE_ADSENSE_SLOT_BANNER;

  useEffect(() => {
    // Only load ads if configured
    if (!clientId || !adSlot) {
      return;
    }

    // Load AdSense script if not already loaded
    if (!document.querySelector('script[src*="adsbygoogle"]')) {
      const script = document.createElement('script');
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
      script.async = true;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }

    // Push ad
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      setIsLoaded(true);
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }, [clientId, adSlot]);

  // Don't render if not configured
  if (!clientId || !adSlot || !isVisible) {
    return null;
  }

  return (
    <div className={`relative bg-muted/50 rounded-xl overflow-hidden ${className}`}>
      {/* Close button - allows users to dismiss */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-1 right-1 z-10 h-6 w-6 opacity-50 hover:opacity-100"
        onClick={() => setIsVisible(false)}
      >
        <X className="w-3 h-3" />
      </Button>

      {/* Ad container */}
      <div ref={adRef} className="min-h-[50px] flex items-center justify-center">
        {isLoaded ? (
          <ins
            className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client={clientId}
            data-ad-slot={adSlot}
            data-ad-format={format}
            data-full-width-responsive="true"
          />
        ) : (
          <div className="text-xs text-muted-foreground py-2">
            Ad
          </div>
        )}
      </div>
    </div>
  );
}
