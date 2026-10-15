import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import { getGlobalSellerListings } from '@/lib/api';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function SelectRenewListing() {
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
        <div className="mx-auto w-[90vw] max-w-none px-4 pt-[15vh] pb-12">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <NavBar />
      <div className="mx-auto w-[90vw] max-w-none px-4 pt-[15vh] pb-12">
        <div className="mb-8 flex items-start justify-between gap-4">
          <h1 className="font-display text-3xl tracking-tight">Renew Listing</h1>
          <button
            onClick={() => navigate('/manage/console')}
            className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 font-semibold text-black hover:bg-red-500"
          >
            <ArrowLeft className="h-4 w-4" />
            Exit
          </button>
        </div>

        <div className="mt-8 grid grid-cols-[repeat(10,minmax(0,1fr))] gap-2">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="flex min-w-0 flex-col items-start gap-3 rounded-xl border border-white/15 p-3"
            >
              <div>
                <p className="font-semibold break-words">{listing.title}</p>
                <p className="text-sm text-white/60">Listing #{listing.listing_number}</p>
              </div>

              <button
                onClick={() => {
                  sessionStorage.setItem(
                    'sobs_global_listing_number',
                    String(listing.listing_number)
                  );
                  navigate('/manage/renew-key');
                }}
                className="rounded-full bg-white px-5 py-2.5 font-semibold text-black"
              >
                Renew
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
