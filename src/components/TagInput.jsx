import React, { useState } from 'react';
import { X, Folder } from 'lucide-react';

function sanitize(raw) {
  let s = raw.trim().replace(/\s+/g, ' ');
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
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

  const splitAtSpace = (tagIndex, spaceIndex) => {
    const parts = tags[tagIndex].split(/\s+/).filter(Boolean);
    if (spaceIndex < 0 || spaceIndex >= parts.length - 1) return;

    const left = parts.slice(0, spaceIndex + 1).join(' ');
    const right = parts.slice(spaceIndex + 1).join(' ');

    onChange([
      ...tags.slice(0, tagIndex),
      left,
      right,
      ...tags.slice(tagIndex + 1),
    ].join('/'));
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-background p-2">
        {tags.map((tag, i) => {
          const words = tag.split(/\s+/).filter(Boolean);

          return (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-sm"
            >
              <Folder className="h-3.5 w-3.5 text-muted-foreground" />

              {words.map((word, wordIndex) => (
                <React.Fragment key={`${i}-${wordIndex}`}>
                  <span>{word}</span>
                  {wordIndex < words.length - 1 && (
                    <button
                      type="button"
                      onClick={() => splitAtSpace(i, wordIndex)}
                      className="px-1 text-transparent hover:text-muted-foreground"
                      aria-label={`Split category after ${word}`}
                      title="Split category here"
                    >
                      {' '}
                    </button>
                  )}
                </React.Fragment>
              ))}

              <button
                type="button"
                onClick={() => remove(i)}
                className="ml-0.5 text-muted-foreground hover:text-foreground"
                aria-label={`Remove ${tag}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          );
        })}

        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
            } else if (e.key === 'Backspace' && !draft && tags.length) {
              remove(tags.length - 1);
            }
          }}
          onBlur={commit}
          placeholder={tags.length ? 'Add another category…' : 'Type a category'}
          className="min-w-[140px] flex-1 bg-transparent px-1 py-1 text-sm outline-none"
        />
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
        Click between words to split a category. Press Enter to add another.
      </p>
    </div>
  );
}
