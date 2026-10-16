import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Image } from '@/components/ui/image';
import FullScreenGallery from '@/components/FullScreenGallery';
import { getCurrency, formatAmount } from '@/lib/currency';
import { formatExpiryDate } from '@/lib/format';
import { getListingManagementCode, PRIVATE_LISTING_CODE_LABEL } from '@/lib/listing-codes';
import ListingCode from '@/components/ListingCode';

function formatPublicListingNumber(value) {
  const digits = String(value ?? '').padStart(16, '0');
  return digits.match(/.{1,4}/g)?.join(' ') ?? digits;
}

export default function ListingCard({ listing, onRemoved, backTo, useDirectImages = false, showPublicNumber = true, showManagementCode = false }) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const images = (() => {
    let raw = [];

    if (Array.isArray(listing.images)) {
      raw = listing.images;
    } else if (typeof listing.images === 'string') {
      try {
        const parsed = JSON.parse(listing.images);
        if (Array.isArray(parsed)) raw = parsed;
      } catch {}
    }

    if (raw.length === 0 && listing.image_url) {
      raw = [listing.image_url];
    }

    return raw
      .map((image) => {
        if (typeof image === 'string') return image;
        if (!image || typeof image !== 'object') return '';
        return image.url || image.src || image.image_url || image.path || '';
      })
      .filter(Boolean);
  })();
  const cur = getCurrency(listing.currency);

  return (
    <div className="overflow-hidden rounded-xl border bg-card transition-all hover:shadow-md">
      {showPublicNumber && (
        <div className="px-4 pt-3">
          <ListingCode value={formatPublicListingNumber(listing.listing_alias)} copyValue={String(listing.listing_alias).padStart(16, '0')} />
        </div>
      )}
      <div className="aspect-square w-full bg-muted">
        {images.length > 0 ? (
          <button
            type="button"
            onClick={() => setGalleryOpen(true)}
            className="block h-full w-full"
            aria-label="Open photo gallery"
          >
            <Image
              src={images[0]}
              alt={listing.title}
              className="h-full w-full"
              fittingType="fill"
            />
          </button>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-white">No image</div>
        )}
      </div>
      <div className="p-4">
        <Link
          to={`/listings/${listing.id}`}
          state={backTo ? { backTo, managedListing: listing } : undefined}
          className="block truncate font-medium text-white hover:text-white hover:underline"
        >
          {listing.title}
        </Link>
        <div className="mt-2 text-sm font-semibold text-white">
          {formatAmount(listing.price, cur)}
        </div>
        {showManagementCode && (
          <div className="mt-3">
            <ListingCode label={PRIVATE_LISTING_CODE_LABEL} value={getListingManagementCode(listing)} />
          </div>
        )}
      </div>
      {galleryOpen && images.length > 0 && (
        <FullScreenGallery images={images} startIndex={0} onClose={() => setGalleryOpen(false)} />
      )}
    </div>
  );
}
