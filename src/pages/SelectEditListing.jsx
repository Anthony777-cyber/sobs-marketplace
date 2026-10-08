import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import { getGlobalSellerListings } from '@/lib/api';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function SelectEditListing() {
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
      .then((data) => setListings(data.listings || []))
      .catch(() => navigate('/manage/console', { replace: true }))
      .finally(() => setLoading(false));
  }, [globalKey, navigate]);

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
      <div className="mx-auto max-w-2xl px-4 pt-[25vh] pb-12">
        <div className="mb-8 flex items-start justify-between gap-4">
          <h1 className="font-display text-3xl tracking-tight">
            Edit Listing
          </h1>
          <button
            onClick={() => navigate('/manage/console')}
            className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 font-semibold text-black hover:bg-red-500"
          >
            <ArrowLeft className="h-4 w-4" />
            Exit
          </button>
        </div>

        <div className="mt-8 space-y-3">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="flex items-center gap-8 rounded-xl border border-white/15 p-5"
            >
              <div>
                <p className="font-display text-xl">
                  #{listing.listing_number}
                </p>
                <p className="text-white/70">{listing.title}</p>
              </div>

              <button
                onClick={() => {
                  sessionStorage.setItem(
                    'sobs_global_listing_number',
                    String(listing.listing_number)
                  );
                  navigate('/manage/edit-key');
                }}
                className="rounded-full bg-white px-5 py-2.5 font-semibold text-black"
              >
                Edit
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
