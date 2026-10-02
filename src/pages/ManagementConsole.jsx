import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import { formatUkDate } from '@/lib/format';
import { getManageListing } from '@/lib/api';
import { setHead } from '@/lib/head';
import { Loader2, Pencil, RefreshCw, ExternalLink, LogOut } from 'lucide-react';

const KEY_STORAGE = 'sobs_management_key';

export default function ManagementConsole() {
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);

  const key = sessionStorage.getItem(KEY_STORAGE);

  useEffect(() => {
    setHead(
      'Management Console — S.O.B.S.',
      'Manage your S.O.B.S. listing.'
    );

    if (!key) {
      navigate('/manage', { replace: true });
      return;
    }

    getManageListing(key)
      .then(setListing)
      .catch(() => {
        sessionStorage.removeItem(KEY_STORAGE);
        navigate('/manage', { replace: true });
      })
      .finally(() => setLoading(false));
  }, [key, navigate]);

  const logout = () => {
    sessionStorage.removeItem(KEY_STORAGE);
    navigate('/manage', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <NavBar />
        <div className="mx-auto max-w-xl px-4 py-12">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      </div>
    );
  }

  if (!listing) return null;

  return (
    <div className="min-h-screen bg-black text-white">
      <NavBar />

      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">
              S.O.B.S.
            </p>
            <h1 className="mt-1 font-display text-3xl tracking-tight">
              Management Console
            </h1>
          </div>

          <button
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-white/70 hover:border-white/40 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Exit
          </button>
        </div>

        <div className="mt-8 rounded-xl border border-white/15 p-5">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">
            Listing
          </p>
          <h2 className="mt-1 font-display text-2xl">
            #{listing.listing_number}
          </h2>
          <p className="mt-1 text-white/80">{listing.title}</p>
          <p className="mt-2 text-sm text-white/50">
            Expires: {formatUkDate(listing.expires_date)}
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => navigate('/manage/edit')}
            className="flex items-center gap-3 rounded-xl border border-white/15 p-5 text-left hover:border-white/40"
          >
            <Pencil className="h-5 w-5" />
            <span>
              <span className="block font-semibold">Edit Listing</span>
              <span className="mt-1 block text-sm text-white/50">
                Change title, description, price or currency.
              </span>
            </span>
          </button>

          <button
            onClick={() => navigate('/manage/renew')}
            className="flex items-center gap-3 rounded-xl border border-white/15 p-5 text-left hover:border-white/40"
          >
            <RefreshCw className="h-5 w-5" />
            <span>
              <span className="block font-semibold">Renew Listing</span>
              <span className="mt-1 block text-sm text-white/50">
                Extend the listing duration.
              </span>
            </span>
          </button>

          <button
            onClick={() => navigate(`/listings/${listing.id}`)}
            className="flex items-center gap-3 rounded-xl border border-white/15 p-5 text-left hover:border-white/40"
          >
            <ExternalLink className="h-5 w-5" />
            <span>
              <span className="block font-semibold">View Listing</span>
              <span className="mt-1 block text-sm text-white/50">
                Open the public listing.
              </span>
            </span>
          </button>

          <div className="rounded-xl border border-white/15 p-5">
            <p className="font-semibold">Listing Status</p>
            <p className="mt-1 text-sm text-white/50">
              {listing.active ? 'Active' : 'Inactive'}
            </p>
            <p className="mt-1 text-sm text-white/40">
              Expires {formatUkDate(listing.expires_date)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
