import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import { formatUkDate } from '@/lib/format';
import { tokenFileName } from '@/lib/token';
import { setHead } from '@/lib/head';
import { getListing } from '@/lib/api';
import { Loader2, Download } from 'lucide-react';

// Confirmation layout: renders the generated key code in prominent white,
// the UK-word-format expiry date, and a "Save Key to Device" notepad download.
export default function Confirmed() {
  const { id } = useParams();
  const location = useLocation();
  const [listing, setListing] = useState(null);
  const [keyToken, setKeyToken] = useState(location.state?.keyToken || '');
  const [listingNumber, setListingNumber] = useState(location.state?.listingNumber || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const l = await getListing(id);
        setListing(l);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    setHead('Listing Confirmed — S.O.B.S.', 'Your S.O.B.S. listing key and expiry date.');
  }, []);

  const download = () => {
    if (!keyToken) return;
    const expiresDate = new Date(listing.expires_date);
    const deletionDate = new Date(expiresDate);
    deletionDate.setDate(deletionDate.getDate() + 7);

    const content =
      `S.O.B.S Listings ticket\n\n` +
      `${listing.title} — ${listingNumber}\n\n` +
      `Listing created:           ${formatUkDate(listing.created_date)}\n` +
      `Listing expires:            ${formatUkDate(listing.expires_date)}\n` +
      `Listing deletion date:  ${formatUkDate(deletionDate.toISOString())}\n\n` +
      `INDIVIDUAL LISTING MANAGEMENT CODE\n\n` +
      `${keyToken}\n\n` +
      `IMPORTANT — KEEP THIS CODE SAFE.\n\n` +
      `AS YOU WILL NEED THIS CODE TO MANAGE, EDIT AND RENEW THIS LISTING.\n\n` +
      `LOSE IT AND YOU WILL NOT BE ABLE TO EDIT, MANAGE OR RENEW THE LISTING\n` +
      `AS THIS TICKET WILL NOT BE REISSUED FOR SECURITY PURPOSES\n`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = tokenFileName(keyToken);
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <NavBar />
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        {loading ? (
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-white/60" />
        ) : !listing ? (
          <p className="text-white/70">Listing not found.</p>
        ) : (
          <>
            <h1 className="font-display text-3xl tracking-tight">Listing live</h1>
            <p className="mt-2 text-sm text-white/60">Save this key. You'll need it to edit or renew.</p>
            <p className="mt-8 font-mono text-xs uppercase tracking-[0.3em] text-white/40">Your key code</p>
            <p className="mt-3 font-display text-5xl tracking-tight text-white">{keyToken}</p>
            <p className="mt-4 text-sm text-white/70">
              Listing expires: {formatUkDate(listing.expires_date)}
            </p>
            <button
              onClick={download}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-black hover:bg-white/90"
            >
              <Download className="h-4 w-4" /> Save Key to Device
            </button>
            <div className="mt-8 flex justify-center gap-4 text-sm">
              <Link to="/manage" className="text-white/70 hover:text-white">Manage listing →</Link>
              <Link to="/listings" className="text-white/70 hover:text-white">Browse listings</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}