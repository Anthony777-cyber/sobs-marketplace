import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import NavBar from '@/components/NavBar';
import PaymentTier from '@/components/PaymentTier';
import { CURRENCIES, fetchRates, getCurrency, formatAmount } from '@/lib/currency';
import { formatUkDate } from '@/lib/format';
import { setHead } from '@/lib/head';
import { Loader2, Lock } from 'lucide-react';

// Account-free management view. Enter a valid key token to unlock the edit
// form and pricing-reactivation trigger for that one listing row only.
export default function Manage() {
  const [keyInput, setKeyInput] = useState('');
  const [listing, setListing] = useState(null);
  const [status, setStatus] = useState('idle');
  const [rates, setRates] = useState(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [tier, setTier] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchRates().then(setRates).catch(() => {});
  }, []);

  useEffect(() => {
    setHead('Manage Listing — S.O.B.S.', 'Enter your key code to edit or renew your S.O.B.S. listing.');
  }, []);

  const unlock = async () => {
    const code = keyInput.trim();
    if (!code) return;
    setStatus('searching');
    setListing(null);
    try {
      const matches = await base44.entities.Listing.filter({ key_token: code }, '-created_date', 1);
      if (!matches.length) {
        setStatus('notfound');
        return;
      }
      const l = matches[0];
      setListing(l);
      setTitle(l.title || '');
      setDescription(l.description || '');
      setPrice(l.price != null ? String(l.price) : '');
      setCurrency(l.currency || 'EUR');
      setTier(null);
      setStatus('found');
    } catch (e) {
      console.error(e);
      setStatus('notfound');
    }
  };

  const saveEdits = async () => {
    if (!listing) return;
    setSaving(true);
    setMsg('');
    try {
      await base44.entities.Listing.update(listing.id, {
        title,
        description,
        price: Number(price),
        currency,
      });
      setMsg('Listing updated.');
    } catch (e) {
      console.error(e);
      setMsg('Update failed.');
    } finally {
      setSaving(false);
    }
  };

  const renew = async () => {
    if (!listing || !tier) return;
    setSaving(true);
    setMsg('');
    try {
      const base = Math.max(Date.now(), new Date(listing.expires_date).getTime());
      const expires = new Date(base + tier.months * 30 * 24 * 60 * 60 * 1000).toISOString();
      await base44.entities.Listing.update(listing.id, {
        duration_months: tier.months,
        payment_amount: tier.amount,
        expires_date: expires,
        grey_zone: false,
        status: 'active',
      });
      setListing({ ...listing, expires_date: expires, duration_months: tier.months, payment_amount: tier.amount });
      setMsg('Listing renewed.');
    } catch (e) {
      console.error(e);
      setMsg('Renewal failed.');
    } finally {
      setSaving(false);
    }
  };

  const cur = getCurrency(currency);

  return (
    <div className="min-h-screen bg-black text-white">
      <NavBar />
      <div className="mx-auto max-w-xl px-4 py-12">
        <h1 className="font-display text-3xl tracking-tight">Manage Listing</h1>

        {status !== 'found' && (
          <div className="mt-8">
            <div className="flex items-center gap-2 rounded-lg border border-white/20 bg-black px-3 py-2.5 font-mono text-sm text-white/80">
              <span className="whitespace-nowrap">[ ENTER YOUR KEY CODE:</span>
              <input
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && unlock()}
                placeholder="SOBS-0000-X"
                className="w-full bg-transparent font-mono text-white outline-none placeholder:text-white/30"
              />
              <span className="whitespace-nowrap">]</span>
            </div>
            <button
              onClick={unlock}
              disabled={status === 'searching'}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 font-semibold text-black hover:bg-white/90 disabled:opacity-50"
            >
              {status === 'searching' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Unlock
            </button>
            {status === 'notfound' && (
              <p className="mt-4 text-sm text-red-400">No listing matches that key code.</p>
            )}
          </div>
        )}

        {status === 'found' && listing && (
          <div className="mt-8 space-y-6">
            <div className="rounded-xl border border-white/15 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">Key</p>
              <p className="mt-1 font-display text-2xl">{listing.key_token}</p>
              <p className="mt-1 text-sm text-white/60">Expires: {formatUkDate(listing.expires_date)}</p>
            </div>

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
                rows={4}
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
                  <p className="mt-1 text-xs text-white/50">Displayed as {formatAmount(Number(price), cur)} {currency}</p>
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
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save edits
            </button>

            <div className="rounded-xl border border-white/15 p-4">
              <h2 className="font-display text-lg">Reactivate / Renew pricing</h2>
              <p className="mt-1 text-xs text-white/50">Extend this listing's duration. Adds to the current expiry.</p>
              <div className="mt-3">
                <PaymentTier value={tier} onChange={setTier} currency={currency} rates={rates} />
              </div>
              <button
                onClick={renew}
                disabled={saving || !tier}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Renew listing
              </button>
            </div>

            {msg && <p className="text-sm text-white/70">{msg}</p>}
          </div>
        )}
      </div>
    </div>
  );
}