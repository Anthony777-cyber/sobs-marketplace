import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

const MAX_ATTEMPTS = 5;

export default function GlobalManagementConsole() {
  const navigate = useNavigate();
  const [userKey, setUserKey] = useState('');
  const [showUserKey, setShowUserKey] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (import.meta.env.DEV) return;

    const sellerSession = sessionStorage.getItem('sobs_seller_session_token');
    if (!sellerSession) {
      navigate('/seller-login', { replace: true, state: { returnTo: '/manage-listings' } });
      return;
    }

    const savedKey = sessionStorage.getItem('sobs_global_user_key');
    if (!savedKey) {
      navigate('/seller-login', { replace: true, state: { returnTo: '/manage-listings' } });
      return;
    }

    const managementUnlocked = sessionStorage.getItem('sobs_management_unlocked') === 'true';
    let cancelled = false;
    fetch('/api/manage/global/verify', {
      method: 'POST',
      headers: {
        'X-SOBS-Global-Key': savedKey,
        'X-SOBS-Seller-Session': sellerSession,
      },
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          if (data?.error === 'Seller login required') {
            sessionStorage.removeItem('sobs_seller_session_token');
            sessionStorage.removeItem('sobs_seller_session_expires_at');
            sessionStorage.removeItem('sobs_management_unlocked');
            localStorage.removeItem('sobs_seller_id');
            localStorage.removeItem('sobs_global_user_key');
            localStorage.removeItem('sobs_seller_session_token');
            localStorage.removeItem('sobs_seller_session_expires_at');
            navigate('/seller-login', { replace: true, state: { returnTo: '/manage-listings' } });
          } else {
            sessionStorage.removeItem('sobs_management_unlocked');
            sessionStorage.removeItem('sobs_global_user_key');
            navigate('/manage-listings', { replace: true });
          }
          return;
        }
        if (!cancelled && managementUnlocked) {
          sessionStorage.removeItem('sobs_global_listing_id');
          sessionStorage.removeItem('sobs_global_listing_number');
          navigate('/manage/console', { replace: true });
        }
      })
      .catch(() => {
        if (!cancelled) {
          sessionStorage.removeItem('sobs_management_unlocked');
          navigate('/manage-listings', { replace: true });
        }
      });

    return () => { cancelled = true; };
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
          'X-SOBS-Seller-Session':
            sessionStorage.getItem('sobs_seller_session_token') || '',
        },
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Wrong key');

      sessionStorage.setItem('sobs_global_user_key', code);
      sessionStorage.setItem('sobs_management_unlocked', 'true');
      localStorage.removeItem('sobs_global_user_key');
      sessionStorage.removeItem('sobs_global_listing_id');
      sessionStorage.removeItem('sobs_global_listing_number');

      navigate('/manage/console');
    } catch {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      setUserKey('');
      setShowUserKey(false);
      setError(nextAttempts >= MAX_ATTEMPTS ? 'Too many attempts. Restart S.O.B.S. to try again.' : 'Wrong key');

      if (nextAttempts >= MAX_ATTEMPTS) {
        sessionStorage.removeItem('sobs_global_user_key');
        localStorage.removeItem('sobs_global_user_key');
      }
    }
  }

  return (
    <main className="min-h-screen bg-black text-white p-6 pt-[15vh]">
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-bold">Manage Listings</h1>

        <form onSubmit={handleSubmit} className="mt-8">
          <p className="font-semibold">
            Input user code to open management console
          </p>

          <div className="relative mt-3">
            <input
              id="management-user-code"
              type={showUserKey ? 'text' : 'password'}
              inputMode="numeric"
              pattern="[0-9]*"
              name="management-code"
              autoComplete="off"
              value={userKey}
              onChange={(event) => {
                setUserKey(event.target.value.replace(/\D/g, ''));
                setError('');
              }}
              className="management-code-input w-full rounded border border-white/30 bg-white px-4 py-3 pr-12 text-black outline-none focus:border-white"
            />
            <button
              type="button"
              aria-label={showUserKey ? 'Hide code' : 'Show code'}
              aria-controls="management-user-code"
              aria-pressed={showUserKey}
              onClick={() => setShowUserKey((visible) => !visible)}
              className="management-code-toggle absolute inset-y-0 right-3 flex items-center text-gray-600 hover:text-black"
            >
              {showUserKey ? <Eye size={20} aria-hidden="true" /> : <EyeOff size={20} aria-hidden="true" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={attempts >= MAX_ATTEMPTS}
            className="global-management-key-submit mt-5 inline-flex rounded-full bg-red-600 px-6 py-2.5 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
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
