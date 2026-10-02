import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import { setHead } from '@/lib/head';
import { getManageListing } from '@/lib/api';
import { Loader2, Lock } from 'lucide-react';

const KEY_STORAGE = 'sobs_management_key';

export default function Manage() {
  const navigate = useNavigate();
  const [keyInput, setKeyInput] = useState('');
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    setHead(
      'Manage — S.O.B.S.',
      'Enter your listing key code to open the management console.'
    );
  }, []);

  const unlock = async () => {
    const code = keyInput.trim();
    if (!code) return;

    setStatus('searching');

    try {
      await getManageListing(code);
      sessionStorage.setItem(KEY_STORAGE, code);
      navigate('/manage/console');
    } catch {
      setStatus('notfound');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <NavBar />

      <div className="mx-auto max-w-xl px-4 py-12">
        <h1 className="font-display text-3xl tracking-tight">
          Manage Listing
        </h1>

        <div className="mt-8">
          <div className="flex items-center gap-2 rounded-lg border border-white/20 bg-black px-3 py-2.5 font-mono text-sm text-white/80">
            <span className="whitespace-nowrap">[ ENTER YOUR KEY CODE:</span>

            <input
              value={keyInput}
              onChange={(e) => {
                setKeyInput(e.target.value);
                if (status === 'notfound') setStatus('idle');
              }}
              onKeyDown={(e) => e.key === 'Enter' && unlock()}
              placeholder="SOBS-0000-X"
              className="w-full bg-transparent font-mono text-white outline-none placeholder:text-white/30"
              autoComplete="off"
            />

            <span className="whitespace-nowrap">]</span>
          </div>

          <button
            onClick={unlock}
            disabled={status === 'searching'}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 font-semibold text-black hover:bg-white/90 disabled:opacity-50"
          >
            {status === 'searching' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            Unlock
          </button>

          {status === 'notfound' && (
            <p className="mt-4 text-sm text-red-400">
              No listing matches that key code.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
