import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import NavBar from '@/components/NavBar';
import { runLifecycle } from '@/lib/lifecycle';
import { setHead } from '@/lib/head';
import { Loader2 } from 'lucide-react';

// Static seed tracks guarantee a populated directory even before any live
// listings exist. Live listing paths are merged in on load.
const SEED_PATHS = [
  'Appliances/Bosch/Washing_Machines/Drum_Bearings',
  'Appliances/Miele/Dishwashers/Spray_Arms',
  'Appliances/Hoover/Vacuums/Drive_Belts',
  'Automotive/Ford/Transit/2014/Chassis_Cuts_Rear_Quarter',
  'Automotive/Vauxhall/Corsa/2008/Alternator',
  'Automotive/VW/Golf/1998/Headlamp_Switch',
  'Horology/Omega/Calibre_321/Chronograph_Bridge_Screws',
  'Horology/Rolex/Calibre_3135/Mainplate',
  'Tools/Power/Drills/Chuck_Key',
  'Tools/Hand/Spanners/Imperial_Set',
];

function buildTree(paths) {
  const root = { name: '', path: '', children: {} };
  paths.forEach((p) => {
    const parts = p.split('/').filter(Boolean);
    let node = root;
    let acc = '';
    parts.forEach((part) => {
      acc = acc ? acc + '/' + part : part;
      const key = part.toLowerCase();
      if (!node.children[key]) node.children[key] = { name: part, path: acc, children: {} };
      node = node.children[key];
    });
  });
  return root;
}

// Prune: keep a node only if its own path matches the query or any descendant does.
function pruneTree(node, q) {
  const selfMatch = node.path.toLowerCase().includes(q);
  const kept = {};
  for (const child of Object.values(node.children)) {
    const p = pruneTree(child, q);
    if (p) kept[child.name.toLowerCase()] = p;
  }
  if (selfMatch || Object.keys(kept).length) return { ...node, children: kept };
  return null;
}

function allDescendantPaths(node, acc = []) {
  acc.push(node.path);
  Object.values(node.children).forEach((c) => allDescendantPaths(c, acc));
  return acc;
}

// Flatten the visible tree into drawable monospace lines (├── └── │).
function buildLines(root, isExpanded) {
  const out = [];
  function walk(node, prefix, isLast, isRoot) {
    if (!isRoot) {
      out.push({
        node,
        indent: prefix + (isLast ? '└── ' : '├── '),
        isLeaf: Object.keys(node.children).length === 0,
      });
    }
    if (!isRoot && !isExpanded(node)) return;
    const children = Object.values(node.children);
    const base = isRoot ? '' : prefix + (isLast ? '    ' : '│   ');
    children.forEach((c, i) => walk(c, base, i === children.length - 1, false));
  }
  walk(root, '', true, true);
  return out;
}

export default function Directory() {
  const [paths, setPaths] = useState(null);
  const [expanded, setExpanded] = useState(() => new Set());
  const [query, setQuery] = useState('');

  useEffect(() => {
    (async () => {
      await runLifecycle();
      let live = [];
      try {
        const nowIso = new Date().toISOString();
        const items = await base44.entities.Listing.filter(
          { grey_zone: false, status: 'active', expires_date: { $gte: nowIso } },
          '-created_date',
          300
        );
        live = items.map((l) => l.categoryPath).filter(Boolean);
      } catch {}
      const merged = [...new Set([...SEED_PATHS, ...live])].sort();
      setPaths(merged);
    })();
  }, []);

  useEffect(() => {
    setHead(
      'Category Directory Index — S.O.B.S.',
      'Full keyword-pruned directory tree of every S.O.B.S. category path.'
    );
  }, []);

  const fullTree = useMemo(() => (paths ? buildTree(paths) : null), [paths]);

  const lines = useMemo(() => {
    if (!fullTree) return [];
    const q = query.trim().toLowerCase();
    if (!q) return buildLines(fullTree, (n) => expanded.has(n.path));
    const pruned = pruneTree(fullTree, q);
    if (!pruned) return [];
    return buildLines(pruned, () => true);
  }, [fullTree, query, expanded]);

  const toggleFolder = (node) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(node.path)) {
        allDescendantPaths(node).forEach((p) => next.delete(p));
      } else {
        allDescendantPaths(node).forEach((p) => next.add(p));
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <NavBar />
      <div className="mx-auto w-full px-2 py-4">
        <h1 className="font-display text-3xl tracking-tight">Directory Index</h1>

        {/* FILE PATH SEARCH prompt line */}
        <div className="sticky top-[68px] z-10 -mx-2 mt-4 bg-neutral-950/95 px-2 py-3 backdrop-blur">
          <div className="flex items-center gap-2 font-mono text-sm text-white/80">
            <span className="whitespace-nowrap">[ FILE PATH SEARCH:</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="____________________"
              className="w-full bg-transparent font-mono text-white outline-none placeholder:text-white/30"
            />
            <span className="whitespace-nowrap">]</span>
          </div>
        </div>

        <div className="mt-4 min-h-[calc(100vh-220px)] rounded-xl border border-white/15 bg-black p-4 font-mono text-sm leading-relaxed">
          {paths === null ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-white/50" />
            </div>
          ) : lines.length === 0 ? (
            <p className="py-10 text-center text-white/50">
              {query ? 'No paths match your search.' : 'No categories yet.'}
            </p>
          ) : (
            <div className="overflow-x-auto whitespace-pre">
              {lines.map((line, i) => (
                <div key={i} className="flex">
                  <span className="text-white/40">{line.indent}</span>
                  {line.isLeaf ? (
                    <Link
                      to={`/browse/${line.node.path}`}
                      className="text-white hover:underline"
                    >
                      📄 {line.node.name}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => toggleFolder(line.node)}
                      className="text-left text-white hover:underline"
                    >
                      📁 {line.node.name}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="mt-4 font-mono text-xs text-white/40">
          Click a folder to expand its entire branch. File entries link to /browse/&lt;path&gt;.
        </p>
      </div>
    </div>
  );
}