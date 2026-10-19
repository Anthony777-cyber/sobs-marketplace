import { Link } from 'react-router-dom';
import { Tag, Clock, MessageSquare, Shield, ArrowRight } from 'lucide-react';

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

export default function Splash() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
        <div className="flex flex-col leading-none">
          <span className="font-display text-7xl tracking-tight sm:text-8xl">S<span className="font-sans font-bold">.</span>O<span className="font-sans font-bold">.</span>B<span className="font-sans font-bold">.</span>S</span>
          <span className="mt-1 grid w-full grid-cols-4 items-center text-xs font-semibold text-white sm:text-sm">
            <span className="relative -left-[12%] text-center">SELL</span>
            <span className="relative -left-[2%] text-center">OLD</span>
            <span className="relative left-[8%] text-center">BROKEN</span>
            <span className="relative left-[13%] text-center">STUFF</span>
          </span>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 pb-0 pt-1 sm:pt-2">
          <div className="flex items-center gap-8">
            <h1 className="font-display text-2xl leading-tight tracking-tight sm:text-4xl">
              List it, chat it, sell it.
            </h1>
          </div>
          <div className="mt-4 flex w-full max-w-[24rem] flex-col items-start gap-0 sm:inline-flex sm:w-auto sm:max-w-none">
            <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto sm:gap-[2%]">
            <Link
              to="/seller-login"
              className="inline-flex w-full items-center justify-center rounded-full bg-red-600 px-2 py-2 font-semibold text-black transition-colors hover:bg-red-700 sm:w-32 sm:px-5"
            >
              Login
            </Link>
            <Link
              to="/manage-listings"
              className="inline-flex w-full items-center justify-center rounded-full bg-red-600 px-2 py-2 font-semibold text-black transition-colors hover:bg-red-700 sm:w-32 sm:px-5"
            >
              Manage
            </Link>
            <Link
              to="/rules"
              className="inline-flex w-full items-center justify-center rounded-full bg-white px-2 py-2 font-semibold text-black transition-colors hover:bg-gray-100 sm:w-32 sm:px-5"
            >
              Rules
            </Link>
            </div>
            <div className="mt-[1.725%] grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto sm:gap-[2%]">
            <Link
              to={
                sessionStorage.getItem('sobs_global_user_key') && sessionStorage.getItem('sobs_seller_session_token')
                  ? '/sifter-mk4'
                  : sessionStorage.getItem('sobs_global_user_key')
                    ? '/seller-login'
                    : '/sell-info'
              }
              className="inline-flex w-full items-center justify-center gap-1 rounded-full bg-red-600 px-1 py-2 font-semibold text-black transition-colors hover:bg-red-700 sm:w-32 sm:gap-2 sm:px-5"
            >
              List <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/browse"
              className="inline-flex w-full items-center justify-center gap-1 rounded-full bg-orange-500 px-1 py-2 font-semibold text-black transition-colors hover:bg-orange-600 sm:w-32 sm:gap-2 sm:px-5"
            >
              Listings <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/categories"
              className="inline-flex w-full items-center justify-center gap-1 rounded-full bg-yellow-400 px-1 py-2 font-semibold text-black transition-colors hover:bg-yellow-500 sm:w-32 sm:gap-2 sm:px-5"
            >
              Index <ArrowRight className="h-4 w-4" />
            </Link>
            </div>
          </div>
          <div className="w-full">
          <p className="mt-5 w-full text-base leading-7 text-white text-justify sm:text-xl sm:leading-relaxed text-pretty">
            S∙O∙B∙S∙ is the ultra-searchable directory of <strong className="text-xl font-bold sm:text-2xl">EVERYTHING</strong>.
          </p>

          <p className="w-full text-base leading-7 text-white text-justify sm:text-xl sm:leading-relaxed text-pretty">
            Junk, spares or repair machines or cars, or good ones too, rare parts, collectables, art, Pokemon cards, your precious collection of Coca-Cola bottle tops. So long as it's legal, we don't discriminate. Anything that you think is worth the listing fee. For instance, you're in a band and want to advertise your next three months' gigs for a buck, cool.<br /> This is a repository of information as well as things.
          </p>

          <p className="w-full text-base leading-7 text-white text-justify sm:text-xl sm:leading-relaxed text-pretty">
            We don't do <em className="font-serif font-semibold">free ads</em>. As if it's not worth the few bucks it costs to list it, then we're quite happy to let Gumtree or Facebook bottom-feed off it.
          </p>

          <p className="w-full text-base leading-7 text-white text-justify sm:text-xl sm:leading-relaxed text-pretty">
            <span className="text-yellow-400">To browsers and buyers, we offer</span><br /> <strong className="font-extrabold"><span className="text-yellow-400">ZERO-FRICTION ENTRY</span><br /><span className="text-red-500">NO sign-up, NO passwords, NO cookies, NO ads.</span></strong>
          </p>

          <p className="w-full text-base leading-7 text-white text-justify sm:text-xl sm:leading-relaxed text-pretty">
            To sellers, we offer worldwide advertising dirt cheap,<br /> bulk uploads for the pros, and best of all, unlike eBay,<br /> we don't take a cut of your profit.
          </p>
          </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pt-8 pb-12">
        <h2 className="font-display text-3xl tracking-tight">The Process</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.heading} className="rounded-2xl border border-white/10 bg-neutral-900 p-5">
              <div className="flex items-center gap-3">
                <s.icon className="h-6 w-6 text-white" />
                <h3 className="font-display text-xl tracking-tight">{s.heading}</h3>
              </div>
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
