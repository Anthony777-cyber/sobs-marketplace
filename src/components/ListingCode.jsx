import { useState } from 'react';
import { Copy } from 'lucide-react';

export default function ListingCode({ label, value, copyValue = value, className = 'text-xs' }) {
  const [copied, setCopied] = useState(false);
  if (value == null || value === '') return null;

  return (
    <div className={`flex items-center gap-2 text-white ${className}`}>
      {label && <span>{label}</span>}
      <span>{value}</span>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(String(copyValue));
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          } catch {}
        }}
        className="inline-flex items-center gap-1 rounded border border-white/30 px-2 py-1 hover:bg-white/10"
        title={`Copy ${label || 'code'}`}
      >
        <Copy className="h-3 w-3" />
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}
