import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// Open-ended registry directory input. Sellers can pick an existing nested
// category path or type a brand new custom one (e.g. Spares/Ford/Escort/1994/Gearbox).
export default function CategoryPicker({ value, onChange }) {
  const [paths, setPaths] = useState([]);

  useEffect(() => {
    base44.entities.Listing
      .list('-created_date', 200)
      .then((items) => {
        const set = new Set();
        items.forEach((l) => {
          if (l.categoryPath) set.add(l.categoryPath);
        });
        setPaths([...set].sort());
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      <input
        list="sobs-category-paths"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. Spares/Ford/Escort/1994/Gearbox"
        className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
      />
      <datalist id="sobs-category-paths">
        {paths.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
      <p className="mt-1 text-xs text-muted-foreground">
        Type a new path or pick an existing folder. Use / to nest categories.
      </p>
    </div>
  );
}