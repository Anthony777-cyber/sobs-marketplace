import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCurrency, roundUp } from '@/lib/currency';

const TIERS = [
  { amount: 1, months: 3, label: '3 Months' },
  { amount: 2, months: 6, label: '6 Months' },
  { amount: 3, months: 9, label: '9 Months' },
  { amount: 4, months: 12, label: '1 Year' },
];

// Priority Pricing Display: chosen local currency first (symbol + code),
// then the fallback conversion stack across EUR / USD / GBP. All conversions
// use the strict round-up (Math.ceil) constraint.
export default function PaymentTier({ value, onChange, currency = 'EUR', rates = null }) {
  const cur = getCurrency(currency);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {TIERS.map((tier) => {
        const selected = value?.months === tier.months;
        const local = rates ? roundUp(tier.amount * (rates[currency] || 1), cur.decimals) : tier.amount;
        const usd = rates ? roundUp(tier.amount * (rates.USD || 1), 2) : null;
        const gbp = rates ? roundUp(tier.amount * (rates.GBP || 1), 2) : null;
        const localStr = cur.decimals === 0 ? String(local) : local.toFixed(cur.decimals);
        return (
          <button
            type="button"
            key={tier.months}
            onClick={() => onChange(tier)}
            className={cn(
              'relative rounded-xl border-2 p-4 text-left transition-all',
              selected
                ? 'border-foreground bg-foreground text-background'
                : 'border-border hover:border-foreground/40 hover:bg-muted/50'
            )}
          >
            <div className="text-2xl font-bold">
              {localStr} {currency}
            </div>
            <div className={cn('mt-1 text-xs', selected ? 'text-background/70' : 'text-muted-foreground')}>
              {tier.label}
            </div>
            <div className={cn('mt-2 text-[11px] leading-relaxed', selected ? 'text-background/60' : 'text-muted-foreground/80')}>
              {currency !== 'EUR' && <>/ €{tier.amount} EUR </>}
              {usd != null && currency !== 'USD' && <>/ ${usd.toFixed(2)} USD </>}
              {gbp != null && currency !== 'GBP' && <>/ £{gbp.toFixed(2)} GBP</>}
            </div>
            {selected && <Check className="absolute right-3 top-3 h-4 w-4" />}
          </button>
        );
      })}
    </div>
  );
}