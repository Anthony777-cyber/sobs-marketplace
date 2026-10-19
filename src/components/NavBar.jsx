import React from 'react';
import { Link, useLocation } from 'react-router-dom';

// S.O.B.S. brand header. Brand text is a functional Home button (routes to /).
// Browse = solid rounded Orange button. Post = solid Red button, high-contrast.
export default function NavBar({ showPost = true }) {
  const { pathname } = useLocation();
  const onCreate = pathname === '/create';
  const onBrowse = pathname.startsWith('/browse');
  const isManagementFlow =
    pathname === '/manage' || pathname.startsWith('/manage/');

  if (isManagementFlow) return null;

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-neutral-950">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex flex-col items-start">
          <Link to="/" className="flex flex-col leading-none">
            <span className="font-display text-2xl tracking-tight text-white sm:text-3xl">S.O.B.S.</span>
            <span className="mt-0.5 text-[10px] font-semibold tracking-[0.25em] text-white sm:text-xs">
              SELL OLD BROKEN STUFF
            </span>
          </Link>
          {showPost && onBrowse && (
            <div className="mt-[6%] flex items-center gap-3">
              <Link to={`/sifter-mk4?fresh=${Date.now()}`} className="inline-flex w-32 items-center justify-center rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700">Post</Link>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {showPost && !onBrowse && pathname !== '/create' && <Link to={`/sifter-mk4?fresh=${Date.now()}`} className="inline-flex w-32 items-center justify-center rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700">Post</Link>}
        </div>
      </div>
    </header>
  );
}
