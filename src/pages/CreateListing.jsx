import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import NavBar from '@/components/NavBar';
import PaymentTier from '@/components/PaymentTier';
import TagInput from '@/components/TagInput';
import PaylinkGateway from '@/components/PaylinkGateway';
import { generateKeyToken } from '@/lib/token';
import { CURRENCIES, fetchRates, getCurrency, formatAmount } from '@/lib/currency';
import { getSessionId } from '@/lib/user';
import { Loader2, Plus, X } from 'lucide-react';

const MAX_PHOTOS = 3;
const DRAFT_KEY = 'sobs_create_draft';

export default function CreateListing() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [rates, setRates] = useState(null);
  const [categoryPath, setCategoryPath] = useState('');
  const [photos, setPhotos] = useState([]);
  const [tier, setTier] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showGateway, setShowGateway] = useState(false);

  useEffect(() => {
    fetchRates()
      .then(setRates)
      .catch(() => setRates(null));
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (typeof d.title === 'string') setTitle(d.title);
      if (typeof d.description === 'string') setDescription(d.description);
      if (d.price != null) setPrice(String(d.price));
      if (d.currency) setCurrency(d.currency);
      if (typeof d.categoryPath === 'string') setCategoryPath(d.categoryPath);
      if (Array.isArray(d.photos)) setPhotos(d.photos);
      if (d.tier) setTier(d.tier);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ title, description, price, currency, categoryPath, photos, tier })
      );
    } catch {}
  }, [title, description, price, currency, categoryPath, photos, tier]);

  const cur = getCurrency(currency);

  const onAddPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file || photos.length >= MAX_PHOTOS) {
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhotos((prev) => [...prev, reader.result]);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removePhoto = (i) => setPhotos(photos.filter((_, idx) => idx !== i));

  const submit = () => {
    if (!canSubmit) return;
    setShowGateway(true);
  };

  const confirmAndCreate = async () => {
    setSubmitting(true);
    setError('');
    try {
      const normalizedPath = categoryPath.trim().replace(/^\/+|\/+\$/g, '');
      const expires = new Date(Date.now() + tier.months * 30 * 24 * 60 * 60 * 1000).toISOString();
      let token = generateKeyToken();

      const created = await base44.entities.Listing.create({
        id: 'item_' + Math.random().toString(36).slice(2) + Date.now(),
        title,
        description,
        price: Number(price),
        currency,
        images: [...photos], // Photos are safely stored directly alongside your listing
        categoryPath: normalizedPath,
        duration_months: tier.months,
        payment_amount: tier.amount,
        expires_date: expires,
        flags: 0,
        status: 'active',
        grey_zone: false,
        seller_id: getSessionId(),
        key_token: token,
      });

      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {}
      navigate(`/confirmed/${created.id}`);
    } catch (e) {
      console.error(e);
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  const canSubmit = title && price && tier && categoryPath.trim() && !submitting;

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="font-display text-3xl tracking-tight">Post your junk</h1>
        <p className="mt-1 text-muted-foreground">List it, pick how long it stays up, and you're live.</p>
        <div className="mt-8 space-y-6">
          <div>
            <label className="text-sm font-medium">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Ford Escort 1994 gearbox"
              className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Maker, model, year, part no, condition..."
              className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
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
                    {c.code}   {c.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">Manual   no geo-tracking.</p>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Photos (max {MAX_PHOTOS})</label>
            <div className="mt-1.5 flex flex-wrap gap-3">
              {photos.map((file, i) => (
                <div key={i} className="relative">
                  <img src={file} alt={`preview ${i + 1}`} className="h-24 w-24 rounded-lg border object-cover" />
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
                  <input type="file" accept="image/*" className="hidden" onChange={onAddPhoto} />
                </label>
              )}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Category path</label>
            <TagInput value={categoryPath} onChange={setCategoryPath} />
          </div>
          <div>
            <label className="text-sm font-medium">How long should it stay up?</label>
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
              `Post listing${tier ? `   \${cur.symbol}tier.amount {currency}` : ''}`
            )}
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
