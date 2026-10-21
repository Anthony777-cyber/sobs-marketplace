import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, MessageSquare, Shield, Tag } from 'lucide-react';

const STEPS = [
  {
    icon: Tag,
    heading: 'List',
    text: [
      'Punt your junk, spares, rare parts, or collectibles.',
      'Get 3 photos and an ultra searchable listing system.',
      'No sign-ups, no passwords and no cookies for buyers.',
      'We take no commission on sales profit.',
    ],
  },
  {
    icon: Clock,
    heading: 'Pay',
    text: [
      'How long you list is how much you pay.',
      'All shown in your own currency.',
      'When time is up, your post hides. You have one week to save it or renew it.',
    ],
  },
  {
    icon: MessageSquare,
    heading: 'Chat',
    text: [
      'Buyers message you directly on your listing.',
      'Take the conversation offsite if you want.',
      'It is your business, not ours. We just help buyers find you.',
      'Be kind. Manners maketh man.',
    ],
  },
  {
    icon: Shield,
    heading: 'Control',
    text: [
      'Downvote inappropriate listings; enough votes remove them.',
      'S.O.B.S does not condone criminal behaviour.',
      'Downvoted listings are not refunded.',
      'We will never give out your identity to anyone unless lawfully obliged to.',
    ],
  },
];

export default function Process() {
  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap gap-3">
          <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold transition-colors hover:bg-white/10">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
        </div>
        <div className="mt-8 flex items-center justify-between gap-4">
          <h1 className="font-display text-4xl tracking-tight">The Process</h1>
          <Link to="/rules" className="inline-flex shrink-0 items-center rounded-full border-2 border-white bg-black px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-900">
            Rules
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <section key={step.heading} className="rounded-2xl border border-white/10 bg-neutral-900 p-5">
              <div className="flex items-center gap-3">
                <step.icon className="h-6 w-6 text-white" />
                <h2 className="font-display text-xl tracking-tight">{step.heading}</h2>
              </div>
              <ul className="mt-2 list-disc pl-5 text-sm leading-relaxed text-white">
                {step.text.map((item) => <li key={item} className="whitespace-pre-line">{item}</li>)}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
