import React from 'react';
import { Link } from 'react-router-dom';
import { Tag, Clock, MessageSquare, Shield, ArrowRight } from 'lucide-react';

const STEPS = [
  {
    icon: Tag,
    heading: 'List',
    text: "Punt your junk, spares, or rare parts. Buyers contact you directly on the listing. Get 3 photos and an open-ended listing system. Go broad with 'Washers' or drill down to the fine sand of Maker, Model, Year, and Part Number for ultra-specialized detail and mega findability across site browsers and global search engines. No sign-ups and definitely no passwords and no cookies. It is exactly like an ad in the back of a newspaper—free to access, free to read, and no hassle. You shouldn't need a computer degree to place an ad. People have better things to do.",
  },
  {
    icon: Clock,
    heading: 'Pay',
    text: "How long you list is how much you pay. Choose your tier: €1 for 3 months (minimum), €2 for 6 months, €3 for 9 months, or €4 for a full year. Slow seller? Secure the whole year for €4. Quick seller? Take the cheapest option. When time is up, your post hides and it can be saved a week after it expires if you forget the end date, but you can renew it for as long as you want for any period you want. It is your business, not ours—we are just here to help that all important buyer find you and seal the deal.",
  },
  {
    icon: MessageSquare,
    heading: 'Chat',
    text: "Interested buyers message you directly on your listing so you can chat it out, then it's up to you if you want to take it offsite—phone, email, or WhatsApp or even better they can send you their contact details. We stay out of your conversations entirely. We also don't do shipping, Take selling fees beyond the listing cost or resolve disputes, as that is what the cops and the courts are for. But we do counsel our users to be kind, as manners maketh man.",
  },
  {
    icon: Shield,
    heading: 'Control',
    text: "And to keep out the spammers, hookers, porn merchants and the rest of the botherers, the listing has a downvote button, so if you find something inappropriate vote it down and the listing will get the guillotine after so many downvotes. But remember that abuse of this will also be punished.",
  },
];

export default function Splash() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
        <div className="flex flex-col leading-none">
          <span className="font-display text-7xl tracking-tight sm:text-8xl">S<span className="font-sans font-bold">.</span>O<span className="font-sans font-bold">.</span>B<span className="font-sans font-bold">.</span>S</span>
          <span className="mt-1 text-xs font-semibold tracking-[0.25em] text-white sm:text-sm">
            SELL OLD BROKEN STUFF
          </span>
        </div>
        <Link
          to="/manage-listings"
          className="inline-flex items-center justify-center rounded-full bg-red-600 px-5 py-2 font-semibold text-black transition-colors hover:bg-red-700"
        >
          Manage
        </Link>
      </header>

      <section className="mx-auto max-w-5xl px-4 pb-0 pt-4 sm:pt-6">
        <div className="max-w-3xl">
          <div className="flex items-center gap-8">
            <h1 className="font-display text-2xl leading-tight tracking-tight sm:text-4xl">
              Sell old broken stuff.<br />List it, chat it, sell it.
            </h1>
            <Link to="/rules" className="inline-flex shrink-0 items-center justify-center rounded-full bg-white px-5 py-2 font-semibold text-black transition-colors hover:bg-gray-100">Rules</Link>
          </div>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white sm:text-xl text-justify">
            S∙O∙B∙S∙ is an open-ended directory for junk, spares and rare parts.
          </p>
          <p className="max-w-2xl text-lg leading-relaxed text-white sm:text-xl text-justify">
            List anything from a box of washers to a specific gearbox by maker, model, year and part number. Pay per
            duration, chat with buyers right on the listing, and lets the community keep it clean.
          </p>
          <p className="text-lg font-semibold text-white sm:text-xl">NO sign up, NO password, NO cookies</p>
          <p className="text-lg leading-relaxed text-white sm:text-xl">Just like an advert in the back of a newspaper.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/create"
              className="inline-flex w-32 items-center justify-center gap-2 rounded-full bg-red-600 px-5 py-2 font-semibold text-white transition-colors hover:bg-red-700"
            >
              Post <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/browse"
              className="inline-flex w-32 items-center justify-center gap-2 rounded-full bg-orange-500 px-5 py-2 font-semibold text-white transition-colors hover:bg-orange-600"
            >
              Listings <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/categories"
              className="inline-flex w-32 items-center justify-center gap-2 rounded-full bg-yellow-400 px-5 py-2 font-semibold text-black transition-colors hover:bg-yellow-500"
            >
              Index <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pt-8 pb-12">
        <h2 className="font-display text-3xl tracking-tight">The Process</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.heading} className="rounded-2xl border border-white/10 bg-neutral-900 p-5">
              <s.icon className="h-6 w-6 text-white" />
              <h3 className="mt-3 font-display text-xl tracking-tight">{s.heading}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white">{s.text}</p>
            </div>
          ))}
        </div>
      </section>


    </div>
  );
}
