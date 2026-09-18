import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import NavBar from '@/components/NavBar';
import ListingCard from '@/components/ListingCard';
import { runLifecycle } from '@/lib/lifecycle';
import { Loader2, Plus, PackageOpen } from 'lucide-react';

export default function Listings() {
  const [listings, setListings] = useState(null);

  useEffect(() => {
    (async () => {
      await runLifecycle();
      const nowIso = new Date().toISOString();
      const active = await base44.entities.Listing.filter(
        { grey_zone: false, status: 'active', expires_date: { $gte: nowIso } },
        '-created_date',
        100
      );
      setListings(active);
    })();
  }, []);

  const removeListing = (id) =>
    setListings((prev) => (prev ? prev.filter((l) => l.id !== id) : prev));

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl tracking-tight">Browse listings</h1>
            <p className="mt-1 text-muted-foreground">Everything for sale right now.</p>
          </div>
          <Link
            to="/create"
            className="inline-flex items-center gap-1 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            <Plus className="h-4 w-4" /> Post
          </Link>
        </div>

        <div className="mt-8">
          {listings === null ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
              <PackageOpen className="h-10 w-10 text-muted-foreground" />
              <p className="mt-3 font-medium">No listings yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Be the first to post something.</p>
              <Link
                to="/create"
                className="mt-4 inline-flex items-center gap-1 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white"
              >
                <Plus className="h-4 w-4" /> Post a listing
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {listings.map((l) => (
                <ListingCard key={l.id} listing={l} onRemoved={removeListing} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}