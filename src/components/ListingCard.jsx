import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Image } from '@/components/ui/image';
import FlagButton from '@/components/FlagButton';
import FullScreenGallery from '@/components/FullScreenGallery';
import { getCurrency, formatAmount } from '@/lib/currency';
import { formatExpiryDate } from '@/lib/format';

export default function ListingCard({ listing, onRemoved }) {
  const [galleryOpen, setGalleryOpen] = useState(false);
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
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No image</div>
        )}
      </div>
      <div className="p-4">
        <Link to={`/listings/${listing.id}`} className="block truncate font-medium hover:underline">
          {listing.title}
        </Link>
        <p className="mt-1 text-lg font-semibold">{formatAmount(listing.price, cur)}</p>
        <p className="mt-1 text-xs text-muted-foreground">{formatExpiryDate(listing.expires_date)}</p>
        {listing.categoryPath && (
          <Link
            to={`/browse/${listing.categoryPath}`}
            className="mt-1 block truncate text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            {listing.categoryPath}
          </Link>
        )}
        <div className="mt-3">
          <FlagButton listing={listing} onRemoved={() => onRemoved?.(listing.id)} />
        </div>
      </div>
      {galleryOpen && images.length > 0 && (
        <FullScreenGallery images={images} startIndex={0} onClose={() => setGalleryOpen(false)} />
      )}
    </div>
  );
}