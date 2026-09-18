import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import NavBar from '@/components/NavBar';
import ListingCard from '@/components/ListingCard';
import { runLifecycle } from '@/lib/lifecycle';
import { setHead } from '@/lib/head';
import { Loader2, PackageOpen } from 'lucide-react';

// Open-ended registry directory browser. Static folder URLs
// (e.g. /browse/Spares/Ford/Escort/1994/Gearbox) with semantic anchor links.
export default function Browse() {
  const params = useParams();
  const rawPath = decodeURIComponent(params['*'] || '');
  const segments = rawPath.split('/').filter(Boolean);
  const path = segments.join('/').toLowerCase();

  const [listings, setListings] = useState(null);

  useEffect(() => {
    (async () => {
      await runLifecycle();
      const nowIso = new Date().toISOString();
      const all = await base44.entities.Listing.filter(
        { grey_zone: false, status: 'active', expires_date: { $gte: nowIso } },
        '-created_date',
        200
      );
      setListings(all);
    })();
  }, []);

  // SEO: inject path + listing context into <title> and <meta description>
  useEffect(() => {
    const pretty = segments
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' / ');
    setHead(
      pretty ? `${pretty} — S.O.B.S. Directory` : 'Browse Directory — S.O.B.S.',
      pretty
        ? `Listings under ${pretty} on S.O.B.S. Sell old broken stuff — spares, parts and more.`
        : 'Browse the S.O.B.S. open-ended directory of spares, parts and junk for sale.'
    );
  }, [rawPath]);

  const matched = (listings || []).filter((l) => {
    const cp = (l.categoryPath || '').toLowerCase();
    if (!path) return true;
    return cp === path || cp.startsWith(path + '/');
  });

  const removeListing = (id) =>
    setListings((prev) => (prev ? prev.filter((l) => l.id !== id) : prev));

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="font-display text-3xl tracking-tight">Listings</h1>

        {/* Listings under this path */}
        <div className="mt-8">
          {listings === null ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : matched.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
              <PackageOpen className="h-10 w-10 text-muted-foreground" />
              <p className="mt-3 font-medium">No listings here yet</p>
              <Link
                to="/create"
                className="mt-4 inline-flex items-center gap-1 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Post the first one
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {matched.map((l) => (
                <ListingCard key={l.id} listing={l} onRemoved={removeListing} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}