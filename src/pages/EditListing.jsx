import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import { CURRENCIES, getCurrency, formatAmount } from '@/lib/currency';
import { formatUkDate } from '@/lib/format';
import { useCurrency } from '@/lib/CurrencyContext';
import { setHead } from '@/lib/head';
import { getManageListing, updateListing } from '@/lib/api';
import { Loader2, ArrowLeft } from 'lucide-react';

const KEY_STORAGE = 'sobs_management_key';

export default function EditListing() {
  const navigate = useNavigate();
  const key = sessionStorage.getItem(KEY_STORAGE);

  const [listing, setListing] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const { currency, setCurrency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setHead('Edit Listing — S.O.B.S.', 'Edit your S.O.B.S. listing.');

    if (!key) {
      navigate('/manage', { replace: true });
      return;
    }

    getManageListing(key)
      .then((data) => {
        setListing(data);
        setTitle(data.title || '');
        setDescription(data.description || '');
        setPrice(data.price ?? '');
        if (data.currency) setCurrency(data.currency);
      })
      .catch(() => {
        sessionStorage.removeItem(KEY_STORAGE);
        navigate('/manage', { replace: true });
      })
      .finally(() => setLoading(false));
  }, [key, navigate, setCurrency]);

  const saveEdits = async () => {
    if (!listing || !key) return;

    setSaving(true);
    setMsg('');

    try {
      const updated = await updateListing(listing.id, key, {
        title,
        description,
        price,
        currency,
      });

      setListing(updated);
      setMsg('Listing saved.');
    } catch {
      setMsg('Could not save listing.');
    } finally {
      setSaving(false);
    }
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

  const cur = getCurrency(currency);

  return (
    <div className="min-h-screen bg-black text-white">
      <NavBar />

      <div className="mx-auto max-w-xl px-4 py-12">
        <button
          onClick={() => navigate('/manage/console')}
          className="mb-6 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Management Console
        </button>

        <h1 className="font-display text-3xl tracking-tight">Edit Listing</h1>

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

        <div className="mt-6 space-y-5">
          <div>
            <label className="text-sm font-medium">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-white/20 bg-black px-3 py-2.5 outline-none focus:ring-2 focus:ring-white/40"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="mt-1.5 w-full rounded-lg border border-white/20 bg-black px-3 py-2.5 outline-none focus:ring-2 focus:ring-white/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Price</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-white/20 bg-black px-3 py-2.5 outline-none focus:ring-2 focus:ring-white/40"
              />
              {price && (
                <p className="mt-1 text-xs text-white/50">
                  Displayed as {formatAmount(Number(price), cur)} {currency}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-white/20 bg-black px-3 py-2.5 outline-none focus:ring-2 focus:ring-white/40"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={saveEdits}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-semibold text-black hover:bg-white/90 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save edits
          </button>

          {msg && <p className="text-sm text-white/70">{msg}</p>}
        </div>
      </div>
    </div>
  );
}
