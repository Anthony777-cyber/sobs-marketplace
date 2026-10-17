import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import FlagButton from '@/components/FlagButton';
import ChatThread from '@/components/ChatThread';
import FullScreenGallery from '@/components/FullScreenGallery';
import { Image } from '@/components/ui/image';
import { ArrowLeft, Loader2, MessageCircle, X } from 'lucide-react';
import { getCurrency, formatAmount } from '@/lib/currency';
import { formatExpiryDate } from '@/lib/format';
import { setHead } from '@/lib/head';
import { getListing, getGlobalSellerListings } from '@/lib/api';
import ListingCode from '@/components/ListingCode';
import { getListingManagementCode, PRIVATE_LISTING_CODE_LABEL } from '@/lib/listing-codes';

function formatPublicListingNumber(value) {
  const digits = String(value ?? '').padStart(16, '0');
  return digits.match(/.{1,4}/g)?.join(' ') ?? digits;
}

export default function ListingDetail() {
  const location = useLocation();
  const requestedBackTo = location.state?.backTo || '/browse';
  const requestedManagementView = requestedBackTo.startsWith('/manage/');
  const [isOwnedListing, setIsOwnedListing] = useState(false);
  const isManagementView = requestedManagementView || isOwnedListing;
  const backTo = requestedBackTo;
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [removed, setRemoved] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    setIsOwnedListing(false);
    (async () => {
      try {
        const l = await getListing(id);
        let managedListing = requestedManagementView ? location.state?.managedListing : null;
        const globalKey = sessionStorage.getItem('sobs_global_user_key');
        if (globalKey && sessionStorage.getItem('sobs_seller_session_token')) {
          try {
            const data = await getGlobalSellerListings(globalKey);
            const ownedListing = (data.listings || []).find(
              item =>
                String(item.id) === String(id) ||
                String(item.listing_alias) === String(l.listing_alias) ||
                String(item.listing_number) === String(l.listing_number)
            );
            if (ownedListing) {
              managedListing = ownedListing;
              if (!requestedManagementView) setIsOwnedListing(true);
            }
          } catch {
            // A public listing remains viewable if the optional ownership check fails.
          }
        }
        if (managedListing) l.key_token = getListingManagementCode(managedListing);
        if (l.grey_zone || new Date(l.expires_date).getTime() <= Date.now()) {
          setRemoved(true);
        }
        setListing(l);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, location.state, requestedManagementView]);

  useEffect(() => {
    if (!listing) return;
    const cat = listing.categoryPath || '';
    setHead(
      `${listing.title}${cat ? ' â€” ' + cat : ''} | S.O.B.S.`,
      `${listing.title}${cat ? ' in ' + cat : ''}. ${(listing.description || '').slice(0, 120)}`.slice(0, 160)
    );
  }, [listing]);

  const images = listing?.images || [];
  const cur = getCurrency(listing?.currency);
  const isUnavailable =
    removed || (listing && (listing.grey_zone || new Date(listing.expires_date).getTime() <= Date.now()));

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link to={backTo} className="inline-flex items-center gap-1 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
          <ArrowLeft className="h-4 w-4" /> Back to listings
        </Link>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !listing ? (
          <div className="py-20 text-center">
            <p className="text-lg font-medium">This listing is no longer available.</p>
            <Link to="/browse" className="mt-4 inline-block rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white">
              Browse listings
            </Link>
          </div>
        ) : isUnavailable ? (
          <div className="py-20 text-center">
            <p className="text-lg font-medium">This listing is no longer available.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              It has expired and is in the recovery window, or was removed by the community.
            </p>
            <Link to="/browse" className="mt-4 inline-block rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white">
              Browse listings
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <div className="overflow-hidden rounded-xl border border-white bg-card">
              <div className="flex justify-end p-3">
              {!isManagementView && (
                <button
                  type="button"
                  onClick={() => setChatOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
                >
                  <MessageCircle className="h-4 w-4" />
                  Chat with seller
                </button>
              )}
            </div>
            {images.length > 0 && (
                <div className="grid grid-cols-3 gap-1 bg-muted">
                  {images.map((src, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setGalleryIndex(i)}
                      className={`block aspect-square w-full ${images.length === 1 ? 'col-span-3 aspect-video' : ''}`}
                    >
                      <Image src={src} alt={`${listing.title} ${i + 1}`} className="h-full w-full" fittingType="fill" />
                    </button>
                  ))}
                </div>
              )}
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <h1 className="min-w-0 flex-1 font-display text-2xl tracking-tight">{listing.title}</h1>
                  {!requestedManagementView && (
                    <div className="shrink-0">
                      <FlagButton listing={listing} onRemoved={() => setRemoved(true)} />
                    </div>
                  )}
                </div>

                <div className="mt-3">
                  <ListingCode
                    label={isManagementView ? 'Public Listing Code:' : 'Listing'}
                    value={formatPublicListingNumber(listing.listing_alias)}
                    copyValue={String(listing.listing_alias).padStart(16, '0')}
                    className="text-sm"
                    compact
                  />
                </div>
                {isManagementView && (
                  <div className="mt-0">
                    <ListingCode
                      label={PRIVATE_LISTING_CODE_LABEL}
                      value={getListingManagementCode(listing) || getListingManagementCode(location.state?.managedListing)}
                      className="text-sm"
                      compact
                    />
                  </div>
                )}
              </div>
            </div>

            {listing.description && (
              <div className="rounded-xl border border-white bg-card p-5">
                <p className="whitespace-pre-wrap text-white">{listing.description}</p>
              </div>
            )}

            {!isManagementView && <ChatThread listingId={listing.id} />}
          </div>
        )}
      </div>

      {chatOpen && !isManagementView && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setChatOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Chat with seller"
            className="relative w-full max-w-lg rounded-xl bg-card p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close chat"
              onClick={() => setChatOpen(false)}
              className="absolute right-3 top-3 rounded-full p-2 text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mb-4 pr-10 text-lg font-semibold">Chat with seller</div>
            <ChatThread listingId={listing.id} />
          </div>
        </div>
      )}
      {galleryIndex !== null && images.length > 0 && (
        <FullScreenGallery
          images={images}
          startIndex={galleryIndex}
          onClose={() => setGalleryIndex(null)}
        />
      )}
    </div>
  );
}





