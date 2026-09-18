import React, { useState } from 'react';
import { Flag } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

// Madame Guillotine flag button. Triggers an atomic backend increment of the
// listing's flag count. Shows a confirmation popup. Never displays the count.
export default function FlagButton({ listing, onRemoved }) {
  const storageKey = 'sobs_flagged_' + listing.id;
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(() => {
    try {
      return localStorage.getItem(storageKey) === '1';
    } catch {
      return false;
    }
  });
  const [showToast, setShowToast] = useState(false);

  const handle = async () => {
    if (loading || done) return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke('flagListing', { listingId: listing.id });
      const data = res.data || {};
      setDone(true);
      try {
        localStorage.setItem(storageKey, '1');
      } catch {}
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3200);
      if (data.chopped) {
        setTimeout(() => onRemoved?.(), 1400);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handle}
        disabled={loading || done}
        className={cn(
          'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-colors',
          done
            ? 'border-destructive/30 bg-destructive/10 text-destructive'
            : 'border-border hover:bg-muted'
        )}
      >
        <Flag className="h-3.5 w-3.5" />
        {done ? 'Flagged' : 'Flag / Downvote'}
      </button>
      {showToast && (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-lg bg-foreground px-5 py-3 text-center text-sm font-medium text-background shadow-xl">
          Flag acknowledged. Thank you for keeping the community clean.
        </div>
      )}
    </>
  );
}