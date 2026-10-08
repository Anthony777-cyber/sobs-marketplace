import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MAX_ATTEMPTS = 5;

export default function GlobalManagementConsole() {
  const navigate = useNavigate();
  const [userKey, setUserKey] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sessionStorage.getItem('sobs_seller_session_token')) navigate('/seller-login', { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (!sessionStorage.getItem('sobs_seller_session_token')) {
      navigate('/seller-login', { replace: true });
    }
  }, [navigate]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (attempts >= MAX_ATTEMPTS) return;

    const code = userKey.trim();

    try {
      const res = await fetch('/api/manage/global/verify', {
        method: 'POST',
        headers: {
          'X-SOBS-Global-Key': code,
        },
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Wrong key');

      sessionStorage.setItem('sobs_global_user_key', code);
      sessionStorage.removeItem('sobs_global_listing_id');
      sessionStorage.removeItem('sobs_global_listing_number');

      navigate('/manage/console');
    } catch {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      setUserKey('');
      setError(nextAttempts >= MAX_ATTEMPTS ? 'Too many attempts. Restart S.O.B.S. to try again.' : 'Wrong key');

      if (nextAttempts >= MAX_ATTEMPTS) {
        sessionStorage.removeItem('sobs_global_user_key');
      }
    }
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-bold">Manage Listings</h1>

        <form onSubmit={handleSubmit} className="mt-8">
          <p className="font-semibold">
            Input user code to open management console
          </p>

          <input
            type="password"
            inputMode="numeric"
            name="password"
            autoComplete="current-password"
            value={userKey}
            onChange={(event) => {
              setUserKey(event.target.value);
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
            <p className="mt-4 text-sm text-red-500">
              {error}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
