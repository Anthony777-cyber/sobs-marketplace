import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import { formatUkDate } from '@/lib/format';
import { getManageListing, getGlobalManageListing } from '@/lib/api';
import { setHead } from '@/lib/head';
import { Loader2, Pencil, RefreshCw, ExternalLink, LogOut, MessageCircle, Upload } from 'lucide-react';
import ListingCode from '@/components/ListingCode';
import { getListingManagementCode, PRIVATE_LISTING_CODE_LABEL } from '@/lib/listing-codes';

const KEY_STORAGE = 'sobs_management_key';
const GLOBAL_KEY_STORAGE = 'sobs_global_user_key';

export default function ManagementConsole() {
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);

  const key = sessionStorage.getItem(KEY_STORAGE);
  const globalKey = sessionStorage.getItem(GLOBAL_KEY_STORAGE);

  useEffect(() => {
    setHead(
      'Management Console — S.O.B.S.',
      'Manage your S.O.B.S. listing.'
    );

    if (!sessionStorage.getItem('sobs_seller_session_token')) {
      navigate('/seller-login', { replace: true, state: { returnTo: '/manage-listings' } });
      return;
    }

    if (!globalKey || sessionStorage.getItem('sobs_management_unlocked') !== 'true') {
      navigate('/manage-listings', { replace: true });
      return;
    }

    setLoading(false);
    if (false) {
    getManageListing(key)
      .then(setListing)
      .catch(() => {
        sessionStorage.removeItem(KEY_STORAGE);
        navigate('/manage', { replace: true });
      })
      .finally(() => setLoading(false));
    }
  }, [globalKey, navigate]);

  const logout = () => {
    // Exit the console without clearing the verified management key.
    // sessionStorage keeps access for this browser tab and clears on tab/browser-session end.
    sessionStorage.removeItem(KEY_STORAGE);
    sessionStorage.removeItem('sobs_global_listing_id');
    sessionStorage.removeItem('sobs_global_listing_number');
    navigate('/', { replace: true });
  };

  const chooseGlobalListing = async (action) => {
    if (!globalKey) return;

    const listingNumber = window.prompt('Enter listing number');

    if (!listingNumber) return;

    setLoading(true);

    try {
      const selected = await getGlobalManageListing(globalKey, listingNumber.trim());

      sessionStorage.setItem('sobs_global_listing_id', selected.id);
      sessionStorage.setItem('sobs_global_listing_number', String(selected.listing_number));

      setListing(selected);

      if (action === 'edit') {
        navigate('/manage/edit');
      } else if (action === 'renew') {
        navigate('/manage/renew');
      } else if (action === 'view') {
        navigate(`/listings/${selected.id}`, {
          state: { backTo: '/manage/console', managedListing: selected },
        });
      }
    } catch {
      window.alert('Listing not found.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <NavBar />
        <div className="mx-auto max-w-xl px-4 pt-[15vh] pb-12">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      </div>
    );
  }

  if (globalKey && !listing) {
    return (
      <div className="min-h-screen bg-black text-white">
        <NavBar />

        <div className="mx-auto max-w-2xl px-4 pt-[15vh] pb-12">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h1 className="font-display text-3xl tracking-tight">
              Management Console
            </h1>

            <button
              onClick={logout}
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-sm font-medium text-black hover:bg-red-500"
            >
              <LogOut className="h-3.5 w-3.5" />
              Exit
            </button>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => navigate('/manage/edit-listings')}
              className="relative flex items-center justify-center rounded-xl border-4 border-white p-5 text-center hover:border-white"
            >
              <Pencil className="absolute left-8 h-10 w-10" />
              <span className="relative left-6 w-full">
                <span className="block font-semibold">Edit Listing</span>
                <span className="mt-1 block text-sm text-white">
                  Select a listing to edit.
                </span>
              </span>
            </button>

            <button
              onClick={() => navigate('/manage/renew-listings')}
              className="relative flex items-center justify-center rounded-xl border-4 border-white p-5 text-center hover:border-white"
            >
              <RefreshCw className="absolute left-8 h-10 w-10" />
              <span className="relative left-6 w-full text-center">
                <span className="block font-semibold">Renew Listing</span>
                <span className="mt-1 block text-sm text-white">
                  Select a listing to renew.
                </span>
              </span>
            </button>

            <button
              onClick={() => navigate('/manage/view-listings')}
              className="relative flex items-center justify-center rounded-xl border-4 border-white p-5 text-center hover:border-white"
            >
              <ExternalLink className="absolute left-8 h-10 w-10" />
              <span className="relative left-6 w-full">
                <span className="block font-semibold">View Listing</span>
                <span className="mt-1 block text-sm text-white">
                  Select a listing to view.
                </span>
              </span>
            </button>

            <button
              onClick={() => navigate('/manage/chats')}
              className="relative flex items-center justify-center rounded-xl border-4 border-white p-5 text-center hover:border-white"
            >
              <MessageCircle className="absolute left-8 h-10 w-10" />
              <span className="relative left-6 w-full">
                <span className="block font-semibold">Chat</span>
                <span className="mt-1 block text-sm text-white">
                  Read all your buyer chats here.
                </span>
              </span>
            </button>
            <button
              onClick={() => navigate('/manage/bulk-upload')}
              className="relative flex items-center justify-center rounded-xl border-4 border-white p-5 text-center hover:border-white"
            >
              <Upload className="absolute left-8 h-10 w-10" />
              <span className="relative left-6 w-full">
                <span className="block font-semibold">Bulk Uploads</span>
                <span className="mt-1 block text-sm text-white">
                  Upload multiple listings from a spreadsheet.
                </span>
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) return null;

  return (
    <div className="min-h-screen bg-black text-white">
      <NavBar />

      <div className="mx-auto max-w-2xl px-4 pt-[15vh] pb-12">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="font-display text-3xl tracking-tight">
            Management Console
          </h1>

          <button
            onClick={logout}
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-sm font-medium text-black hover:bg-red-500"
          >
            <LogOut className="h-3.5 w-3.5" />
            Exit
          </button>
        </div>

        <div className="mt-8 rounded-xl border-4 border-white p-5 text-center">
          <p className="relative left-6 font-mono text-xs uppercase tracking-[0.2em] text-white">
            Listing
          </p>
          <h2 className="relative left-6 mt-1 font-display text-2xl">
            #{listing.listing_number}
          </h2>
          <div className="relative left-6 mt-2">
            <ListingCode label={PRIVATE_LISTING_CODE_LABEL} value={getListingManagementCode(listing)} className="text-xs justify-center" />
          </div>
          <p className="relative left-6 mt-1 text-white">{listing.title}</p>
          <p className="relative left-6 mt-2 text-sm text-white">
            Expires: {formatUkDate(listing.expires_date)}
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => navigate('/manage/edit')}
            className="relative flex items-center justify-center rounded-xl border-4 border-white p-5 text-center hover:border-white"
          >
            <Pencil className="absolute left-8 h-10 w-10" />
            <span className="relative left-6 w-full">
              <span className="block font-semibold">Edit Listing</span>
              <span className="mt-1 block text-sm text-white">
                Change title, description, price or currency.
              </span>
            </span>
          </button>

          <button
            onClick={() => navigate('/manage/renew')}
            className="relative flex items-center justify-center rounded-xl border-4 border-white p-5 text-center hover:border-white"
          >
            <RefreshCw className="absolute left-8 h-10 w-10" />
            <span className="relative left-6 w-full">
              <span className="block font-semibold">Renew Listing</span>
              <span className="mt-1 block text-sm text-white">
                Extend the listing duration.
              </span>
            </span>
          </button>

          <button
            onClick={() => navigate(`/listings/${listing.id}`, {
              state: { backTo: '/manage/view-listings', managedListing: listing },
            })}
            className="relative flex items-center justify-center rounded-xl border-4 border-white p-5 text-center hover:border-white"
          >
            <ExternalLink className="absolute left-8 h-10 w-10" />
            <span className="relative left-6 w-full">
              <span className="block font-semibold">View Listing</span>
              <span className="mt-1 block text-sm text-white">
                Open the public listing.
              </span>
            </span>
          </button>

          <div className="rounded-xl border-4 border-white p-5 text-center">
            <p className="relative left-6 font-semibold">Listing Status</p>
            <p className="relative left-6 mt-1 text-sm text-white">
              {listing.active ? 'Active' : 'Inactive'}
            </p>
            <p className="relative left-6 mt-1 text-sm text-white">
              Expires {formatUkDate(listing.expires_date)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
