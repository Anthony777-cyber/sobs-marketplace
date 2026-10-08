import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sellerLogout } from '@/lib/api';

const INPUT_CLASS =
  'w-full rounded-lg border-2 border-white bg-black px-3 py-2.5 text-white outline-none placeholder:text-gray-400 focus:ring-0';

const BUTTON_CLASS =
  'rounded-full bg-red-600 px-6 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40';

export default function SellerLogin() {
  const navigate = useNavigate();

  const [sellerId, setSellerId] = useState('');
  const [loginSecret, setLoginSecret] = useState('');
  const [status, setStatus] = useState('idle');
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState('');

  const ready =
    /^\d{16}$/.test(sellerId.trim()) &&
    /^\d{16}$/.test(loginSecret.trim());

  async function handleLogin(event) {
    event.preventDefault();

    if (!ready || status === 'logging-in' || attempts >= 5) {
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
          sellerId: sellerId.trim(),
          loginSecret: loginSecret.trim(),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success || !data?.sessionToken) {
        const nextAttempts = attempts + 1;
        setAttempts(nextAttempts);
        setError(

          data?.locked || nextAttempts >= 5
            ? 'Too many attempts. Restart S.O.B.S. to try again.'
            : (data?.error || 'Login failed. Check your S.O.B.S ID and login secret.')
        );
        setStatus('error');
        return;
      }

      sessionStorage.setItem('sobs_seller_id', sellerId.trim());
      sessionStorage.setItem('sobs_global_user_key', sellerId.trim());
      sessionStorage.setItem('sobs_seller_session_token', data.sessionToken);
      sessionStorage.setItem('sobs_seller_session_expires_at', data.expiresAt);

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
              className="rounded-full border border-foreground/30 px-6 py-2.5 font-semibold transition-colors hover:bg-foreground/5"
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

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Your S.O.B.S ID
            </label>
            <input
              name="username"
              inputMode="numeric"
              autoComplete="username"
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
            <label className="mb-1 block text-sm font-medium">
              Login secret
            </label>
            <input
              name="password"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              maxLength={16}
              value={loginSecret}
              onChange={(e) => {
                setLoginSecret(e.target.value.replace(/\D/g, ''));
                setError('');
              }}
              placeholder="16-digit login secret"
              className={INPUT_CLASS}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!ready || status === 'logging-in' || attempts >= 5}
            className={BUTTON_CLASS}
          >
            {status === 'logging-in' ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full border border-foreground/30 px-6 py-2.5 font-semibold transition-colors hover:bg-foreground/5"
          >
            Back
          </Link>
        </div>
      </main>
    </div>
  );
}
