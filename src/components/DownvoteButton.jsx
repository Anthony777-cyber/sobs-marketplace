import React, { useState } from 'react';
import { ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { updateListing, deleteListing } from '@/lib/api';

const THRESHOLD = 5;

export default function DownvoteButton({ listing, onRemoved }) {
  const sessionId = `anonymous-${Math.random().toString(36).slice(2)}`;
  const [count, setCount] = useState(listing.downvote_count || 0);
  const [voted, setVoted] = useState((listing.downvoted_by || []).includes(sessionId));
  const [loading, setLoading] = useState(false);

  const handleDownvote = async () => {
    if (voted || loading) return;
    setLoading(true);
    const newCount = count + 1;
    try {
      if (newCount >= THRESHOLD) {
        await deleteListing(listing.id);
        onRemoved?.();
      } else {
        await updateListing(listing.id, {
          downvote_count: newCount,
          downvoted_by: [...(listing.downvoted_by || []), sessionId],
        });
        setCount(newCount);
        setVoted(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownvote}
      disabled={voted || loading}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors',
        voted ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'border-border hover:bg-muted'
      )}
    >
      <ThumbsDown className="h-4 w-4" />
      {voted ? 'Flagged' : 'Flag as inappropriate'}
      <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">{count}</span>
    </button>
  );
}