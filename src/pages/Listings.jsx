import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import ListingCard from '@/components/ListingCard';
import { getListings } from '@/lib/api';
import { Plus, PackageOpen, Loader2 } from 'lucide-react';

export default function Listings() {
  const [listings, setListings] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getListings()
      .then(data => { if (!cancelled) setListings(Array.isArray(data) ? data : []); })
      .catch(() => {
        if (!cancelled) {
          setError('Listings could not be loaded. Please try again.');
          setListings([]);
        }
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl tracking-tight">Browse listings</h1>
            <p className="mt-1 text-muted-foreground">Everything for sale right now.</p>
            <Link to="/categories" className="mt-2 inline-block text-sm underline underline-offset-4">Open Registry directory</Link>
          </div>
          <Link to="/sifter" className="inline-flex items-center gap-1 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
            <Plus className="h-4 w-4" /> Post
          </Link>
        </div>

        <div className="mt-8">
          {listings === null ? (
            <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
              <PackageOpen className="h-10 w-10 text-muted-foreground" />
              <p className="mt-3 font-medium">{error ? 'Listings unavailable' : 'No listings yet'}</p>
              <p className="mt-1 text-sm text-muted-foreground">{error || 'Be the first to post something.'}</p>
              {!error && <Link to="/sifter" className="mt-4 inline-flex items-center gap-1 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> Create a listing</Link>}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {listings.map(listing => <ListingCard key={listing.id} listing={listing} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
