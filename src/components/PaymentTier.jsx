import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCurrency, roundUp } from '@/lib/currency';

const TIERS = [
  { amount: 1, months: 3, label: '3 MONTHS', colour: 'bg-white text-black border-black' },
  { amount: 2, months: 6, label: '6 MONTHS', colour: 'bg-orange-500 text-black border-orange-600' },
  { amount: 3, months: 9, label: '9 MONTHS', colour: 'bg-yellow-400 text-black border-yellow-500' },
  { amount: 4, months: 12, label: '1 YEAR', colour: 'bg-black text-white border-black' },
];

export default function PaymentTier({ value, onChange, currency = 'EUR', rates = null }) {
  const cur = getCurrency(currency);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {TIERS.map((tier) => {
        const selected = value?.months === tier.months;
        const rate = currency === 'EUR' ? 1 : Number(rates?.[currency] || 0);
        const local = rate
          ? roundUp(tier.amount * rate, cur.decimals)
          : null;
        const localStr = local == null
          ? '...'
          : cur.decimals === 0
            ? String(local)
            : local.toFixed(cur.decimals);

        return (
          <button
            type="button"
            key={tier.months}
            onClick={() => onChange(tier)}
            className={cn(
              'relative rounded-xl border-2 p-4 text-left transition-all',
              tier.colour,
              selected && 'ring-4 ring-foreground/30'
            )}
          >
            <div className="text-xl font-bold">
              {cur.symbol}{localStr} {currency}
            </div>

            <div className="mt-1 text-base font-bold tracking-wide">
              {tier.label}
            </div>

            {selected && <Check className="absolute right-1 top-3 h-5 w-5" />}
          </button>
        );
      })}
    </div>
  );
}
