import React, { useState } from 'react';
import { X, Folder } from 'lucide-react';

// Slashless Dynamic Tag Input Engine.
// A seller types a word and hits Space or Enter; it becomes a visual folder tag.
// Tags are joined by a hidden "/" in the background `categoryPath` string.
// Gredunza Rule: any novel word is accepted instantly as a valid directory node.
function sanitize(raw) {
  let s = raw.trim();
  s = s.replace(/\s+/g, ' '); // strip double spaces
  s = s.replace(/ /g, '_'); // inner spaces -> underscores
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1); // uppercase first char
}

export default function TagInput({ value, onChange }) {
  const tags = value ? value.split('/').filter(Boolean) : [];
  const [draft, setDraft] = useState('');

  const commit = () => {
    const cleaned = sanitize(draft);
    if (cleaned && !tags.includes(cleaned)) {
      onChange([...tags, cleaned].join('/'));
    }
    setDraft('');
  };

  const remove = (i) => {
    onChange(tags.filter((_, idx) => idx !== i).join('/'));
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-background p-2">
        {tags.map((t, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-sm"
          >
            <Folder className="h-3.5 w-3.5 text-muted-foreground" />
            {t}
            <button
              type="button"
              onClick={() => remove(i)}
              className="ml-0.5 text-muted-foreground hover:text-foreground"
              aria-label={`Remove ${t}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              commit();
            } else if (e.key === 'Backspace' && !draft && tags.length) {
              remove(tags.length - 1);
            }
          }}
          onBlur={commit}
          placeholder={tags.length ? 'Add another tag…' : 'Type a category word, e.g. Automotive'}
          className="min-w-[140px] flex-1 bg-transparent px-1 py-1 text-sm outline-none"
        />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Type a word and press Space or Enter to add a folder tag. Any novel word becomes a live directory node.
      </p>
    </div>
  );
}