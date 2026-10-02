import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import FlagButton from '@/components/FlagButton';
import ChatThread from '@/components/ChatThread';
import FullScreenGallery from '@/components/FullScreenGallery';
import { Image } from '@/components/ui/image';
import { ArrowLeft, Copy, Loader2 } from 'lucide-react';
import { getCurrency, formatAmount } from '@/lib/currency';
import { formatExpiryDate } from '@/lib/format';
import { setHead } from '@/lib/head';
import { getListing } from '@/lib/api';

function formatPublicListingNumber(value) {
  const digits = String(value ?? '').padStart(16, '0');
  return digits.match(/.{1,4}/g)?.join(' ') ?? digits;
}

export default function ListingDetail() {
  const location = useLocation();
  const backTo = location.state?.backTo || '/browse';
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [removed, setRemoved] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const l = await getListing(id);
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
  }, [id]);

  useEffect(() => {
    if (!listing) return;
    const cat = listing.categoryPath || '';
    setHead(
      `${listing.title}${cat ? ' — ' + cat : ''} | S.O.B.S.`,
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
        <Link to={backTo} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
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
            <div className="overflow-hidden rounded-xl border bg-card">
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
                <h1 className="font-display text-2xl tracking-tight">{listing.title}</h1>

                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
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
                    className="inline-flex items-center gap-1 rounded border px-2 py-1 hover:text-foreground"
                    title="Copy listing number"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                {listing.description && (
                  <p className="mt-4 whitespace-pre-wrap text-muted-foreground">{listing.description}</p>
                )}
                <div className="mt-5">
                  <FlagButton listing={listing} onRemoved={() => setRemoved(true)} />
                </div>
              </div>
            </div>

            <ChatThread listingId={listing.id} />
          </div>
        )}
      </div>

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