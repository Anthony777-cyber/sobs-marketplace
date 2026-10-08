import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import PaymentTier from '@/components/PaymentTier';
import PaylinkGateway from '@/components/PaylinkGateway';
import { fetchRates } from '@/lib/currency';
import { formatUkDate } from '@/lib/format';
import { useCurrency } from '@/lib/CurrencyContext';
import { setHead } from '@/lib/head';
import { getManageListing, getGlobalManageListing } from '@/lib/api';
import { Loader2, ArrowLeft } from 'lucide-react';

const KEY_STORAGE = 'sobs_management_key';
const GLOBAL_KEY_STORAGE = 'sobs_global_user_key';

export default function RenewListing() {
  const navigate = useNavigate();
  const key = sessionStorage.getItem(KEY_STORAGE);
  const globalKey = sessionStorage.getItem(GLOBAL_KEY_STORAGE);

  const [listing, setListing] = useState(null);
  const [rates, setRates] = useState(null);
  const { currency } = useCurrency();
  const [tier, setTier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [showGateway, setShowGateway] = useState(false);

  useEffect(() => {
    setHead('Renew Listing — S.O.B.S.', 'Renew your S.O.B.S. listing.');

    fetchRates().then(setRates).catch(() => {});

    if (!key && !globalKey) {
      navigate('/manage-listings', { replace: true });
      return;
    }

    const selectedListingNumber = sessionStorage.getItem(
      'sobs_global_listing_verified'
    );

    const lookup = globalKey
      ? getGlobalManageListing(globalKey, selectedListingNumber)
      : getManageListing(key);

    lookup
      .then(setListing)
      .catch(() => {
        sessionStorage.removeItem(KEY_STORAGE);
        sessionStorage.removeItem(GLOBAL_KEY_STORAGE);
        navigate(globalKey ? '/manage-listings' : '/manage', { replace: true });
      })
      .finally(() => setLoading(false));
  }, [key, navigate]);

  const renew = () => {
    if (!listing || !tier) return;
    setShowGateway(true);
  };

  const confirmRenewal = async () => {
    setSaving(true);
    setMsg('');
    setSaving(false);
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

      <div className="mx-auto max-w-xl px-4 py-12">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="font-display text-3xl tracking-tight">
            Renew Listing
          </h1>
          <button
            onClick={() => navigate('/manage/console')}
            className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 font-semibold text-black hover:bg-red-500"
          >
            <ArrowLeft className="h-4 w-4" />
            Exit
          </button>
        </div>

        <div className="mt-6 rounded-xl border border-white/15 p-4">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">
            Listing
          </p>
          <p className="mt-1 font-display text-2xl">
            #{listing.listing_number}
          </p>
          <p className="mt-1 text-sm text-white/60">
            Expires: {formatUkDate(listing.expires_date)}
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-white/15 p-4">
          <h2 className="font-display text-lg">Choose duration</h2>
          <p className="mt-1 text-xs text-white/50">
            Renewal is separate from editing and adds to the current expiry.
          </p>

          <div className="mt-4">
            <PaymentTier
              value={tier}
              onChange={setTier}
              currency={currency}
              rates={rates}
            />
          </div>

          <button
            onClick={renew}
            disabled={saving || !tier}
            className={`mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-semibold disabled:opacity-50 ${
              tier?.months === 3
                ? 'bg-white text-black hover:bg-white/90'
                : tier?.months === 6
                  ? 'bg-orange-500 text-black hover:bg-orange-400'
                  : tier?.months === 9
                    ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                    : tier?.months === 12
                      ? 'bg-black text-white hover:bg-black'
                      : 'bg-red-600 text-black hover:bg-red-700'
            }`}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Renew listing
          </button>

          {msg && (
            <p className="mt-4 text-sm text-white/70">
              {msg}
            </p>
          )}
        </div>
      </div>
      {showGateway && (
        <PaylinkGateway
          tier={tier}
          currency={currency}
          rates={rates}
          busy={saving}
          onConfirm={confirmRenewal}
          onClose={() => setShowGateway(false)}
        />
      )}

    </div>
  );
}
