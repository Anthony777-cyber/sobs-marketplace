import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import { ArrowLeft } from 'lucide-react';
import { verifyGlobalListingKey } from '@/lib/api';

const MAX_ATTEMPTS = 5;

export default function RenewListingKey() {
  const navigate = useNavigate();
  const globalKey = sessionStorage.getItem('sobs_global_user_key');
  const listingNumber = sessionStorage.getItem('sobs_global_listing_number');
  const [listingKey, setListingKey] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();

    if (!globalKey || !listingNumber || attempts >= MAX_ATTEMPTS) return;

    try {
      await verifyGlobalListingKey(globalKey, listingNumber, listingKey.trim());
      sessionStorage.setItem('sobs_global_listing_verified', listingNumber);
      navigate('/manage/renew');
    } catch {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      setListingKey('');
      setError(nextAttempts >= MAX_ATTEMPTS ? 'Too many attempts. Restart S.O.B.S. to try again.' : 'Wrong key code');
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <NavBar />

      <div className="mx-auto max-w-xl px-4 pt-[15vh] pb-12">
        <div className="mb-6 flex flex-wrap items-center gap-16">
          <h1 className="font-display text-3xl tracking-tight">Renew Listing</h1>
          <button
            onClick={() => navigate('/manage/console')}
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-sm font-medium text-black hover:bg-red-500"
          >
            <ArrowLeft className="management-exit-icon h-3.5 w-3.5" />
            Exit
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-8">
          <p className="font-semibold">Enter your listing key</p>

          <input
            type="text"
            autoComplete="off"
            value={listingKey}
            onChange={(event) => {
              setListingKey(event.target.value);
              setError('');
            }}
            className="mt-3 w-full rounded border border-white/30 bg-white px-4 py-3 text-black outline-none focus:border-white"
          />

          <button
            type="submit"
            disabled={attempts >= MAX_ATTEMPTS}
            className="mt-5 inline-flex rounded-full bg-white px-6 py-2.5 font-semibold text-black hover:bg-white/90 disabled:opacity-50"
          >
            Continue
          </button>

          {error && (
            <p className="mt-4 text-sm text-red-500">{error}</p>
          )}
        </form>

      </div>
    </div>
  );
}
