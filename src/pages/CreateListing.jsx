import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import PaymentTier from '@/components/PaymentTier';
import PaylinkGateway from '@/components/PaylinkGateway';
import { generateKeyToken } from '@/lib/token';
import { CURRENCIES, fetchRates, getCurrency, formatAmount, roundUp } from '@/lib/currency';
import { getEntryTicket, saveEntryCurrency } from '@/lib/entryTicket';
import { useCurrency } from '@/lib/CurrencyContext';
import { Image as ImageIcon, Loader2, Plus, X } from 'lucide-react';

const MAX_PHOTOS = 3;
const MAX_DESCRIPTION_WORDS = 500;
const countWords = (text) => text.trim() ? text.trim().split(/\s+/).length : 0;
const DRAFT_KEY = 'sobs_create_draft';

export default function CreateListing() {
  const navigate = useNavigate();
  const location = useLocation();
  const sifter = location.state?.sifter || null;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const { currency, setCurrency } = useCurrency();
  const [rates, setRates] = useState(null);
  const [categoryPath, setCategoryPath] = useState('');
  const [photos, setPhotos] = useState([]);
  const [draggedPhotoIndex, setDraggedPhotoIndex] = useState(null);
  const [tier, setTier] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sellerId, setSellerId] = useState('');
  const [showGateway, setShowGateway] = useState(false);

  useEffect(() => {
    const globalKey = sessionStorage.getItem('sobs_global_user_key')?.trim();

    if (!globalKey) {
      setError('Verified seller authentication required.');
      return;
    }

    fetch('/api/seller/me', {
      headers: {
        'X-SOBS-Global-Key': globalKey,
        'X-SOBS-Seller-Session': sessionStorage.getItem('sobs_seller_session_token') || '',
      },
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
    if (sifter && typeof sifter === 'object') {
      const answers = sifter.answers || {};
      const taxonomy = sifter.taxonomy || {};
      setCategoryPath(Array.isArray(taxonomy.path) ? taxonomy.path.join(' / ') : String(taxonomy.family || ''));
      return;
    }
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (typeof d.title === 'string') setTitle(d.title);
      if (typeof d.description === 'string') setDescription(d.description);
      if (d.price != null) setPrice(String(d.price));
      if (typeof d.categoryPath === 'string') setCategoryPath(d.categoryPath);
      if (Array.isArray(d.photos)) setPhotos(d.photos);
      if (d.tier) setTier(d.tier);
    } catch {}
  }, [location.key]);

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
        })
      );
    } catch {}
  }, [title, description, price, currency, categoryPath, photos, tier]);

  const cur = getCurrency(currency);
  const selectedTierAmount = tier && rates
    ? roundUp(
        tier.amount * (currency === 'EUR' ? 1 : Number(rates?.[currency] || 0)),
        cur.decimals
      )
    : null;

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
  const reorderPhotos = (targetIndex) => {
    if (draggedPhotoIndex == null || draggedPhotoIndex === targetIndex) return;
    setPhotos((current) => {
      const reordered = [...current];
      const [photo] = reordered.splice(draggedPhotoIndex, 1);
      reordered.splice(targetIndex, 0, photo);
      return reordered;
    });
    setDraggedPhotoIndex(null);
  };

  const resetListing = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem('sobs_sifter_mk4_draft');
    } catch {}
    navigate('/sifter-mk4?fresh=1', { replace: true });
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
          'X-SOBS-Seller-Session': sessionStorage.getItem('sobs_seller_session_token') || '',
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

  const descriptionWordCount = countWords(description);
  const canSubmit = sellerId && title && price && tier && categoryPath.trim()
    && photos.length > 0
    && descriptionWordCount <= MAX_DESCRIPTION_WORDS
    && !submitting;

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
      <div className="ml-0 mr-auto max-w-2xl px-4 py-10">
        <h1 className="font-display text-3xl tracking-tight">Your Title and Description</h1>

        <div className="mt-8 space-y-6">
          <div>
            <label className="text-sm font-medium"><span className="text-[28px] leading-none">Title</span> <span className="ml-1 text-xs font-normal text-muted-foreground">Keep it brief, Brevity is the soul of wit.</span></label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Your listing title"
              className="mt-1.5 w-full rounded-lg border-2 border-white bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => {
                const next = e.target.value;
                if (countWords(next) <= MAX_DESCRIPTION_WORDS) setDescription(next);
              }}
              rows={6}
              placeholder="Describe your item in your own words."
              className="mt-1.5 w-full rounded-lg border-2 border-white bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {descriptionWordCount} / {MAX_DESCRIPTION_WORDS} words
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-xl border-2 border-white p-3">
            <div>
              <label className="text-sm font-medium">Price</label>
              <div className="relative mt-1.5">
                <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 flex items-center font-medium">
                  {cur.symbol}
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  placeholder="0"
                  className="w-full rounded-lg border-2 border-white bg-background py-2.5 pl-10 pr-3 outline-none focus:ring-2 focus:ring-ring [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </div>
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
                className="mt-1.5 w-full rounded-lg border-2 border-white bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-xl p-3">
            <label className="text-sm font-medium">
              Photos (max {MAX_PHOTOS}) <span className="ml-1 text-xs font-normal text-muted-foreground">Press ctrl, to select all three at once.</span>
            </label>
            <div className="mt-1.5 flex flex-wrap gap-3">
              {photos.map((file, i) => (
                <div
                  key={i}
                  draggable
                  onDragStart={() => setDraggedPhotoIndex(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => reorderPhotos(i)}
                  onDragEnd={() => setDraggedPhotoIndex(null)}
                  className="relative cursor-grab active:cursor-grabbing"
                  title="Drag to reorder photos"
                >
                  <img
                    src={file}
                    alt={`preview ${i + 1}`}
                    className="h-24 w-24 rounded-lg border-2 border-white object-cover"
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
                <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-white text-muted-foreground hover:bg-muted/50">
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

          <div className="rounded-xl p-3">
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
            className="create-abandon-button mt-3 inline-flex w-full items-center justify-center rounded-full bg-red-600 px-5 py-3 font-semibold text-black hover:bg-red-700"
          >
            Abandon
          </button>
        </div>

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
