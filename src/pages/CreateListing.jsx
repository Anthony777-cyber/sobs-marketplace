import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import CategoryQuestionFlow from '@/components/CategoryQuestionFlow';
import PaymentTier from '@/components/PaymentTier';
import PaylinkGateway from '@/components/PaylinkGateway';
import { generateKeyToken } from '@/lib/token';
import { CURRENCIES, fetchRates, getCurrency, formatAmount, roundUp } from '@/lib/currency';
import { getEntryTicket, saveEntryCurrency } from '@/lib/entryTicket';
import { useCurrency } from '@/lib/CurrencyContext';
import { Image as ImageIcon, Loader2, Plus, X } from 'lucide-react';

const MAX_PHOTOS = 3;
const DRAFT_KEY = 'sobs_create_draft';

export default function CreateListing() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const { currency, setCurrency } = useCurrency();
  const [rates, setRates] = useState(null);
  const [categoryPath, setCategoryPath] = useState('');
  const [photos, setPhotos] = useState([]);
  const [tier, setTier] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sellerId, setSellerId] = useState('');
  const [showGateway, setShowGateway] = useState(false);
  const [showCategoryFlow, setShowCategoryFlow] = useState(false);
  const [categoryFlow, setCategoryFlow] = useState({
    step: 0,
    complete: false,
    answers: {
      type: '',
      maker: '',
      model: '',
      year: '',
      part: '',
    },
    extra: '',
  });

  useEffect(() => {
    const globalKey = sessionStorage.getItem('sobs_global_user_key')?.trim();

    if (!globalKey) {
      setError('Verified seller authentication required.');
      return;
    }

    fetch('/api/seller/me', {
      headers: { 'X-SOBS-Global-Key': globalKey },
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || 'Seller authentication failed.');
        setSellerId(String(data.sellerId || ''));
      })
      .catch((e) => {
        setSellerId('');
        setError(e instanceof Error ? e.message : 'Seller authentication failed.');
      });

    fetchRates()
      .then(setRates)
      .catch(() => setRates(null));

    getEntryTicket()
      .then(({ currency: savedCurrency }) => {
        if (savedCurrency) setCurrency(savedCurrency);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    saveEntryCurrency(currency).catch(() => {});
  }, [currency]);

  // Anti-blit persistent form state cache: hydrate the draft on mount so a
  // failed submission, payment loop, or accidental navigation never wipes input.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (typeof d.title === 'string') setTitle(d.title);
      if (typeof d.description === 'string') setDescription(d.description);
      if (d.price != null) setPrice(String(d.price));
        if (typeof d.categoryPath === 'string') {
        setCategoryPath(d.categoryPath);
      }
      if (d.categoryFlow && typeof d.categoryFlow === 'object') {
        setCategoryFlow(d.categoryFlow);
      }
      if (Array.isArray(d.photos)) setPhotos(d.photos);
      if (d.tier) setTier(d.tier);
    } catch {}
  }, []);

  // Freeze every input into the cache until the submission is confirmed server-side.
  useEffect(() => {
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          title,
          description,
          price,
          currency,
          categoryPath,
          photos,
          tier,
          categoryFlow,
        })
      );
    } catch {}
  }, [title, description, price, currency, categoryPath, photos, tier, categoryFlow]);

  const cur = getCurrency(currency);
  const selectedTierAmount = tier && rates
    ? roundUp(
        tier.amount * (currency === 'EUR' ? 1 : Number(rates?.[currency] || 0)),
        cur.decimals
      )
    : null;

  const finishCategoryFlow = (flow) => {
    const clean = (value) => String(value || '').trim().replace(/\s+/g, ' ');
    const firstCap = (value) => {
      const text = clean(value);
      return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
    };

    const parts = [
      firstCap(flow.answers?.type),
      firstCap(flow.answers?.maker),
      firstCap(flow.answers?.model),
      clean(flow.answers?.year),
      firstCap(flow.answers?.part),
      clean(flow.extra),
    ].filter(Boolean);

    setCategoryFlow(flow);
    setCategoryPath(parts.join('/'));
    setShowCategoryFlow(false);
  };


  const onAddPhoto = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || photos.length >= MAX_PHOTOS) {
      e.target.value = '';
      return;
    }

    const remaining = MAX_PHOTOS - photos.length;
    const selected = files.slice(0, remaining);

    selected.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotos((prev) => {
          if (prev.length >= MAX_PHOTOS) return prev;
          return [...prev, reader.result];
        });
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };
  const removePhoto = (i) => setPhotos(photos.filter((_, idx) => idx !== i));

  const resetListing = () => {
    localStorage.removeItem(DRAFT_KEY);
    window.location.reload();
  };

  const submit = () => {
    if (!canSubmit) return;
    confirmAndCreate();
  };

  const confirmAndCreate = async () => {
    const globalKey = sessionStorage.getItem('sobs_global_user_key')?.trim();
    if (!globalKey || !sellerId) {
      setError('Verified seller authentication required.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SOBS-Global-Key': globalKey,
        },
        body: JSON.stringify({
          title,
          description,
          price: Number(price),
          currency,
          categoryPath,
          images: photos,
          months: tier.months,
          paymentAmount: tier.amount,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || `Listing creation failed: ${res.status}`);
      }

      localStorage.removeItem(DRAFT_KEY);
      navigate(`/confirmed/${data.listing.id}`, {
        state: { keyToken: data.listing.keyToken, listingNumber: data.listing.listingNumber },
      });
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Listing creation failed.');
      setSubmitting(false);
    }
  };

  const canSubmit = sellerId && title && price && tier && categoryPath.trim() && !submitting;

  const gbpEquivalent = (() => {
    const amount = Number(price);
    if (!Number.isFinite(amount) || amount <= 0 || !rates?.GBP) return null;

    if (currency === 'GBP') return amount;

    if (currency === 'EUR') return amount * Number(rates.GBP);

    const sourceRate = Number(rates[currency]);
    if (!sourceRate) return null;

    return (amount / sourceRate) * Number(rates.GBP);
  })();

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="font-display text-3xl tracking-tight">Post your junk</h1>
        <p className="mt-1 text-muted-foreground">List it, pick how long it stays up, and you're live.</p>

        <div className="mt-8 space-y-6">
          {!categoryFlow.complete ? (
            <div className="rounded-xl border p-5">
              <h2 className="text-lg font-semibold">Let’s get started</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                A few quick questions help buyers find your listing.
              </p>
              <button
                type="button"
                onClick={() => setShowCategoryFlow(true)}
                className="mt-4 rounded-full bg-red-600 px-6 py-2.5 font-semibold text-white"
              >
                {categoryFlow.step > 0 ? 'Continue' : 'Let’s get started'}
              </button>
            </div>
          ) : (
            <>
              <div>
                <label className="text-sm font-medium">Title <span className="ml-1 text-xs font-normal text-muted-foreground">Keep it brief, Brevity is the soul of wit.</span></label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Your listing title"
                  className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowCategoryFlow(true)}
                  className="mt-2 text-xs text-muted-foreground underline underline-offset-4"
                >
                  Review questions
                </button>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Tell buyers anything useful about it..."
                  className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
              />
              {price && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Displayed as {formatAmount(Number(price), cur)} {currency}
                  {gbpEquivalent != null && currency !== 'GBP' && (
                    <> · ≈ {formatAmount(gbpEquivalent, getCurrency('GBP'))} GBP</>
                  )}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">Manual — no geo-tracking.</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">
              Photos (max {MAX_PHOTOS}) <span className="ml-1 text-xs font-normal text-muted-foreground">Press ctrl, to select all three at once.</span>
            </label>
            <div className="mt-1.5 flex flex-wrap gap-3">
              {photos.map((file, i) => (
                <div key={i} className="relative">
                  <img
                    src={file}
                    alt={`preview ${i + 1}`}
                    className="h-24 w-24 rounded-lg border object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground hover:bg-muted/50">
                  <Plus className="h-5 w-5" />
                  <span className="mt-1 text-xs">Add photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={onAddPhoto}
                  />
                </label>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">How long should it stay up?</label>
            <p className="mt-1 text-xs text-muted-foreground">
              Pick a duration — your listing auto-deletes when it expires.
            </p>
            <div className="mt-3">
              <PaymentTier value={tier} onChange={setTier} currency={currency} rates={rates} />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            onClick={submit}
            disabled={!canSubmit}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-40"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              `Post listing${tier && selectedTierAmount != null ? ` · ${cur.symbol}${selectedTierAmount.toFixed(cur.decimals)} ${currency}` : ''}`
            )}
          </button>

          <button
            type="button"
            onClick={resetListing}
            className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-red-600 px-5 py-3 font-semibold text-black hover:bg-red-700"
          >
            Reset
          </button>
        </div>

        {showCategoryFlow && (
          <CategoryQuestionFlow
            value={categoryFlow}
            onChange={setCategoryFlow}
            onFinish={finishCategoryFlow}
            onClose={() => setShowCategoryFlow(false)}
          />
        )}

        {showGateway && (
          <PaylinkGateway
            tier={tier}
            currency={currency}
            rates={rates}
            busy={submitting}
            onConfirm={confirmAndCreate}
            onClose={() => setShowGateway(false)}
          />
        )}
      </div>
    </div>
  );
}