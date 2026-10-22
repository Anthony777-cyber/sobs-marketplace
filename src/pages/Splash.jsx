import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

function gearPath(teeth, scale = 1, toothPhase = 0) {
  const points = Array.from({ length: 144 }, (_, index) => {
    const angle = (index / 144) * Math.PI * 2 - Math.PI / 2;
    const radius = (9.7 + 0.65 * Math.cos(angle * teeth + toothPhase)) * scale;
    const x = 12 + radius * Math.cos(angle);
    const y = 12 + radius * Math.sin(angle);
    return `${x.toFixed(3)} ${y.toFixed(3)}`;
  });
  const outer = `M${points.join(' L')} Z`;
  const holeRadius = 4.6 * scale;
  const hole = `M12 ${12 - holeRadius} A${holeRadius} ${holeRadius} 0 1 0 12 ${12 + holeRadius} A${holeRadius} ${holeRadius} 0 1 0 12 ${12 - holeRadius} Z`;
  return `${outer} ${hole}`;
}

function GearAssembly() {
  const mainGear = gearPath(24);
  const smallGear = gearPath(8, 1 / 3, Math.PI);
  return (
    <span className="inline-flex h-[0.8em] w-[1.265em] items-center justify-center align-[-0.02em]">
      <svg aria-hidden="true" viewBox="-4.608 1.5 33.216 21" className="h-[0.8em] w-[1.265em] overflow-visible">
        <g className="splash-gear-main">
          <path d={mainGear} fill="currentColor" fillRule="evenodd" />
          <circle cx="12" cy="12" r="4.15" fill="none" stroke="currentColor" strokeWidth="0.45" />
          <g stroke="currentColor" strokeWidth="0.7">
            <line x1="12" y1="10.75" x2="12" y2="7.9" />
            <line x1="13.08" y1="12.62" x2="15.55" y2="14.05" />
            <line x1="10.92" y1="12.62" x2="8.45" y2="14.05" />
          </g>
          <circle cx="12" cy="12" r="1.15" fill="currentColor" />
        </g>
        <g transform="translate(-11.2 6.466)">
          <g className="splash-gear-small">
            <path d={smallGear} fill="currentColor" fillRule="evenodd" />
          </g>
          <circle cx="12" cy="12" r="0.45" fill="currentColor" />
        </g>
        <g transform="translate(11.2 6.466)">
          <g className="splash-gear-small">
            <path d={smallGear} fill="currentColor" fillRule="evenodd" />
          </g>
          <circle cx="12" cy="12" r="0.45" fill="currentColor" />
        </g>
      </svg>
    </span>
  );
}

function PeriodGear() {
  const gear = gearPath(8, 1, Math.PI);
  return (
    <span className="inline-flex h-[0.72em] w-[0.28em] items-center justify-center align-[-0.02em]">
      <svg aria-hidden="true" viewBox="1.5 1.5 21 21" className="h-[0.267em] w-[0.267em] overflow-visible">
        <g className="splash-gear-small">
          <path d={gear} fill="currentColor" fillRule="evenodd" />
        </g>
        <circle cx="12" cy="12" r="1.4" fill="currentColor" />
      </svg>
    </span>
  );
}

function BrandMark({ size = 'text-7xl sm:text-8xl' }) {
  return (
    <div className="relative -top-5 [transform:translateY(15%)] flex flex-col items-center leading-none">
      <span className={`splash-gear-train whitespace-nowrap font-display tracking-tight ${size} lg:text-[8.5rem]`}>
        S<GearAssembly />B<PeriodGear />S
      </span>
      <span className="mt-[0.2rem] grid w-full grid-cols-4 items-center text-xs font-bold sm:text-sm lg:text-xl">
        <span className="relative -left-[12%] [transform:scaleX(0.792)] rounded-full border-[3px] border-white bg-black px-0.5 py-0.5 text-center text-white">SELL</span>
        <span className="relative -left-[2%] [transform:scaleX(0.792)] rounded-full border-[3px] border-white bg-black px-0.5 py-0.5 text-center text-white">OLD</span>
        <span className="relative left-[8%] [transform:scaleX(0.792)] rounded-full border-[3px] border-white bg-black px-0.5 py-0.5 text-center text-white">BROKEN</span>
        <span className="relative left-[13%] [transform:scaleX(0.792)] rounded-full border-[3px] border-white bg-black px-0.5 py-0.5 text-center text-white">STUFF</span>
      </span>
    </div>
  );
}

function SplashActions() {
  let listPath = '/sell-info';
  try {
    const hasUserKey = sessionStorage.getItem('sobs_global_user_key');
    listPath = hasUserKey
      ? (sessionStorage.getItem('sobs_seller_session_token') ? '/sifter-mk4' : '/seller-login')
      : '/sell-info';
  } catch {
    // Keep the homepage available when browser storage is unavailable.
  }

  return (
    <div className="splash-actions [transform:translateY(15%)] mt-4 flex w-full max-w-[24rem] flex-col items-start gap-0 sm:inline-flex sm:w-auto sm:max-w-none lg:mt-2">
      <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto sm:gap-[2%]">
        <Link to="/seller-login" className="inline-flex w-full items-center justify-center rounded-full bg-red-600 px-2 py-2 text-center font-bold text-black transition-colors hover:bg-red-700 sm:w-32 sm:px-5">Login</Link>
        <Link to={listPath} className="relative inline-flex w-full items-center justify-center rounded-full bg-red-600 px-1 py-2 text-center font-bold text-black transition-colors hover:bg-red-700 sm:w-32 sm:px-5">
          <span className="relative -left-2">List</span> <ArrowRight className="splash-list-arrow absolute right-3 h-4 w-4 sm:right-4" />
        </Link>
        <Link to="/process" className="inline-flex w-full items-center justify-center rounded-full bg-yellow-400 px-2 py-2 text-center font-bold text-black transition-colors hover:bg-yellow-500 sm:w-32 sm:px-5">Info</Link>
      </div>
      <div className="mt-[1.725%] grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto sm:gap-[2%]">
        <Link to="/manage-listings" className="inline-flex w-full items-center justify-center rounded-full bg-red-600 px-2 py-2 text-center font-bold text-black transition-colors hover:bg-red-700 sm:w-32 sm:px-5">Manage</Link>
        <Link to="/browse" className="relative inline-flex w-full items-center justify-center rounded-full bg-orange-500 px-1 py-2 text-center font-bold text-black transition-colors hover:bg-orange-600 sm:w-32 sm:px-5">
          Listings <ArrowRight className="absolute right-3 h-4 w-4 sm:right-4" />
        </Link>
        <Link to="/categories" className="relative inline-flex w-full items-center justify-center rounded-full bg-yellow-400 px-1 py-2 text-center font-bold text-black transition-colors hover:bg-yellow-500 sm:w-32 sm:px-5">
          Index <ArrowRight className="absolute right-3 h-4 w-4 sm:right-4" />
        </Link>
      </div>
    </div>
  );
}

function SplashCopy({ desktop = false }) {
  return (
    <div className={`mx-auto grid w-full gap-4 ${desktop ? 'splash-copy-grid hidden lg:grid lg:grid-cols-2 lg:gap-3' : 'grid-cols-1 sm:grid-cols-2 lg:hidden'}`}>
      <div className="splash-copy-card splash-directory-copy rounded-2xl border border-white/10 bg-neutral-900 p-5 text-sm leading-relaxed text-white">
        <p><br />The ultra-searchable directory of <strong className="splash-directory-emphasis">EVERYTHING</strong>.</p>
        <p className="splash-justified-copy splash-example-copy mt-2">List junk, spares, machines or cars—whether they need repair or are in good condition.</p>
        <p className="splash-justified-copy splash-example-copy mt-2">Rare parts, Collectables, Art, Pokémon cards, and your precious collection of Coca-Cola bottle tops are welcome too.<br /><span className="splash-legal-copy">So long as it's legal, we don't discriminate.</span> Anything that you think is worth the listing fee.</p>
      </div>
      <div className="splash-copy-card splash-offer-card min-w-0 rounded-2xl border border-white/10 bg-neutral-900 p-5 text-sm leading-relaxed text-white">
        <p className="splash-offer-red text-lg leading-relaxed text-pretty">
          <br /><span className="splash-offer-heading block whitespace-nowrap leading-tight text-white">To <span className="text-[#ef4444]">Buyers</span>, we offer</span><br />
          <strong className="mt-1.5 block text-2xl font-extrabold leading-tight sm:text-3xl">
            <span className="splash-zero-friction block whitespace-nowrap text-white">ZERO-FRICTION ENTRY</span>
            <span className="splash-offer-lines block text-red-500">NO Sign-Up<br /> NO Passwords<br /> NO Cookies<br /> NO Ads</span>
          </strong>
        </p>
      </div>
      <div className="splash-copy-card rounded-2xl border border-white/10 bg-neutral-900 p-5 text-sm leading-relaxed text-white">
        <p className="splash-justified-copy splash-example-copy text-pretty">For instance, you're in a band and want to advertise your next three months' gigs for a buck, cool.</p>
        <p className="splash-justified-copy splash-example-copy mt-2 text-pretty">This is a repository of information as well as things.</p>
        <p className="splash-justified-copy splash-example-copy mt-2 text-pretty">We don't do <strong><em className="font-serif font-semibold">free ads</em></strong><br />As if it's not worth the few bucks it costs to list it, then we're quite happy to let Gumtree or Facebook bottom-feed off it.</p>
        <p className="splash-justified-copy mt-2 text-pretty" style={{ wordSpacing: '-2px' }}>Just click on <span className="splash-listings-word">LISTINGS</span> above and have a look at what's on offer</p>
        <p className="splash-justified-copy mt-2 text-pretty" style={{ wordSpacing: '-2px' }}>Search the <span className="splash-index-word">INDEX</span> for your heart's desire</p>
        <p className="splash-justified-copy mt-2 text-pretty" style={{ wordSpacing: '-2px' }}>or endlessly scroll through bad photos of other people's tat.</p>
      </div>
      <div className="splash-copy-card splash-seller-card rounded-2xl border border-white/10 bg-neutral-900 p-5 text-sm leading-relaxed text-white">
        <p className="text-pretty"><span className="splash-offer-heading block whitespace-nowrap leading-tight text-white">To <span className="splash-seller-heading">Sellers</span>, we offer</span><br /><span className="splash-seller-copy mt-1.5">Worldwide advertising cheaply<br /><span className="splash-seller-offset-line">Bulk uploads for the pros</span><br /><span className="splash-seller-next-line">and best of all, unlike <span className="splash-ebay-e">e</span><span className="splash-ebay-b">B</span><span className="splash-ebay-a">a</span><span className="splash-ebay-y">y</span>.</span><br /><span className="splash-seller-final-line">WE don't take a cut of your profit.</span></span></p>
      </div>
    </div>
  );
}

export default function Splash() {
  const [showIntro, setShowIntro] = useState(true);
  const [needsPlay, setNeedsPlay] = useState(false);
  const introVideoRef = useRef(null);

  const startIntro = () => {
    const playback = introVideoRef.current?.play();
    playback?.then(() => setNeedsPlay(false)).catch(() => setNeedsPlay(true));
  };

  if (showIntro) {
    return (
      <div className="splash-page flex min-h-screen items-center justify-center overflow-hidden bg-neutral-950 px-4 text-white">
        <video
          ref={introVideoRef}
          autoPlay
          muted
          playsInline
          preload="auto"
          aria-label="S.O.B.S. intro animation"
          onCanPlay={startIntro}
          onEnded={() => setShowIntro(false)}
          onError={() => setShowIntro(false)}
          style={{ width: 'min(92vw, 760px)', height: 'auto', maxHeight: '62vh', objectFit: 'contain' }}
        >
          <source src="/splash-intro.mp4" type="video/mp4" />
        </video>
        {needsPlay && (
          <button
            type="button"
            onClick={startIntro}
            className="absolute bottom-8 rounded-full border-2 border-white bg-black px-6 py-3 font-bold"
          >
            Tap to play intro
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="splash-page min-h-screen bg-neutral-950 text-white lg:h-dvh lg:overflow-hidden">
      <main className="mx-auto grid max-w-[1536px] gap-8 px-4 pb-12 pt-5 lg:h-full lg:grid-cols-[minmax(25rem,0.85fr)_minmax(0,1.5fr)] lg:items-stretch lg:gap-4 lg:overflow-hidden lg:py-3">
        <div className="lg:flex lg:min-h-0 lg:flex-col">
          <header className="flex justify-center py-5 sm:justify-start lg:shrink-0 lg:py-0">
            <BrandMark />
          </header>
          <SplashActions />
          <section className="mt-10 w-full max-w-[24rem] text-center lg:mt-2 lg:flex lg:min-h-0 lg:max-w-none lg:flex-1 lg:flex-col" aria-label="Punt of the day">
            <h1 className="mx-auto inline-block w-fit rounded-full border-[3px] border-white bg-black px-4 py-1 [transform:translateY(80%)] text-center font-display text-3xl tracking-tight">Punt of the day</h1>
            <div className="mt-4 min-h-0 lg:mt-2 lg:flex lg:flex-1">
              <div className="overflow-hidden rounded-xl border border-white/10 bg-neutral-900 lg:flex lg:min-h-0 lg:w-full lg:flex-1 lg:items-center lg:justify-center">
                <img src="/punt-of-the-day.jpg" alt="White Audi displayed in a showroom" className="splash-day-image" />
              </div>
            </div>
          </section>
        </div>
        <aside className="pt-5 lg:flex lg:min-h-0 lg:items-stretch lg:pt-0">
          <SplashCopy />
          <SplashCopy desktop />
        </aside>
      </main>
    </div>
  );
}
