import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import ListingCard from '@/components/ListingCard';
import { getGlobalSellerListings, getListing, deleteGlobalListing } from '@/lib/api';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function ViewSellerListings() {
  const navigate = useNavigate();
  const globalKey = sessionStorage.getItem('sobs_global_user_key');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, [globalKey, navigate]);

  const handleDelete = (listing) => {
    sessionStorage.setItem('sobs_global_delete_listing_id', String(listing.id));
    sessionStorage.setItem(
      'sobs_global_delete_listing_number',
      String(listing.listing_number ?? listing.listing_alias ?? '')
    );

    navigate('/manage/delete-listing', {
      state: { listing },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <NavBar />
        <div className="mx-auto max-w-xl px-4 pt-[25vh] pb-12">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <NavBar />

      <div className="mx-auto max-w-xl px-4 pt-[25vh] pb-12">
        <div className="mb-6 flex items-start justify-between gap-4">
          <h1 className="font-display text-3xl tracking-tight">Your Listings</h1>
          <button
            onClick={() => navigate('/manage/console')}
            className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 font-semibold text-black hover:bg-red-500"
          >
            <ArrowLeft className="h-4 w-4" />
            Exit
          </button>
        </div>
        <p className="mt-1 text-muted-foreground">
          Everything you currently have for sale.
        </p>

        {listings.length > 0 ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <div key={listing.id}>
                <ListingCard listing={listing} backTo="/manage/view-listings" useDirectImages />
                <button
                  type="button"
                  onClick={() => handleDelete(listing)}
                  className="mt-2 rounded-full bg-red-600 px-5 py-2.5 font-semibold text-white hover:bg-red-700"
                >
                  Delete Listing
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
