import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Image } from '@/components/ui/image';
import FullScreenGallery from '@/components/FullScreenGallery';
import { Copy } from 'lucide-react';
import { getCurrency, formatAmount } from '@/lib/currency';
import { formatExpiryDate } from '@/lib/format';

function formatPublicListingNumber(value) {
  const digits = String(value ?? '').padStart(16, '0');
  return digits.match(/.{1,4}/g)?.join(' ') ?? digits;
}

export default function ListingCard({ listing, onRemoved }) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const images = listing.images || (listing.image_url ? [listing.image_url] : []);
  const cur = getCurrency(listing.currency);

  return (
    <div className="overflow-hidden rounded-xl border bg-card transition-all hover:shadow-md">
      <div className="aspect-square w-full bg-muted">
        {images.length > 0 ? (
          <button
            type="button"
            onClick={() => setGalleryOpen(true)}
            className="block h-full w-full"
            aria-label="Open photo gallery"
          >
            <Image src={images[0]} alt={listing.title} className="h-full w-full" fittingType="fill" />
          </button>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-white">No image</div>
        )}
      </div>
      <div className="p-4">
        <Link to={`/listings/${listing.id}`} className="block truncate font-medium text-white hover:text-white hover:underline">
          {listing.title}
        </Link>
        <div className="mt-2 flex items-center gap-2 text-xs text-white">
          <span>Listing {formatPublicListingNumber(listing.listing_alias)}</span>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(String(listing.listing_alias).padStart(16, '0'));
                setCopied(true);
                setTimeout(() => setCopied(false), 1200);
              } catch {}
            }}
            className="inline-flex items-center gap-1 rounded border border-white/30 px-2 py-1 hover:bg-white/10"
            title="Copy listing number"
          >
            <Copy className="h-3 w-3" />
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        {listing.description && (
          <p className="mt-2 text-sm text-white whitespace-pre-wrap">
            {listing.description}
          </p>
        )}
      </div>
      {galleryOpen && images.length > 0 && (
        <FullScreenGallery images={images} startIndex={0} onClose={() => setGalleryOpen(false)} />
      )}
    </div>
  );
}