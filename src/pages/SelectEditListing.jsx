import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import ListingCard from '@/components/ListingCard';
import { getGlobalSellerListings, getListing } from '@/lib/api';
import { DEV_PREVIEW_LISTINGS } from '@/lib/dev-preview-listings';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function SelectEditListing({ preview = false }) {
  const navigate = useNavigate();
  const isPreview = import.meta.env.DEV && preview;
  const globalKey = sessionStorage.getItem('sobs_global_user_key');
  const [listings, setListings] = useState(isPreview ? DEV_PREVIEW_LISTINGS : []);
  const [loading, setLoading] = useState(!isPreview);

  useEffect(() => {
    if (isPreview) return;

    if (!sessionStorage.getItem('sobs_seller_session_token')) {
      navigate('/seller-login', { replace: true });
      return;
    }

    if (!globalKey) {
      navigate('/manage-listings', { replace: true });
      return;
    }

    getGlobalSellerListings(globalKey)
      .then(async (data) => {
        const privateListings = data.listings || [];
        const listingsWithPublicImages = await Promise.all(
          privateListings.map(async (listing) => {
            try {
              const publicListing = await getListing(listing.id);
              return {
                ...listing,
                images: publicListing.images || listing.images,
              };
            } catch {
              return listing;
            }
          })
        );
        setListings(listingsWithPublicImages);
      })
      .catch(() => navigate('/manage/console', { replace: true }))
      .finally(() => setLoading(false));
  }, [globalKey, isPreview, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <NavBar />
        <div className="mx-auto w-full px-4 pt-6 pb-12 sm:w-[90vw] sm:pt-[15vh]">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <NavBar />
      <div className="mx-auto w-full px-4 pt-6 pb-12 sm:w-[90vw] sm:pt-[15vh]">
        <div className="mb-6 flex flex-wrap items-center gap-4 sm:gap-16">
          <h1 className="font-display text-2xl tracking-tight sm:text-3xl">
            Edit Listing
          </h1>
          <button
            onClick={() => navigate('/manage/console')}
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-sm font-medium text-black hover:bg-red-500"
          >
            <ArrowLeft className="management-exit-icon h-3.5 w-3.5" />
            Exit
          </button>
        </div>
        <p className="mt-1 text-muted-foreground">Listings available to edit.</p>

        {listings.length > 0 ? (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-10">
            {listings.map((listing) => (
              <div key={listing.id} className="min-w-0 w-full">
                <ListingCard listing={listing} backTo="/manage/edit-listings" useDirectImages showPublicNumber={false} contentClassName="py-4" />
                <button
                  type="button"
                  onClick={() => {
                    sessionStorage.setItem(
                      'sobs_global_listing_number',
                      String(listing.listing_number)
                    );
                    navigate('/manage/edit-key');
                  }}
                  className="mt-2 rounded-full bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-dashed py-20 text-center">
            <p className="font-medium">No listings yet</p>
          </div>
        )}

      </div>
    </div>
  );
}
