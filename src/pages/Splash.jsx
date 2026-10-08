import React from 'react';
import { Link } from 'react-router-dom';
import { Tag, Clock, MessageSquare, Shield, ArrowRight } from 'lucide-react';

const STEPS = [
  {
    icon: Tag,
    heading: 'List',
    text: [
      "Punt your junk, spares, or rare parts.",
      "Buyers contact you directly.",
      "Get 3 photos and an ultra searchable listing system.",
      "No sign-ups, no passwords and no cookies for buyers.",
      "Just like an ad in the back of a newspaper—free to access, free to read, and no hassle.",
      "We take no commission on sales profit.",
    ],
  },
  {
    icon: Clock,
    heading: 'Pay',
    text: [
      `How long you list is how much you pay.
Choose your tier:
€1 for 3 months (minimum)
€2 for 6 months
€3 for 9 months
€4 for a full year.
All shown in your own currency.` ,
      "When time is up, your post hides. You have one week to save it or renew it.",
    ],
  },
  {
    icon: MessageSquare,
    heading: 'Chat',
    text: [
      "Buyers message you directly on your listing.",
      "Take the conversation offsite if you want.",
      "We stay out of your conversations.",
      "It is your business, not ours. We just help buyers find you.",
      "Be kind. Manners maketh man.",
    ],
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
          <span className="mt-1 grid w-full grid-cols-4 items-center text-xs font-semibold text-white sm:text-sm">
            <span className="text-center">SELL</span>
            <span className="text-center">OLD</span>
            <span className="text-center">BROKEN</span>
            <span className="text-center">STUFF</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/seller-login"
            className="inline-flex w-24 items-center justify-center rounded-full bg-red-600 px-5 py-2 font-semibold text-black transition-colors hover:bg-red-700"
          >
            Login
          </Link>
          <Link
            to="/manage-listings"
            className="inline-flex w-24 items-center justify-center rounded-full bg-red-600 px-5 py-2 font-semibold text-black transition-colors hover:bg-red-700"
          >
            Manage
          </Link>
          <Link
            to="/rules"
            className="inline-flex w-24 items-center justify-center rounded-full bg-white px-5 py-2 font-semibold text-black transition-colors hover:bg-gray-100"
          >
            Rules
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 pb-0 pt-1 sm:pt-2">
          <div className="flex items-center gap-8">
            <h1 className="font-display text-2xl leading-tight tracking-tight sm:text-4xl">
              List it, chat it, sell it.
            </h1>
          </div>
          <div className="relative left-0 w-[calc(100vw-24rem)]">
          <p className="mt-5 w-full text-lg leading-relaxed text-white sm:text-xl text-left">
            S∙O∙B∙S∙ is the ultra-searchable directory of EVERYTHING.
          </p>

          <p className="w-full text-lg leading-relaxed text-white sm:text-xl text-left">
            Junk, spares, repair machines or cars, rare parts, collectables, art, Pokemon cards, your precious collection of Coca-Cola bottle tops. So long as it's legal, we don't discriminate. Anything you think is worth the listing fee. For instance, you're in a band and want to advertise your next three months' gigs for a buck, cool. Or the next year, or however long you want. This is a repository of information as well as things.
          </p>

          <p className="w-full text-lg leading-relaxed text-white sm:text-xl text-left">
            We don't do free ads. If it's not worth the few bucks it costs to advertise,<br />we're quite happy to let Gumtree or Facebook bottom-feed off it.
          </p>

          <p className="w-full text-lg leading-relaxed text-white sm:text-xl text-left">
            To browsers and buyers, we offer <strong className="font-extrabold">ZERO FRICTION ENTRY<br />NO sign up, NO passwords, NO cookies, NO ads.</strong>
          </p>

          <p className="w-full text-lg leading-relaxed text-white sm:text-xl text-left">
            To sellers, we offer worldwide advertising dirt cheap, bulk uploads for the pros, and best of all,<br />unlike eBay, we don't take a cut of your sale profits.
          </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to={
                sessionStorage.getItem('sobs_global_user_key')
                  ? '/create'
                  : '/sell-info'
              }
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
      </section>

      <section className="mx-auto max-w-5xl px-4 pt-8 pb-12">
        <h2 className="font-display text-3xl tracking-tight">The Process</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.heading} className="rounded-2xl border border-white/10 bg-neutral-900 p-5">
              <s.icon className="h-6 w-6 text-white" />
              <h3 className="mt-3 font-display text-xl tracking-tight">{s.heading}</h3>
              {Array.isArray(s.text) ? (
                <ul className="mt-2 list-disc pl-5 text-sm leading-relaxed text-white">
                  {s.text.map((item) => <li key={item} className="whitespace-pre-line">{item}</li>)}
                </ul>
              ) : (
                <p className="mt-2 text-sm leading-relaxed text-white">{s.text}</p>
              )}
            </div>
          ))}
        </div>
      </section>


    </div>
  );
}
