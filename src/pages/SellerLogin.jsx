import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { sellerLogout } from '@/lib/api';

const INPUT_CLASS =
  'w-full rounded-lg border-2 border-white bg-black px-3 py-2.5 text-white outline-none placeholder:text-gray-400 focus:ring-0';

const BUTTON_CLASS =
  'rounded-full bg-red-600 px-5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-40';

export default function SellerLogin() {
  const navigate = useNavigate();

  const [sellerId, setSellerId] = useState('');
  const [loginSecret, setLoginSecret] = useState('');
  const [showLoginSecret, setShowLoginSecret] = useState(false);
  const [status, setStatus] = useState('idle');
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState('');

  function storeSellerSession(enteredSellerId, data) {
    sessionStorage.setItem('sobs_seller_id', enteredSellerId);
    // The console key is the seller's S.O.B.S. ID; the login secret remains separate.
    sessionStorage.setItem('sobs_global_user_key', enteredSellerId);
    sessionStorage.setItem('sobs_seller_session_token', data.sessionToken);
    sessionStorage.setItem('sobs_seller_session_expires_at', data.expiresAt);
    // Keep only the expiring seller session credentials, never either secret.
    localStorage.setItem('sobs_seller_id', enteredSellerId);
    if (import.meta.env.DEV) {
      localStorage.setItem('sobs_global_user_key', enteredSellerId);
    } else {
      localStorage.removeItem('sobs_global_user_key');
    }
    localStorage.setItem('sobs_seller_session_token', data.sessionToken);
    localStorage.setItem('sobs_seller_session_expires_at', data.expiresAt);
  }

  async function handleLocalDevelopmentLogin() {
    if (!import.meta.env.DEV || status === 'logging-in') return;

    setStatus('logging-in');
    setError('');

    try {
      const response = await fetch('/api/seller/dev-login', { method: 'POST' });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success || !data?.sellerId || !data?.sessionToken) {
        setError(data?.error || 'Local development login is unavailable.');
        setStatus('error');
        return;
      }

      storeSellerSession(data.sellerId, data);
      setStatus('success');
    } catch {
      setError('Could not connect to the local development server.');
      setStatus('error');
    }
  }

  async function handleLogin(event) {
    event.preventDefault();

    if (status === 'logging-in' || attempts >= 5) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const enteredSellerId = String(formData.get('username') || sellerId).replace(/\D/g, '').trim();
    const enteredSecret = String(formData.get('password') || loginSecret).replace(/\D/g, '').trim();

    if (!/^\d{16}$/.test(enteredSellerId) || !/^\d{16}$/.test(enteredSecret)) {
      setError('Enter your 16-digit S.O.B.S ID and login secret.');
      return;
    }

    setStatus('logging-in');
    setError('');

    try {
      const response = await fetch('/api/seller/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sellerId: enteredSellerId,
          loginSecret: enteredSecret,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success || !data?.sessionToken) {
        const nextAttempts = attempts + 1;
        setAttempts(nextAttempts);
        setLoginSecret('');
        setError(

          data?.locked || nextAttempts >= 5
            ? 'Too many attempts. Restart S.O.B.S. to try again.'
            : (data?.error || 'Login failed. Check your S.O.B.S ID and login secret.')
        );
        setStatus('error');
        return;
      }

      storeSellerSession(enteredSellerId, data);
      setStatus('success');
    } catch {
      setError('Could not connect to S.O.B.S. Please try again.');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-background">
        <main className="mx-auto max-w-2xl px-4 pt-[25vh] pb-10">
          <h1 className="font-display text-3xl tracking-tight">
            Seller login
          </h1>

          <div className="mt-8 rounded-xl border border-green-500/40 bg-green-500/5 p-6">
            <p className="font-semibold">
              You are logged in.
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Your S.O.B.S seller session has been established.
            </p>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className={BUTTON_CLASS}
            >
              Done
            </button>

            <button
              type="button"
              onClick={async () => {
                await sellerLogout();
                setStatus('idle');
              }}
              className={BUTTON_CLASS}
            >
              Log out
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-2xl px-4 pt-[25vh] pb-10">
        <h1 className="font-display text-3xl tracking-tight">
          Seller login
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Use your S.O.B.S ID and your separate login secret.
        </p>

        <form onSubmit={handleLogin} autoComplete="on" className="mt-8 space-y-5">
          <div>
            <label htmlFor="seller-login-username" className="mb-1 block text-sm font-medium">
              Your S.O.B.S ID
            </label>
            <input
              id="seller-login-username"
              name="username"
              type="text"
              inputMode="numeric"
              autoComplete="username"
              autoCapitalize="off"
              spellCheck={false}
              maxLength={16}
              value={sellerId}
              onChange={(e) => {
                setSellerId(e.target.value.replace(/\D/g, ''));
                setError('');
              }}
              placeholder="16-digit S.O.B.S ID"
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label htmlFor="seller-login-password" className="mb-1 block text-sm font-medium">
              Login secret
            </label>
            <div className="relative">
              <input
                id="seller-login-password"
                name="password"
                type={showLoginSecret ? 'text' : 'password'}
                inputMode="numeric"
                autoComplete="current-password"
                maxLength={16}
                value={loginSecret}
                onChange={(e) => {
                  setLoginSecret(e.target.value.replace(/\D/g, ''));
                  setError('');
                }}
                placeholder="16-digit login secret"
                className={`${INPUT_CLASS} pr-12`}
              />
              <button
                type="button"
                aria-label={showLoginSecret ? 'Hide login secret' : 'Show login secret'}
                aria-controls="seller-login-password"
                aria-pressed={showLoginSecret}
                onClick={() => setShowLoginSecret((visible) => !visible)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-300 hover:text-white"
              >
                {showLoginSecret ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={status === 'logging-in' || attempts >= 5}
              className={BUTTON_CLASS}
            >
              {status === 'logging-in' ? 'Logging in...' : 'Log in'}
            </button>

            {import.meta.env.DEV && (
              <button
                type="button"
                onClick={handleLocalDevelopmentLogin}
                disabled={status === 'logging-in'}
                className={BUTTON_CLASS}
              >
                {status === 'logging-in' ? 'Logging in...' : 'Local development login'}
              </button>
            )}

            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-full border-2 border-white px-5 py-1.5 text-sm font-medium transition-colors hover:bg-foreground/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Back
            </Link>

            <button
              type="button"
              onClick={async () => {
                await sellerLogout();
                setSellerId('');
                setLoginSecret('');
                setStatus('idle');
                setAttempts(0);
                setError('');
              }}
              className={BUTTON_CLASS}
            >
              Log out
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
