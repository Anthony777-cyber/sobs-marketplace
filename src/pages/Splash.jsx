import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Tag, Clock, MessageSquare, Shield, ArrowRight } from 'lucide-react';
import ListingCard from '@/components/ListingCard';
import { getListings } from '@/lib/api';

const INTRO_SEEN_KEY = 'sobs_splash_intro_seen_v1';

function isIntroPreview() {
  return import.meta.env.DEV && new URLSearchParams(window.location.search).get('previewIntro') === '1';
}

function hasSeenIntro() {
  try {
    return localStorage.getItem(INTRO_SEEN_KEY) === '1'
      || Boolean(localStorage.getItem('sobs_entry_ticket'))
      || Boolean(localStorage.getItem('sobs_seller_id'));
  } catch {
    return false;
  }
}

function BrandMark({ size = 'text-7xl sm:text-8xl' }) {
  return (
    <div className="flex flex-col items-center leading-none">
      <span className={`font-display tracking-tight ${size}`}>
        S<span className="font-sans font-bold">.</span>O<span className="font-sans font-bold">.</span>B<span className="font-sans font-bold">.</span>S
      </span>
      <span className="mt-1 grid w-full grid-cols-4 items-center text-xs font-semibold text-white sm:text-sm">
        <span className="relative -left-[12%] text-center">SELL</span>
        <span className="relative -left-[2%] text-center">OLD</span>
        <span className="relative left-[8%] text-center">BROKEN</span>
        <span className="relative left-[13%] text-center">STUFF</span>
      </span>
    </div>
  );
}

const STEPS = [
  {
    icon: Tag,
    heading: 'List',
    text: [
      "Punt your junk, spares, rare parts, or collectibles.",
      "Get 3 photos and an ultra searchable listing system.",
      "No sign-ups, no passwords and no cookies for buyers.",
      "We take no commission on sales profit.",
    ],
  },
  {
    icon: Clock,
    heading: 'Pay',
    text: [
      "How long you list is how much you pay.",
      "All shown in your own currency.",
      "When time is up, your post hides. You have one week to save it or renew it.",
    ],
  },
  {
    icon: MessageSquare,
    heading: 'Chat',
    text: [
      "Buyers message you directly on your listing.",
      "Take the conversation offsite if you want.",
      "It is your business, not ours. We just help buyers find you.",
      "Be kind. Manners maketh man.",
    ],
  },
  {
    icon: Shield,
    heading: 'Control',
    text: [
      "Downvote inappropriate listings; enough votes remove them.",
      "S.O.B.S does not condone criminal behaviour.",
      "Downvoted listings are not refunded.",
      "We will never give out your identity to anyone unless lawfully obliged to.",
    ],
  },
];

function SplashActions() {
  const listPath =
    sessionStorage.getItem('sobs_global_user_key') && sessionStorage.getItem('sobs_seller_session_token')
      ? '/sifter-mk4'
      : sessionStorage.getItem('sobs_global_user_key')
        ? '/seller-login'
        : '/sell-info';

  return (
    <div className="mt-4 flex w-full max-w-[24rem] flex-col items-start gap-0 sm:inline-flex sm:w-auto sm:max-w-none">
      <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto sm:gap-[2%]">
        <Link to="/seller-login" className="inline-flex w-full items-center justify-center rounded-full bg-red-600 px-2 py-2 text-center font-semibold text-black transition-colors hover:bg-red-700 sm:w-32 sm:px-5">Login</Link>
        <Link to="/manage-listings" className="inline-flex w-full items-center justify-center rounded-full bg-red-600 px-2 py-2 text-center font-semibold text-black transition-colors hover:bg-red-700 sm:w-32 sm:px-5">Manage</Link>
        <Link to="/rules" className="inline-flex w-full items-center justify-center rounded-full bg-white px-2 py-2 text-center font-semibold text-black transition-colors hover:bg-gray-100 sm:w-32 sm:px-5">Rules</Link>
      </div>
      <div className="mt-[1.725%] grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto sm:gap-[2%]">
        <Link to={listPath} className="relative inline-flex w-full items-center justify-center rounded-full bg-red-600 px-1 py-2 text-center font-semibold text-black transition-colors hover:bg-red-700 sm:w-32 sm:px-5">
          <span className="relative -left-2">List</span> <ArrowRight className="splash-list-arrow absolute right-3 h-4 w-4 sm:right-4" />
        </Link>
        <Link to="/browse" className="relative inline-flex w-full items-center justify-center rounded-full bg-orange-500 px-1 py-2 text-center font-semibold text-black transition-colors hover:bg-orange-600 sm:w-32 sm:px-5">
          Listings <ArrowRight className="absolute right-3 h-4 w-4 sm:right-4" />
        </Link>
        <Link to="/categories" className="relative inline-flex w-full items-center justify-center rounded-full bg-yellow-400 px-1 py-2 text-center font-semibold text-black transition-colors hover:bg-yellow-500 sm:w-32 sm:px-5">
          Index <ArrowRight className="absolute right-3 h-4 w-4 sm:right-4" />
        </Link>
      </div>
    </div>
  );
}

function SplashCopy() {
  return (
    <div className="mx-auto grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-2xl border border-white/10 bg-neutral-900 p-5 text-sm leading-relaxed text-white">
        <p className="text-pretty"><strong className="text-[1.5em] leading-tight">S.O.B.S.</strong> is the ultra-searchable directory of <strong className="text-base font-bold sm:text-xl">EVERYTHING</strong>.</p>
        <p className="mt-2 text-pretty">List junk, spares, machines or cars—whether they need repair or are in good condition. Rare parts, Collectables, Art, Pokémon cards, and your precious collection of Coca-Cola bottle tops are welcome too.<br /> So long as it's legal, we don't discriminate. Anything that you think is worth the listing fee.</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-neutral-900 p-5 text-sm leading-relaxed text-white">
        <p className="splash-offer-red text-lg leading-relaxed text-pretty">
          <span className="text-[1.5em] leading-tight text-white">To browsers and buyers, we offer</span><br />
          <strong className="mt-1.5 block text-2xl font-extrabold leading-tight sm:text-3xl">
            <span className="block text-yellow-400">ZERO-FRICTION ENTRY</span>
            <span className="block text-red-500">NO sign-up, NO <span className="text-[0.975em]">passwords,</span><br /> NO cookies, NO ads.</span>
          </strong>
        </p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-neutral-900 p-5 text-sm leading-relaxed text-white">
        <p className="text-pretty">For instance, you're in a band and want to advertise your next three months' gigs for a buck, cool.<br /> This is a repository of information as well as things.</p>
        <p className="mt-2 text-pretty">We don't do <em className="font-serif font-semibold">free ads</em>. As if it's not worth the few bucks it costs to list it, then we're quite happy to let Gumtree or Facebook bottom-feed off it.</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-neutral-900 p-5 text-sm leading-relaxed text-white">
        <p className="text-pretty">To sellers, we offer worldwide advertising dirt cheap,<br /> bulk uploads for the pros, and best of all, unlike eBay,<br /> we don't take a cut of your profit.</p>
        <p className="mt-2 text-pretty">Just click on <span className="splash-listings-word">LISTINGS</span> above and have a look at what's on offer,<br /> or search the <span className="splash-index-word">INDEX</span> for your heart's desire.<br /> Or endlessly scroll through bad photos of people's tat.</p>
      </div>
    </div>
  );
}

function ProcessSection() {
  return (
    <section className="mx-auto max-w-5xl px-4 pt-8 pb-4">
      <h2 className="font-display text-3xl tracking-tight">The Process</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step) => (
          <div key={step.heading} className="rounded-2xl border border-white/10 bg-neutral-900 p-5">
            <div className="flex items-center gap-3">
              <step.icon className="h-6 w-6 text-white" />
              <h3 className="font-display text-xl tracking-tight">{step.heading}</h3>
            </div>
            <ul className="mt-2 list-disc pl-5 text-sm leading-relaxed text-white">
              {step.text.map((item) => <li key={item} className="whitespace-pre-line">{item}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Splash() {
  const previewIntro = isIntroPreview();
  const [showIntro, setShowIntro] = useState(true);
  const [introStep, setIntroStep] = useState(0);
  const [featuredListing, setFeaturedListing] = useState(null);
  const [loadingListing, setLoadingListing] = useState(false);

  useEffect(() => {
    if (showIntro) return undefined;
    let cancelled = false;
    setLoadingListing(true);
    getListings()
      .then((listings) => {
        if (cancelled) return;
        const available = (Array.isArray(listings) ? listings : []).filter((listing) => {
          if (listing.grey_zone) return false;
          if (!listing.expires_date) return true;
          const expiresAt = Date.parse(listing.expires_date);
          return !Number.isFinite(expiresAt) || expiresAt > Date.now();
        });
        if (available.length) setFeaturedListing(available[Math.floor(Math.random() * available.length)]);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingListing(false);
      });
    return () => { cancelled = true; };
  }, [showIntro]);

  const finishIntro = () => {
    if (!previewIntro) {
      try {
        localStorage.setItem(INTRO_SEEN_KEY, '1');
      } catch {
        // Continue into the home page if browser storage is unavailable.
      }
    }
    setShowIntro(false);
  };

  const continueAfterLogo = () => {
    if (previewIntro || !hasSeenIntro()) {
      setIntroStep(2);
      return;
    }
    setShowIntro(false);
  };

  if (showIntro && introStep < 2) {
    return (
      <div className="splash-page min-h-screen overflow-hidden bg-neutral-950 text-white">
        <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-4">
          {introStep === 0 && (
            <video
              className="splash-intro-video"
              autoPlay
              muted
              playsInline
              preload="auto"
              aria-label="S.O.B.S. logo forming from sand"
              onLoadedMetadata={(event) => {
                const duration = event.currentTarget.duration;
                if (Number.isFinite(duration) && duration > 0) {
                  event.currentTarget.playbackRate = duration / 6;
                }
              }}
              onEnded={continueAfterLogo}
              onError={continueAfterLogo}
            >
              <source src="/splash-intro.mp4" type="video/mp4" />
            </video>
          )}
        </main>
      </div>
    );
  }

  if (showIntro) {
    return (
      <div className="splash-page min-h-screen bg-neutral-950 text-white">
        <div className="splash-details-reveal mx-auto max-w-5xl px-4 pt-6 pb-10 sm:pt-8">
          <ProcessSection />
          <div className="pt-8">
            <SplashCopy />
          </div>
          <div className="mt-8 flex justify-center">
            <button type="button" onClick={finishIntro} className="rounded-full bg-red-600 px-10 py-3 text-lg font-bold text-black transition-colors hover:bg-red-700">
              Got it
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="splash-page min-h-screen bg-neutral-950 text-white">
      <header className="mx-auto flex max-w-5xl items-center justify-center px-4 py-5 sm:justify-between">
        <BrandMark />
      </header>
      <main className="mx-auto max-w-5xl px-4 pb-12">
        <SplashActions />
        <section className="mt-10 w-full max-w-[24rem] text-center">
          <h1 className="mx-auto w-full text-center font-display text-3xl tracking-tight">Punt of the day</h1>
          <div className="mt-4">
            {loadingListing ? (
              <div className="h-72 animate-pulse rounded-xl border border-white/10 bg-neutral-900" aria-label="Loading today\'s listing" />
            ) : featuredListing ? (
              <ListingCard listing={featuredListing} showPublicNumber={false} contentClassName="p-4" />
            ) : (
              <p className="rounded-xl border border-white/10 bg-neutral-900 p-5 text-white">No current listings to feature.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
