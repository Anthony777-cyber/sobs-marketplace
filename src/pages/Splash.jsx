import React from 'react';
import { Link } from 'react-router-dom';
import { Tag, Clock, MessageSquare, Shield, ArrowRight } from 'lucide-react';

const STEPS = [
  {
    icon: Tag,
    heading: 'List',
    text: [
      "Punt your junk, spares, or rare parts.",
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
    text: [
      "Downvote inappropriate listings.",
      "Enough downvotes and the listing gets the guillotine.",
      "Abuse of the downvote will be frowned upon.",
      "S.O.B.S does not condone criminal behaviour.",
      "Downvoted listings are not refunded.",
      "We will never give out your identity to anyone unless lawfully obliged to.",
    ],
  },
];

const FONT_CHOICES = {
  inter: { label: 'Inter', family: "'Inter', ui-sans-serif, system-ui, sans-serif" },
  lato: { label: 'Lato', family: "'Lato', sans-serif" },
  sourceSans: { label: 'Source Sans 3', family: "'Source Sans 3', sans-serif" },
  montserrat: { label: 'Montserrat', family: "'Montserrat', sans-serif" },
  nunito: { label: 'Nunito Sans', family: "'Nunito Sans', sans-serif" },
  roboto: { label: 'Roboto', family: "'Roboto', sans-serif" },
  raleway: { label: 'Raleway', family: "'Raleway', sans-serif" },
  oswald: { label: 'Oswald', family: "'Oswald', sans-serif" },
  lora: { label: 'Lora', family: "'Lora', serif" },
  merriweather: { label: 'Merriweather', family: "'Merriweather', serif" },
  playfair: { label: 'Playfair Display', family: "'Playfair Display', serif" },
  robotoSlab: { label: 'Roboto Slab', family: "'Roboto Slab', serif" },
  display: { label: 'Archivo Black', family: "'Archivo Black', ui-sans-serif, system-ui, sans-serif" },
};

const FONT_STYLESHEET_URL = 'https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Lato:ital,wght@0,400;0,700;1,400;1,700&family=Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Nunito+Sans:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=Roboto:ital,wght@0,400;0,500;0,700;1,400;1,500;1,700&family=Raleway:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Oswald:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=Merriweather:ital,wght@0,400;0,700;1,400;1,700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Roboto+Slab:wght@400;500;600;700&display=swap';

export default function Splash() {
  const [previewFont, setPreviewFont] = React.useState('inter');

  React.useEffect(() => {
    if (!import.meta.env.DEV) return undefined;
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = FONT_STYLESHEET_URL;
    document.head.appendChild(stylesheet);
    return () => stylesheet.remove();
  }, []);

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
          {import.meta.env.DEV && (
            <div className="mb-4 flex justify-end">
              <label className="flex items-center gap-2 text-sm text-white/70">
                Preview font
                <select
                  value={previewFont}
                  onChange={(event) => setPreviewFont(event.target.value)}
                  className="rounded border border-white/30 bg-neutral-900 px-2 py-1 text-white"
                >
                  {Object.entries(FONT_CHOICES).map(([value, font]) => (
                    <option key={value} value={value}>{font.label}</option>
                  ))}
                </select>
              </label>
            </div>
          )}
          <div className="flex items-center gap-8">
            <h1 className="font-display text-2xl leading-tight tracking-tight sm:text-4xl">
              List it, chat it, sell it.
            </h1>
          </div>
          <div
            className={`w-full ${import.meta.env.DEV ? 'splash-font-preview' : ''}`}
            style={import.meta.env.DEV ? { '--splash-preview-font': FONT_CHOICES[previewFont].family } : undefined}
          >
          <p className="mt-5 w-full text-lg leading-relaxed text-white sm:text-xl text-justify text-pretty">
            S∙O∙B∙S∙ is the ultra-searchable directory of <strong className="text-xl font-bold sm:text-2xl">EVERYTHING</strong>.
          </p>

          <p className="w-full text-lg leading-relaxed text-white sm:text-xl text-justify text-pretty">
            Junk, spares or repair machines or cars, or good ones too,<br /> rare parts, collectables, art, Pokemon cards,<br /> your precious collection of Coca-Cola bottle tops.<br /> So long as it's legal, we don't discriminate.<br /> Anything that you think is worth the listing fee.<br /> <br /> For instance, you're in a band and want to advertise<br /> your next three months' gigs for a buck, cool.<br /> Or the next year, or however long you want.<br /> This is a repository of information as well as things.<br /> <br />
          </p>

          <p className="w-full text-lg leading-relaxed text-white sm:text-xl text-justify text-pretty">
            We don't do <em className="font-serif font-semibold">free ads</em>. As if it's not worth the few bucks it costs to list it,<br />then we're quite happy to let Gumtree or Facebook bottom-feed off it.
          </p>

          <p className="w-full text-lg leading-relaxed text-white sm:text-xl text-justify text-pretty">
            <span className="text-yellow-400">To browsers and buyers, we offer</span> <strong className="font-extrabold"><span className="text-yellow-400">ZERO-FRICTION ENTRY:</span><br /><span className="text-red-500">NO sign-up, NO passwords, NO cookies, NO ads.</span></strong>
          </p>

          <p className="w-full text-lg leading-relaxed text-white sm:text-xl text-justify text-pretty">
            To sellers, we offer worldwide advertising dirt cheap,<br /> bulk uploads for the pros, and best of all,<br />unlike eBay, we don't take a cut of your profit.
          </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to={
                sessionStorage.getItem('sobs_global_user_key') && sessionStorage.getItem('sobs_seller_session_token')
                  ? '/sifter-mk4'
                  : sessionStorage.getItem('sobs_global_user_key')
                    ? '/seller-login'
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
