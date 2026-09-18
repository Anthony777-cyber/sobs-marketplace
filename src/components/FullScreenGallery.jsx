import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

// Frame-less, edge-to-edge full-screen gallery. 100% viewport width/height,
// no borders/canvas frames. Left/right arrows + mobile swipe. Red X exit.
export default function FullScreenGallery({ images, startIndex = 0, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const touchX = useRef(null);

  const go = useCallback(
    (dir) => {
      setIndex((i) => (i + dir + images.length) % images.length);
    },
    [images.length]
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [go, onClose]);

  const onTouchStart = (e) => {
    touchX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) go(dx > 0 ? -1 : 1);
    touchX.current = null;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <img
        src={images[index]}
        alt=""
        style={{
          maxWidth: '100vw',
          maxHeight: '100vh',
          width: 'auto',
          height: 'auto',
          objectFit: 'contain',
        }}
      />

      <button
        onClick={onClose}
        aria-label="Close gallery"
        className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700"
      >
        <X className="h-6 w-6" />
      </button>

      {images.length > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            aria-label="Previous photo"
            className="absolute left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/30"
          >
            <ChevronLeft className="h-7 w-7" />
          </button>
          <button
            onClick={() => go(1)}
            aria-label="Next photo"
            className="absolute right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/30"
          >
            <ChevronRight className="h-7 w-7" />
          </button>
          <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
            {index + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
}