import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import { verifyGlobalListingKey } from '@/lib/api';

const MAX_ATTEMPTS = 5;

export default function EditListingKey() {
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
      await verifyGlobalListingKey(
        globalKey,
        listingNumber,
        listingKey.trim()
      );

      sessionStorage.setItem(
        'sobs_global_listing_verified',
        listingNumber
      );

      navigate('/manage/edit');
    } catch {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      setListingKey('');
      setError(nextAttempts >= MAX_ATTEMPTS ? 'Too many attempts. Restart S.O.B.S. to try again.' : 'Wrong key code');
    }
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <NavBar />

      <div className="mx-auto max-w-xl py-12">
        <p className="font-semibold">Enter your listing key</p>

        <form onSubmit={handleSubmit} className="mt-3">
          <input
            type="text"
            autoComplete="off"
            value={listingKey}
            onChange={(event) => {
              setListingKey(event.target.value);
              setError('');
            }}
            className="w-full rounded border border-white/30 bg-white px-4 py-3 text-black outline-none focus:border-white"
          />

          <button
            type="submit"
            disabled={attempts >= MAX_ATTEMPTS}
            className="mt-5 rounded-full bg-white px-6 py-2.5 font-semibold text-black disabled:opacity-50"
          >
            Continue
          </button>

          {error && (
            <p className="mt-4 text-sm text-red-500">
              {error}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
