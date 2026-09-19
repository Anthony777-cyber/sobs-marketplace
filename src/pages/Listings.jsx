import React from 'react';
import { Link } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import { Plus, PackageOpen } from 'lucide-react';

export default function Listings() {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl tracking-tight">Browse listings</h1>
            <p className="mt-1 text-muted-foreground">
              Everything for sale right now.
            </p>
          </div>

          <Link
            to="/create"
            className="inline-flex items-center gap-1 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            <Plus className="h-4 w-4" /> Post
          </Link>
        </div>

        <div className="mt-8">
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
            <PackageOpen className="h-10 w-10 text-muted-foreground" />

            <p className="mt-3 font-medium">No listings yet</p>

            <p className="mt-1 text-sm text-muted-foreground">
              Be the first to post something.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
