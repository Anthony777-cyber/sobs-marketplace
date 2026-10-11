import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SifterMK4 from '@/pages/SifterMK4';

export default function SellerSifterPage() {
  const navigate = useNavigate();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const globalKey = sessionStorage.getItem('sobs_global_user_key')?.trim();
    const sessionToken = sessionStorage.getItem('sobs_seller_session_token')?.trim();

    if (!globalKey) {
      navigate('/sell-info', { replace: true });
      return () => { cancelled = true; };
    }
    if (!sessionToken) {
      navigate('/seller-login', { replace: true });
      return () => { cancelled = true; };
    }

    fetch('/api/seller/me', {
      headers: {
        'X-SOBS-Global-Key': globalKey,
        'X-SOBS-Seller-Session': sessionToken,
      },
    }).then(async response => {
      if (!response.ok) throw new Error('Seller session is not valid.');
      await response.json().catch(() => ({}));
      if (!cancelled) setVerified(true);
    }).catch(() => {
      if (!cancelled) navigate('/seller-login', { replace: true });
    });

    return () => { cancelled = true; };
  }, [navigate]);

  if (!verified) return <div className="min-h-screen bg-background px-5 pt-[15vh] text-center text-sm text-muted-foreground">Checking seller login…</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="px-5 pt-[15vh]">
        <p className="mx-auto max-w-5xl text-center text-lg font-extrabold sm:text-xl">
          The more accurately you describe your item, the sooner you sell it.
        </p>
      </div>
      <SifterMK4 customerMode onContinue={sifterData => navigate('/create', { state: { sifter: sifterData } })} />
    </div>
  );
}
