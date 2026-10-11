import React from 'react';
import { useNavigate } from 'react-router-dom';
import SifterMK4 from '@/pages/SifterMK4';

// Test-branch-only visual preview. The actual /sifter route remains seller-authenticated.
export default function SifterMK4Preview() {
  const navigate = useNavigate();

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
