import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { flagListing } from '@/lib/api';
import { getEntryTicket } from '@/lib/entryTicket';

// Madame Guillotine flag button. Triggers an atomic backend increment of the
// listing's flag count. Shows a confirmation popup. Never displays the count.
export default function FlagButton({ listing, onRemoved }) {
  const [storageKey, setStorageKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [ticketReady, setTicketReady] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getEntryTicket()
      .then(({ ticket }) => {
        if (cancelled) return;

        const key = 'sobs_downvoted_' + ticket + '_' + listing.id;
        setStorageKey(key);

        try {
          setDone(localStorage.getItem(key) === '1');
        } catch {
          setDone(false);
        }

        setTicketReady(true);
      })
      .catch(() => {
        if (!cancelled) setTicketReady(false);
      });

    return () => {
      cancelled = true;
    };
  }, [listing.id]);

  const handle = async () => {
    if (loading || done || !ticketReady) return;
    setLoading(true);
    try {
      const data = await flagListing(listing.id);
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
        disabled={loading || done || !ticketReady}
        className={cn(
          'inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700',
          done ? 'bg-red-600 text-black hover:bg-red-600' : ''
        )}
      >
        {!done && <X className="h-4 w-4" />}
        {done ? 'downvoted' : 'Downvote'}
      </button>
      {showToast && (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-lg bg-foreground px-5 py-3 text-center text-sm font-medium text-background shadow-xl">
          Flag acknowledged. Thank you for keeping the community clean.
        </div>
      )}
    </>
  );
}