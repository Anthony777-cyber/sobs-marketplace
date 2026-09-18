import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getCurrency, roundUp } from '@/lib/currency';

// Full-screen Brutalist Paylink Gateway.
// Edge-to-edge black canvas, bright white text, massive typography.
// Zero-fee direct-bank + native crypto architecture (no card processor skim).
function moneyLine(amount, code, rates) {
  const cur = getCurrency(code);
  if (code === 'EUR') return `€${amount.toFixed(2)} EUR`;
  const r = rates && rates[code];
  if (!r) return null;
  const val = roundUp(amount * r, cur.decimals);
  const str = cur.decimals === 0 ? String(val) : val.toFixed(cur.decimals);
  return `${cur.symbol}${str} ${code}`;
}

export default function PaylinkGateway({ tier, currency, rates, busy, onConfirm, onClose }) {
  const amount = tier.amount;
  const stack = ['EUR', 'USD', 'GBP', currency]
    .filter((c, i, arr) => arr.indexOf(c) === i)
    .map((c) => moneyLine(amount, c, rates))
    .filter(Boolean);

  const [iban, setIban] = useState('');
  const [wallet, setWallet] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white">
      {/* Header / price */}
      <div className="px-6 pt-8 sm:px-12">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/50">
          S.O.B.S. Paylink Gateway
        </p>
        <h1 className="mt-3 font-display text-4xl leading-none sm:text-6xl">
          {stack.join(' / ')}
        </h1>
        <p className="mt-2 font-mono text-sm text-white/50">{tier.label} listing duration</p>
      </div>

      {/* Notice box */}
      <div className="mt-6 px-6 sm:px-12">
        <div className="border border-white/40 p-4">
          <p className="text-xs uppercase tracking-wide text-white/80 sm:text-sm">
            ★ You are never paying more than the set flat amount to S.O.B.S., any fees or incurred
            costs arising from your payment method are yours to bear.
          </p>
        </div>
      </div>

      {/* Payment panels */}
      <div className="mt-6 grid flex-1 grid-cols-1 gap-4 px-6 sm:grid-cols-2 sm:px-12">
        <div className="flex flex-col border border-white/40 p-6">
          <h2 className="font-display text-2xl tracking-tight">BANK TRANSFER</h2>
          <p className="mt-2 text-sm text-white/60">
            Enter your account identifier to launch your secure bank app
          </p>
          <input
            value={iban}
            onChange={(e) => setIban(e.target.value)}
            placeholder="Type IBAN or Account Number..."
            className="mt-4 w-full border border-white/40 bg-black px-4 py-4 font-mono text-sm outline-none placeholder:text-white/30 focus:border-white"
          />
        </div>
        <div className="flex flex-col border border-white/40 p-6">
          <h2 className="font-display text-2xl tracking-tight">CRYPTO</h2>
          <p className="mt-2 text-sm text-white/60">
            We accept any shitcoin to the value of the price of your ad.
          </p>
          <input
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            placeholder="insert wallet address"
            className="mt-4 w-full border border-white/40 bg-black px-4 py-4 font-mono text-sm outline-none placeholder:text-white/30 focus:border-white"
          />
        </div>
      </div>

      {/* Footer action bar */}
      <div className="flex items-center justify-end gap-3 border-t border-white/20 px-6 py-4 sm:px-12">
        <button
          onClick={onClose}
          className="rounded-full border border-white px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
        >
          CANCEL
        </button>
        <button
          onClick={onConfirm}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-white/90 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'CONFIRM PROCESSING'}
        </button>
      </div>
    </div>
  );
}